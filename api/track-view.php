<?php
/**
 * Legacy endpoint — forwards to track-visitor style product/page tracking.
 * Prefer POST /api/track-visitor.php from the SPA.
 */
require_once 'config.php';
require_once __DIR__ . '/analytics-helpers.php';

header('Content-Type: application/json');

tileandturf_analytics_ensure_tables($conn);

$date = date('Y-m-d');
@$conn->query(
    "INSERT INTO statistics (date, page_views, unique_visitors) VALUES ('$date', 1, 0)
     ON DUPLICATE KEY UPDATE page_views = page_views + 1"
);

if (isset($_GET['product_id'])) {
    $productId = intval($_GET['product_id']);
    if ($productId > 0) {
        @$conn->query(
            "INSERT INTO product_views (product_id, view_date, view_count)
             VALUES ($productId, '$date', 1)
             ON DUPLICATE KEY UPDATE view_count = view_count + 1"
        );
    }
}

echo json_encode(['success' => true]);
$conn->close();
