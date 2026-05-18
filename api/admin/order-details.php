<?php
require_once '../config.php';

tileandturf_require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Order ID is required']);
        exit();
    }
    
    // Get order
    $sql = "SELECT * FROM orders WHERE id = $id";
    $result = $conn->query($sql);
    
    if (!$result) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        exit();
    }
    
    $order = $result->fetch_assoc();
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
        exit();
    }
    
    // Get order items
    $itemsSql = "SELECT * FROM order_items WHERE order_id = $id";
    $itemsResult = $conn->query($itemsSql);
    $items = [];
    if ($itemsResult) {
        while($row = $itemsResult->fetch_assoc()) {
            $items[] = $row;
        }
    }
    $order['items'] = $items;
    
    echo json_encode($order);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>

