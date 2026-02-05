<?php
/**
 * Check if order_index column exists and show sample data
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
    
    // Check if column exists
    $checkSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                  AND TABLE_NAME = 'products' 
                  AND COLUMN_NAME = 'order_index'";
    
    $checkResult = $conn->query($checkSql);
    if (!$checkResult) {
        throw new Exception('Error checking column: ' . $conn->error);
    }
    
    $row = $checkResult->fetch_assoc();
    $columnExists = $row['count'] > 0;
    
    $result = [
        'column_exists' => $columnExists,
        'message' => $columnExists ? 'order_index column exists' : 'order_index column does NOT exist - run add_order_index_field.php first'
    ];
    
    if ($columnExists) {
        // Get sample products with order_index
        $sampleSql = "SELECT id, name, order_index, created_at FROM products ORDER BY COALESCE(order_index, 999999) ASC, created_at DESC LIMIT 10";
        $sampleResult = $conn->query($sampleSql);
        $samples = [];
        if ($sampleResult) {
            while ($sampleRow = $sampleResult->fetch_assoc()) {
                $samples[] = $sampleRow;
            }
        }
        $result['sample_products'] = $samples;
        
        // Get category example
        $category = isset($_GET['category']) ? $conn->real_escape_string($_GET['category']) : 'adjustable-pedestal';
        $categorySql = "SELECT p.id, p.name, p.order_index, p.created_at 
                        FROM products p 
                        LEFT JOIN categories c ON p.category_id = c.id 
                        WHERE c.slug = '$category' AND p.status = 'active'
                        ORDER BY COALESCE(p.order_index, 999999) ASC, p.created_at DESC";
        $categoryResult = $conn->query($categorySql);
        $categoryProducts = [];
        if ($categoryResult) {
            while ($catRow = $categoryResult->fetch_assoc()) {
                $categoryProducts[] = $catRow;
            }
        }
        $result['category_example'] = [
            'category' => $category,
            'products' => $categoryProducts
        ];
    }
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}

$conn->close();
?>
