<?php
/**
 * Add length_prices field to products table
 * This field will store JSON data with length-based prices: {"3": 10.36, "4": 13.82, ...}
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    // Check if column already exists
    $checkSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = '" . DB_NAME . "'
                  AND TABLE_NAME = 'products'
                  AND COLUMN_NAME = 'length_prices'";

    $checkResult = $conn->query($checkSql);
    if (!$checkResult) {
        throw new Exception('Error checking column: ' . $conn->error);
    }

    $row = $checkResult->fetch_assoc();

    if ($row['count'] > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'length_prices field already exists in products table',
            'skipped' => true
        ]);
        $conn->close();
        exit();
    }

    // Add column if it doesn't exist
    $sql = "ALTER TABLE products ADD COLUMN length_prices TEXT NULL COMMENT 'JSON object with length-based prices: {\"3\": 10.36, \"4\": 13.82, ...}' AFTER length_increment_price";

    if ($conn->query($sql)) {
        echo json_encode([
            'success' => true,
            'message' => 'length_prices field added successfully to products table',
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
