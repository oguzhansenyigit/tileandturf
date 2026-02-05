<?php
require_once '../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Note: In production, implement proper authentication
// For now, allowing access - add authentication as needed

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

