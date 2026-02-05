<?php
/**
 * Add gift_product_id field to products table
 * Run this script once to add gift_product_id column
 */

// Suppress headers from config.php if they exist
ob_start();

require_once 'config.php';

// Clear any output from config.php
ob_end_clean();

// Set our own headers
if (!headers_sent()) {
    header('Content-Type: application/json');
}

try {
    // Check database connection
    if (!$conn) {
        throw new Exception('Database connection failed');
    }
    
    // Check if column already exists
    $checkSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                  AND TABLE_NAME = 'products' 
                  AND COLUMN_NAME = 'gift_product_id'";
    
    $checkResult = $conn->query($checkSql);
    if (!$checkResult) {
        throw new Exception('Error checking column: ' . $conn->error);
    }
    
    $row = $checkResult->fetch_assoc();
    
    if ($row['count'] >= 1) {
        echo json_encode([
            'success' => true,
            'message' => 'Gift product field already exists in products table',
            'skipped' => true
        ]);
        $conn->close();
        exit();
    }
    
    // Add column if it doesn't exist
    $alterSql = "ALTER TABLE products ADD COLUMN gift_product_id INT(11) NULL DEFAULT NULL AFTER call_for_pricing,
                 ADD INDEX idx_gift_product_id (gift_product_id),
                 ADD CONSTRAINT fk_gift_product FOREIGN KEY (gift_product_id) REFERENCES products(id) ON DELETE SET NULL";
    
    if ($conn->query($alterSql)) {
        echo json_encode([
            'success' => true,
            'message' => 'Gift product field added successfully to products table'
        ]);
    } else {
        // Try without foreign key constraint (in case of compatibility issues)
        $alterSqlNoFk = "ALTER TABLE products ADD COLUMN gift_product_id INT(11) NULL DEFAULT NULL AFTER call_for_pricing,
                         ADD INDEX idx_gift_product_id (gift_product_id)";
        
        if ($conn->query($alterSqlNoFk)) {
            echo json_encode([
                'success' => true,
                'message' => 'Gift product field added successfully (without foreign key constraint)'
            ]);
        } else {
            throw new Exception('Error adding gift product field: ' . $conn->error);
        }
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
