<?php
require_once 'config.php';

header('Content-Type: application/json');

// Track page view
$date = date('Y-m-d');
$sql = "INSERT INTO statistics (date, page_views) VALUES ('$date', 1)
        ON DUPLICATE KEY UPDATE page_views = page_views + 1";
$conn->query($sql);

// Track product view if product_id is provided
if (isset($_GET['product_id'])) {
    $productId = intval($_GET['product_id']);
    $sql = "INSERT INTO product_views (product_id, view_date, view_count) 
            VALUES ($productId, '$date', 1)
            ON DUPLICATE KEY UPDATE view_count = view_count + 1";
    $conn->query($sql);
}

// Track unique visitor (simple IP-based)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
// You can implement more sophisticated visitor tracking here

echo json_encode(['success' => true]);

$conn->close();
?>

