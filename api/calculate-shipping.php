<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid data']);
        exit();
    }
    
    $state = strtoupper($data['state'] ?? '');
    $items = $data['items'] ?? [];
    $totalSqft = floatval($data['total_sqft'] ?? 0);
    
    if (!$state) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'State is required']);
        exit();
    }
    
    if (empty($items) || !is_array($items)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Items array is required']);
        exit();
    }
    
    // Fetch product details from database for accurate weight and category
    $productIds = array_filter(array_map(function($item) {
        return isset($item['id']) ? intval($item['id']) : null;
    }, $items));
    
    $productsData = [];
    if (!empty($productIds)) {
        $idsString = implode(',', $productIds);
        $sql = "SELECT id, name, weight_lbs, category_id, 
                (SELECT name FROM categories WHERE id = products.category_id) as category_name
                FROM products WHERE id IN ($idsString)";
        $result = $conn->query($sql);
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $productsData[$row['id']] = $row;
            }
        }
    }
    
    // Realistic US freight shipping base rates (based on actual FedEx/UPS Ground rates 2024)
    // Base rate covers first 50 lbs, then additional weight is charged per pound
    $stateRates = [
        // Northeast (close to NY) - Lower rates
        'NY' => 25.00, 'NJ' => 28.00, 'CT' => 30.00, 'PA' => 35.00, 'MA' => 38.00,
        'RI' => 40.00, 'NH' => 42.00, 'VT' => 45.00, 'ME' => 48.00, 'MD' => 32.00,
        'DE' => 30.00,
        
        // Mid-Atlantic & Southeast - Medium rates
        'VA' => 40.00, 'NC' => 45.00, 'SC' => 48.00, 'GA' => 50.00, 'FL' => 55.00,
        'AL' => 52.00, 'MS' => 50.00, 'LA' => 52.00, 'AR' => 48.00, 'TN' => 42.00,
        'KY' => 38.00, 'WV' => 40.00,
        
        // Midwest - Medium rates
        'OH' => 38.00, 'MI' => 42.00, 'IN' => 40.00, 'IL' => 45.00, 'WI' => 48.00,
        'MN' => 52.00, 'IA' => 45.00, 'MO' => 48.00, 'KS' => 50.00, 'NE' => 52.00,
        'ND' => 55.00, 'SD' => 53.00,
        
        // Southwest - Higher rates
        'TX' => 60.00, 'OK' => 55.00, 'NM' => 65.00, 'AZ' => 68.00, 'CO' => 58.00,
        'UT' => 62.00, 'NV' => 70.00,
        
        // West Coast - Highest rates (but realistic)
        'CA' => 75.00, 'OR' => 72.00, 'WA' => 78.00, 'ID' => 65.00, 'MT' => 68.00,
        'WY' => 62.00,
        
        // Remote states - Premium rates
        'HI' => 150.00, 'AK' => 180.00,
        
        // Default for other states
        'DEFAULT' => 50.00
    ];
    
    // Get base rate for state
    $baseRate = $stateRates[$state] ?? $stateRates['DEFAULT'];
    
    // Calculate total weight from actual product data
    $totalWeight = 0;
    $hasWeightData = false;
    
    foreach ($items as $item) {
        $productId = isset($item['id']) ? intval($item['id']) : 0;
        $quantity = intval($item['quantity'] ?? 1);
        
        // Get product data from database if available
        $productData = isset($productsData[$productId]) ? $productsData[$productId] : null;
        $weight = 0;
        
        if ($productData) {
            // Use actual weight from database
            $weight = floatval($productData['weight_lbs'] ?? 0);
        } else {
            // Fallback to item data
            $weight = floatval($item['weight_lbs'] ?? 0);
        }
        
        if ($weight > 0) {
            $hasWeightData = true;
            $totalWeight += $weight * $quantity;
        }
    }
    
    // If no weight data at all, return fixed $90 shipping
    if (!$hasWeightData || $totalWeight === 0) {
        $shippingCost = 90.00;
        echo json_encode([
            'success' => true,
            'shippingCost' => number_format($shippingCost, 2, '.', ''),
            'method' => 'fixed',
            'message' => 'Estimated shipping cost (fixed rate)',
            'note' => 'This is an estimated shipping cost. For exact pricing, please contact us via WhatsApp or phone.'
        ]);
        exit();
    }
    
    // Realistic shipping cost calculation based on actual US freight rates (FedEx/UPS Ground)
    // Weight-based calculation (more accurate)
    if ($totalWeight > 0) {
        // Real freight rates: First 50 lbs at base rate, then $0.50-$0.80 per additional lb
        if ($totalWeight <= 50) {
            $shippingCost = $baseRate;
        } else {
            $first50lbs = $baseRate;
            $additionalWeight = $totalWeight - 50;
            
            // Realistic tiered pricing (based on actual FedEx/UPS Ground rates)
            // 51-100 lbs: $0.60 per lb
            // 101-200 lbs: $0.55 per lb
            // 201-500 lbs: $0.50 per lb
            // 500+ lbs: $0.45 per lb (better rates for bulk)
            if ($additionalWeight <= 50) {
                $additionalCost = $additionalWeight * 0.60;
            } elseif ($additionalWeight <= 150) {
                $additionalCost = (50 * 0.60) + (($additionalWeight - 50) * 0.55);
            } elseif ($additionalWeight <= 450) {
                $additionalCost = (50 * 0.60) + (100 * 0.55) + (($additionalWeight - 150) * 0.50);
            } else {
                $additionalCost = (50 * 0.60) + (100 * 0.55) + (300 * 0.50) + (($additionalWeight - 450) * 0.45);
            }
            
            $shippingCost = $first50lbs + $additionalCost;
        }
    } else {
        // If no weight data, use sqft-based calculation (more conservative, realistic rates)
        // Based on industry research: Building materials typically $0.30-$0.80 per sqft for freight
        // We use conservative rates to avoid overcharging
        
        if ($totalSqft > 0) {
            // More realistic sqft pricing (based on actual freight rates)
            if ($totalSqft <= 50) {
                $shippingCost = $totalSqft * 0.70; // $0.70 per sqft for small orders
            } elseif ($totalSqft <= 200) {
                $shippingCost = (50 * 0.70) + (($totalSqft - 50) * 0.60); // $0.60 for medium
            } elseif ($totalSqft <= 500) {
                $shippingCost = (50 * 0.70) + (150 * 0.60) + (($totalSqft - 200) * 0.50); // $0.50 for large
            } else {
                $shippingCost = (50 * 0.70) + (150 * 0.60) + (300 * 0.50) + (($totalSqft - 500) * 0.40); // $0.40 for bulk
            }
            
            // Apply state-based distance adjustment (more conservative)
            $distanceMultipliers = [
                'NY' => 1.0, 'NJ' => 1.05, 'CT' => 1.08, 'PA' => 1.10, 'MA' => 1.12,
                'FL' => 1.25, 'CA' => 1.30, 'TX' => 1.22, 'WA' => 1.35, 'OR' => 1.32,
                'HI' => 2.0, 'AK' => 2.3
            ];
            $multiplier = $distanceMultipliers[$state] ?? 1.15;
            $shippingCost = $shippingCost * $multiplier;
        } else {
            // Final fallback: estimate based on item count (realistic per-item rate)
            $shippingCost = count($items) * 25.00; // $25 per item as fallback
        }
    }
    
    // Minimum shipping cost (realistic minimums)
    $minShipping = $state === 'NY' ? 20.00 : ($state === 'HI' || $state === 'AK' ? 60.00 : 25.00);
    $shippingCost = max($shippingCost, $minShipping);
    
    // Cap maximum shipping to prevent unrealistic costs (more reasonable limits)
    $maxShipping = ($state === 'HI' || $state === 'AK') ? 600.00 : 300.00;
    $shippingCost = min($shippingCost, $maxShipping);
    
    // Round to 2 decimal places
    $shippingCost = round($shippingCost, 2);
    
    $response = [
        'success' => true,
        'shipping_cost' => $shippingCost,
        'estimated_weight' => round($totalWeight, 2),
        'estimated_sqft' => $totalSqft,
        'state' => $state,
        'calculation_method' => $totalWeight > 0 ? 'weight_based' : 'sqft_based',
        'message' => 'This is an AI-calculated estimate based on industry-standard freight rates. Final shipping cost may vary. Contact us for accurate quotes.'
    ];
    
    echo json_encode($response);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

$conn->close();
?>

