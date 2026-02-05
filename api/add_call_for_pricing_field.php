<?php
/**
 * Add call_for_pricing field to products table
 * Run this script once to add call_for_pricing column
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
                  AND COLUMN_NAME = 'call_for_pricing'";
    
    $checkResult = $conn->query($checkSql);
    if (!$checkResult) {
        throw new Exception('Error checking column: ' . $conn->error);
    }
    
    $row = $checkResult->fetch_assoc();
    
    if ($row['count'] >= 1) {
        echo json_encode([
            'success' => true,
            'message' => 'call_for_pricing field already exists in products table',
            'skipped' => true
        ]);
        $conn->close();
        exit();
    }
    
    // Add column if it doesn't exist
    $sql = "ALTER TABLE products ADD COLUMN call_for_pricing TINYINT(1) DEFAULT 0 AFTER catalog_mode";
    
    if ($conn->query($sql)) {
        echo json_encode([
            'success' => true,
            'message' => 'call_for_pricing field added successfully to products table',
            'sql' => $sql
        ], JSON_PRETTY_PRINT);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to add column: ' . $conn->error,
            'sql' => $sql
        ], JSON_PRETTY_PRINT);
    }
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

