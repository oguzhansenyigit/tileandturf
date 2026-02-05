<?php
/**
 * Add package fields to products table
 * Run this script once to add is_packaged and pack_size columns
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
    
    // Check if columns already exist
    $checkSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                  AND TABLE_NAME = 'products' 
                  AND COLUMN_NAME IN ('is_packaged', 'pack_size')";
    
    $checkResult = $conn->query($checkSql);
    if (!$checkResult) {
        throw new Exception('Error checking columns: ' . $conn->error);
    }
    
    $row = $checkResult->fetch_assoc();
    
    if ($row['count'] >= 2) {
        echo json_encode([
            'success' => true,
            'message' => 'Package fields already exist in products table',
            'skipped' => true
        ]);
        $conn->close();
        exit();
    }
    
    // Add columns if they don't exist
    $alterations = [];
    
    // Check and add is_packaged
    $checkPackaged = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                      WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                      AND TABLE_NAME = 'products' 
                      AND COLUMN_NAME = 'is_packaged'";
    $result = $conn->query($checkPackaged);
    if (!$result) {
        throw new Exception('Error checking is_packaged column: ' . $conn->error);
    }
    $row = $result->fetch_assoc();
    if ($row['count'] == 0) {
        $alterations[] = "ADD COLUMN is_packaged TINYINT(1) DEFAULT 0 AFTER catalog_mode";
    }
    
    // Check and add pack_size
    $checkPackSize = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                      WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                      AND TABLE_NAME = 'products' 
                      AND COLUMN_NAME = 'pack_size'";
    $result = $conn->query($checkPackSize);
    if (!$result) {
        throw new Exception('Error checking pack_size column: ' . $conn->error);
    }
    $row = $result->fetch_assoc();
    if ($row['count'] == 0) {
        $alterations[] = "ADD COLUMN pack_size DECIMAL(10, 2) DEFAULT 1 AFTER is_packaged";
    }
    
    if (count($alterations) > 0) {
        $sql = "ALTER TABLE products " . implode(', ', $alterations);
        
        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'Package fields added successfully to products table',
                'added' => count($alterations),
                'sql' => $sql
            ], JSON_PRETTY_PRINT);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to add columns: ' . $conn->error,
                'sql' => $sql
            ], JSON_PRETTY_PRINT);
        }
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'All columns already exist',
            'skipped' => true
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

