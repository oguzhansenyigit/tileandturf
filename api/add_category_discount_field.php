<?php
/**
 * Add discount_percent to categories (run once on server).
 */
require_once 'config.php';
require_once __DIR__ . '/category-helpers.php';

header('Content-Type: application/json');

try {
    if (tileandturf_category_column_exists($conn, 'discount_percent')) {
        echo json_encode([
            'success' => true,
            'message' => 'discount_percent column already exists',
            'skipped' => true,
        ]);
        $conn->close();
        exit();
    }

    $sql = 'ALTER TABLE categories ADD COLUMN discount_percent DECIMAL(5,2) NULL DEFAULT NULL AFTER parent_id';
    if ($conn->query($sql)) {
        echo json_encode([
            'success' => true,
            'message' => 'discount_percent column added to categories table',
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to add column: ' . $conn->error,
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}

$conn->close();

?>
