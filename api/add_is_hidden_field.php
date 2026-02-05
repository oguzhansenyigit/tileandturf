<?php
/**
 * Add is_hidden field to products table
 * Run this script once to add is_hidden column
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
                  AND COLUMN_NAME = 'is_hidden'";
    
    $checkResult = $conn->query($checkSql);
    if (!$checkResult) {
        throw new Exception('Error checking column: ' . $conn->error);
    }
    
    $row = $checkResult->fetch_assoc();
    
    if ($row['count'] >= 1) {
        echo json_encode([
            'success' => true,
            'message' => 'is_hidden field already exists in products table',
            'skipped' => true
        ]);
        $conn->close();
        exit();
    }
    
    // Add column if it doesn't exist
    $alterSql = "ALTER TABLE products ADD COLUMN is_hidden TINYINT(1) DEFAULT 0 AFTER gift_product_id";
    
    if ($conn->query($alterSql)) {
        echo json_encode([
            'success' => true,
            'message' => 'is_hidden field added successfully to products table'
        ]);
    } else {
        throw new Exception('Error adding is_hidden field: ' . $conn->error);
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
