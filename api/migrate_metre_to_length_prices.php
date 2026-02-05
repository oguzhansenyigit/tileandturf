<?php
/**
 * Migrate Metre variation prices to length_prices field
 * This script:
 * 1. Removes "Metre" variation from products
 * 2. Adds length_prices JSON field to products
 * 3. Enables length_enabled for these products
 * 4. Sets length_prices with the metre-based prices
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    $results = [];

    // Product configurations with their length-based price lists
    $productConfigs = [
        [
            'name' => 'Ipe Lumber 1×3',
            'search_terms' => [
                "Ipe Lumber 1×3", "IPE Lumber 1×3", "Ipe Lumber 1x3", "IPE Lumber 1x3",
                "ipe lumber 1×3", "ipe lumber 1x3"
            ],
            'length_prices' => [
                3 => 10.36, 4 => 13.82, 5 => 17.27, 6 => 20.73, 7 => 24.18, 8 => 28.24,
                9 => 31.77, 10 => 35.30, 11 => 38.83, 12 => 42.36, 13 => 45.89, 14 => 49.42,
                15 => 60.84, 16 => 64.89, 17 => 68.95, 18 => 73.00, 19 => 79.91, 20 => 84.12,
                21 => 89.07, 22 => 93.31
            ]
        ],
        [
            'name' => 'Ipe Tropical Hardwood (1×2)',
            'search_terms' => [
                "Ipe Tropical Hardwood (1×2)", "IPE Tropical Hardwood (1×2)", "Ipe Tropical Hardwood (1x2)",
                "IPE Tropical Hardwood (1x2)", "ipe tropical hardwood 1×2", "ipe tropical hardwood 1x2",
                "Ipe Tropical Hardwood 1×2", "Ipe Tropical Hardwood 1x2"
            ],
            'length_prices' => [
                3 => 6.75, 4 => 9.00, 5 => 11.26, 6 => 13.51, 7 => 15.76, 8 => 18.40,
                9 => 20.70, 10 => 23.00, 11 => 25.30, 12 => 27.60, 13 => 29.90, 14 => 32.20,
                15 => 39.64, 16 => 42.28, 17 => 44.92, 18 => 47.57, 19 => 52.07, 20 => 54.81
            ]
        ],
        [
            'name' => 'Ipe 1×4',
            'search_terms' => [
                "Ipe 1×4", "IPE 1×4", "Ipe 1x4", "IPE 1x4", "ipe 1×4", "ipe 1x4",
                "Ipe Lumber 1×4", "IPE Lumber 1×4", "Ipe Lumber 1x4", "IPE Lumber 1x4"
            ],
            'length_prices' => [
                3 => 16.65, 4 => 22.20, 5 => 27.75, 6 => 33.30, 7 => 38.85, 8 => 45.36,
                9 => 51.03, 10 => 56.70, 11 => 62.37, 12 => 68.04, 13 => 73.71, 14 => 79.38,
                15 => 97.72, 16 => 104.23, 17 => 110.75, 18 => 117.26, 19 => 128.36, 20 => 135.11,
                21 => 143.06, 22 => 149.87, 23 => 157.99
            ]
        ],
        [
            'name' => 'Ipe 1×8',
            'search_terms' => [
                "Ipe 1×8", "IPE 1×8", "Ipe 1x8", "IPE 1x8", "ipe 1×8", "ipe 1x8",
                "Ipe Lumber 1×8", "IPE Lumber 1×8", "Ipe Lumber 1x8", "IPE Lumber 1x8"
            ],
            'length_prices' => [
                1 => 13.75, 2 => 27.50, 3 => 40.37, 4 => 53.83, 5 => 67.29, 6 => 80.74,
                7 => 94.20, 8 => 110.00, 9 => 123.75, 10 => 137.50, 11 => 151.25, 12 => 165.00,
                13 => 178.75, 14 => 192.50, 15 => 236.97, 16 => 252.77, 17 => 268.56, 18 => 284.36,
                19 => 311.28, 20 => 327.66, 21 => 346.93, 22 => 363.45, 23 => 383.13
            ]
        ],
        [
            'name' => 'Ipe 1×10',
            'search_terms' => [
                "Ipe 1×10", "IPE 1×10", "Ipe 1x10", "IPE 1x10", "ipe 1×10", "ipe 1x10",
                "Ipe Lumber 1×10", "IPE Lumber 1×10", "Ipe Lumber 1x10", "IPE Lumber 1x10"
            ],
            'length_prices' => [
                3 => 34.62, 4 => 46.16, 5 => 57.70, 6 => 69.23, 7 => 80.77, 8 => 94.32,
                9 => 106.11, 10 => 117.90, 11 => 129.69, 12 => 141.48, 13 => 153.27, 14 => 165.06,
                15 => 203.19, 16 => 216.74, 17 => 230.28, 18 => 243.83, 19 => 266.91, 20 => 280.95,
                21 => 297.48, 22 => 311.64, 23 => 328.52
            ]
        ],
        [
            'name' => 'Ipe 1×12',
            'search_terms' => [
                "Ipe 1×12", "IPE 1×12", "Ipe 1x12", "IPE 1x12", "ipe 1×12", "ipe 1x12",
                "Ipe Lumber 1×12", "IPE Lumber 1×12", "Ipe Lumber 1x12", "IPE Lumber 1x12"
            ],
            'length_prices' => [
                4 => 55.79, 5 => 69.73, 6 => 83.68, 7 => 97.63, 8 => 114.00, 9 => 128.25,
                10 => 142.50, 11 => 156.75, 12 => 171.00, 13 => 185.25, 14 => 199.50, 15 => 245.59,
                16 => 261.96, 17 => 278.33, 18 => 294.70, 19 => 322.60, 20 => 339.57, 21 => 359.55,
                22 => 376.67, 23 => 397.07
            ]
        ],
        [
            'name' => 'Ipe 5/4×6',
            'search_terms' => [
                "Ipe 5/4×6", "IPE 5/4×6", "Ipe 5/4x6", "IPE 5/4x6", "ipe 5/4×6", "ipe 5/4x6",
                "Ipe Lumber 5/4×6", "IPE Lumber 5/4×6", "Ipe Lumber 5/4x6", "IPE Lumber 5/4x6"
            ],
            'length_prices' => [
                3 => 28.67, 4 => 38.22, 5 => 47.78, 6 => 57.33, 7 => 66.89, 8 => 77.52,
                9 => 87.21, 10 => 96.90, 11 => 106.59, 12 => 116.28, 13 => 125.97, 14 => 135.66,
                15 => 159.46, 16 => 170.09, 17 => 180.72, 18 => 191.35, 19 => 207.09, 20 => 217.99,
                21 => 230.93, 22 => 241.92
            ]
        ]
    ];

    // Step 1: Check if length_prices column exists, if not, add it
    $checkColumnSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = '" . DB_NAME . "'
                        AND TABLE_NAME = 'products'
                        AND COLUMN_NAME = 'length_prices'";
    $checkColumnResult = $conn->query($checkColumnSql);
    $hasLengthPricesField = false;
    if ($checkColumnResult) {
        $row = $checkColumnResult->fetch_assoc();
        $hasLengthPricesField = $row['count'] > 0;
    }

    if (!$hasLengthPricesField) {
        $addColumnSql = "ALTER TABLE products ADD COLUMN length_prices TEXT NULL COMMENT 'JSON object with length-based prices' AFTER length_increment_price";
        if ($conn->query($addColumnSql)) {
            $results[] = "Added length_prices column to products table";
        } else {
            throw new Exception("Failed to add length_prices column: " . $conn->error);
        }
    }

    // Step 2: Find "Metre" variation ID to remove it later
    $checkVariationSql = "SELECT id FROM product_variations WHERE LOWER(name) = 'metre' OR LOWER(name) = 'meter' LIMIT 1";
    $variationResult = $conn->query($checkVariationSql);
    $metreVariationId = null;
    if ($variationResult && $variationResult->num_rows > 0) {
        $variation = $variationResult->fetch_assoc();
        $metreVariationId = $variation['id'];
        $results[] = "Found Metre variation (ID: $metreVariationId) - will remove from products";
    }

    // Step 3: Process each product
    foreach ($productConfigs as $config) {
        $product = null;
        $productName = $config['name'];
        $lengthPrices = $config['length_prices'];
        
        // Try to find product using search terms
        foreach ($config['search_terms'] as $searchTerm) {
            $searchSql = "SELECT * FROM products WHERE name LIKE '%" . $conn->real_escape_string($searchTerm) . "%' LIMIT 1";
            $productResult = $conn->query($searchSql);
            if ($productResult && $productResult->num_rows > 0) {
                $product = $productResult->fetch_assoc();
                break;
            }
        }

        if (!$product) {
            $results[] = "⚠ Product '{$productName}' not found. Skipping.";
            continue;
        }

        // Remove Metre variation from product if it exists
        $productVariations = [];
        if (!empty($product['variations'])) {
            $productVariations = json_decode($product['variations'], true);
            if (!is_array($productVariations)) {
                $productVariations = [];
            }
            
            // Remove Metre variation
            if ($metreVariationId && isset($productVariations[$metreVariationId])) {
                unset($productVariations[$metreVariationId]);
                $results[] = "Removed Metre variation from: {$product['name']}";
            }
        }

        // Convert length prices to JSON (keys as strings for JSON compatibility)
        $lengthPricesJson = json_encode($lengthPrices);
        $lengthPricesEscaped = $conn->real_escape_string($lengthPricesJson);
        $variationsJson = json_encode($productVariations);
        $variationsEscaped = $conn->real_escape_string($variationsJson);

        // Update product: enable length, set length_prices, remove metre variation
        $updateSql = "UPDATE products SET 
                      length_enabled = 1,
                      length_prices = '$lengthPricesEscaped',
                      variations = '$variationsEscaped'
                      WHERE id = {$product['id']}";

        if ($conn->query($updateSql)) {
            $results[] = "✓ Updated: {$product['name']} (ID: {$product['id']}) - Enabled length pricing with " . count($lengthPrices) . " length options";
        } else {
            $results[] = "✗ Failed to update: {$product['name']} - " . $conn->error;
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Migration complete: Metre variations removed, length_prices added',
        'details' => $results
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}

$conn->close();
?>
