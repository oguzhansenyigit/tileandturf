<?php
/**
 * Add SKU field to products table
 * Run this script once to add the SKU column to your products table
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    // Check if SKU column already exists
    $checkSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                  AND TABLE_NAME = 'products' 
                  AND COLUMN_NAME = 'sku'";
    
    $checkResult = $conn->query($checkSql);
    $row = $checkResult->fetch_assoc();
    
    if ($row['count'] > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'SKU column already exists in products table',
            'skipped' => true
        ]);
        $conn->close();
        exit();
    }
    
    // Add SKU column
    $sql = "ALTER TABLE products ADD COLUMN sku VARCHAR(100) NULL AFTER id";
    
    if ($conn->query($sql)) {
        // Add index for better search performance
        $indexSql = "CREATE INDEX idx_sku ON products(sku)";
        $conn->query($indexSql); // Ignore error if index already exists
        
        echo json_encode([
            'success' => true,
            'message' => 'SKU column added successfully to products table'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to add SKU column: ' . $conn->error
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$conn->close();
?>

