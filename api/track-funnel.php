<?php
/**
 * Funnel events: add_to_cart, begin_checkout, purchase, view_product.
 */
require_once 'config.php';
require_once __DIR__ . '/analytics-helpers.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

tileandturf_analytics_ensure_tables($conn);

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    $data = [];
}

$sessionId = trim((string)($data['session_id'] ?? ''));
$sessionId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $sessionId);
$sessionId = substr($sessionId, 0, 64);
if ($sessionId === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'session_id required']);
    $conn->close();
    exit();
}

$event = trim((string)($data['event'] ?? $data['event_type'] ?? ''));
$productId = isset($data['product_id']) ? intval($data['product_id']) : null;
$orderId = isset($data['order_id']) ? intval($data['order_id']) : null;
$ip = tileandturf_client_ip();

$ok = tileandturf_funnel_record($conn, $sessionId, $event, $productId, $orderId, $ip);
if (!$ok) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid event']);
    $conn->close();
    exit();
}

echo json_encode(['success' => true]);
$conn->close();
