<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

if (!tileandturf_rate_limit_allowed('order_confirmation', 30, 300)) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many requests. Try again later.']);
    exit();
}

$orderId = isset($_GET['id']) ? intval($_GET['id']) : 0;
$token = trim($_GET['token'] ?? '');

if (!$orderId || $token === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Order id and token are required']);
    exit();
}

$order = tileandturf_db_fetch_one(
    $conn,
    'SELECT id, order_number, first_name, last_name, email, phone, address, city, state, zip_code, country, total, status, payment_method, created_at
     FROM orders WHERE id = ? LIMIT 1',
    'i',
    $orderId
);

if (!$order) {
    tileandturf_rate_limit_fail('order_confirmation', 30, 300);
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Order not found']);
    exit();
}

$orderNumber = $order['order_number'] ?: ('ORD-' . $orderId);
if (!tileandturf_order_confirmation_token_valid($orderId, $orderNumber, $token)) {
    tileandturf_rate_limit_fail('order_confirmation', 30, 300);
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid confirmation link']);
    exit();
}

$order['items'] = tileandturf_db_fetch_all(
    $conn,
    'SELECT product_name, product_price, quantity, subtotal FROM order_items WHERE order_id = ?',
    'i',
    $orderId
);

tileandturf_rate_limit_success('order_confirmation');

echo json_encode([
    'success' => true,
    'order' => $order,
]);

$conn->close();
