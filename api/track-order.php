<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $orderNumber = isset($_GET['order_number']) ? $conn->real_escape_string($_GET['order_number']) : '';
    
    if (empty($orderNumber)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Order number is required']);
        exit();
    }
    
    // Get order by order number
    $sql = "SELECT * FROM orders WHERE order_number = '$orderNumber'";
    $result = $conn->query($sql);
    
    if (!$result || $result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Order not found']);
        exit();
    }
    
    $order = $result->fetch_assoc();
    
    // Get order items
    $orderId = $order['id'];
    $itemsSql = "SELECT * FROM order_items WHERE order_id = $orderId";
    $itemsResult = $conn->query($itemsSql);
    $orderItems = [];
    
    if ($itemsResult) {
        while ($row = $itemsResult->fetch_assoc()) {
            $orderItems[] = $row;
        }
    }
    
    $order['items'] = $orderItems;
    
    echo json_encode(['success' => true, 'order' => $order]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>

