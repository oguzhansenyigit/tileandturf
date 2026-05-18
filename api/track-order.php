<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!tileandturf_rate_limit_allowed('track_order', 20, 300)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Too many requests. Try again later.']);
        exit();
    }

    $orderNumber = trim($_GET['order_number'] ?? '');
    if ($orderNumber === '' || strlen($orderNumber) > 64) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Order number is required']);
        exit();
    }

    $order = tileandturf_db_fetch_one(
        $conn,
        'SELECT * FROM orders WHERE order_number = ? LIMIT 1',
        's',
        $orderNumber
    );

    if (!$order) {
        tileandturf_rate_limit_fail('track_order', 20, 300);
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Order not found']);
        exit();
    }

    $orderId = intval($order['id']);
    $order['items'] = tileandturf_db_fetch_all(
        $conn,
        'SELECT product_name, product_price, quantity, subtotal FROM order_items WHERE order_id = ?',
        'i',
        $orderId
    );
    unset($order['id']);

    echo json_encode([
        'success' => true,
        'order' => $order,
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();

?>
