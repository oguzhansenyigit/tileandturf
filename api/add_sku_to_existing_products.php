<?php
/**
 * Add SKU codes to all existing products
 * Run this script once to add SKU codes to all products that don't have one
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    // Check if SKU column exists
    $checkSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                  AND TABLE_NAME = 'products' 
                  AND COLUMN_NAME = 'sku'";
    
    $checkResult = $conn->query($checkSql);
    $row = $checkResult->fetch_assoc();
    
    if ($row['count'] == 0) {
        // Add SKU column first
        $alterSql = "ALTER TABLE products ADD COLUMN sku VARCHAR(100) NULL AFTER id";
        if (!$conn->query($alterSql)) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to add SKU column: ' . $conn->error
            ]);
            $conn->close();
            exit();
        }
        
        // Add index for better search performance
        $indexSql = "CREATE INDEX idx_sku ON products(sku)";
        $conn->query($indexSql); // Ignore error if index already exists
    }
    
    // Get all products without SKU
    $getProductsSql = "SELECT id FROM products WHERE sku IS NULL OR sku = ''";
    $productsResult = $conn->query($getProductsSql);
    
    $updatedCount = 0;
    $errors = [];
    
    if ($productsResult && $productsResult->num_rows > 0) {
        while ($product = $productsResult->fetch_assoc()) {
            $productId = $product['id'];
            $sku = 'PROD-' . str_pad($productId, 6, '0', STR_PAD_LEFT);
            
            $updateSql = "UPDATE products SET sku = '$sku' WHERE id = $productId";
            if ($conn->query($updateSql)) {
                $updatedCount++;
            } else {
                $errors[] = "Failed to update product ID $productId: " . $conn->error;
            }
        }
    }
    
    // Get total products count
    $totalSql = "SELECT COUNT(*) as total FROM products";
    $totalResult = $conn->query($totalSql);
    $totalProducts = $totalResult ? $totalResult->fetch_assoc()['total'] : 0;
    
    echo json_encode([
        'success' => true,
        'message' => "SKU codes added successfully",
        'updated' => $updatedCount,
        'total_products' => $totalProducts,
        'errors' => $errors
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$conn->close();
?>

