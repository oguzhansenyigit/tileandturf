<?php
require_once '../config.php';

tileandturf_require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Order ID is required']);
    exit();
}

$order = tileandturf_db_fetch_one(
    $conn,
    'SELECT * FROM orders WHERE id = ? LIMIT 1',
    'i',
    $id
);

if (!$order) {
    http_response_code(404);
    echo json_encode(['error' => 'Order not found']);
    exit();
}

$rows = tileandturf_db_fetch_all(
    $conn,
    'SELECT oi.*, p.image AS product_image, p.slug AS product_slug
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC',
    'i',
    $id
);

$items = [];
foreach ($rows as $row) {
    $quantity = intval($row['quantity'] ?? 0);
    $price = floatval($row['product_price'] ?? 0);
    $subtotal = isset($row['subtotal']) ? floatval($row['subtotal']) : round($price * $quantity, 2);

    $items[] = [
        'id' => intval($row['id']),
        'product_id' => $row['product_id'] ? intval($row['product_id']) : null,
        'name' => $row['product_name'] ?? '',
        'product_name' => $row['product_name'] ?? '',
        'price' => $price,
        'product_price' => $price,
        'quantity' => $quantity,
        'subtotal' => $subtotal,
        'image' => $row['product_image'] ?? '',
        'product_image' => $row['product_image'] ?? '',
        'slug' => $row['product_slug'] ?? '',
        'selected_size' => $row['selected_size'] ?? null,
    ];
}

$order['items'] = $items;
$order['customerName'] = trim(($order['first_name'] ?? '') . ' ' . ($order['last_name'] ?? ''));

echo json_encode($order);

$conn->close();

?>
