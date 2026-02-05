<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get user email from query parameter or from token (if implemented)
    $email = isset($_GET['email']) ? $conn->real_escape_string($_GET['email']) : '';
    
    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email is required']);
        exit();
    }
    
    // Get all orders for this customer
    $sql = "SELECT * FROM orders WHERE email = '$email' ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    $orders = [];
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $orderId = $row['id'];
            
            // Get order items with product details
            $itemsSql = "SELECT oi.*, p.image, p.slug 
                        FROM order_items oi 
                        LEFT JOIN products p ON oi.product_id = p.id 
                        WHERE oi.order_id = $orderId";
            $itemsResult = $conn->query($itemsSql);
            
            $items = [];
            if ($itemsResult) {
                while($item = $itemsResult->fetch_assoc()) {
                    $items[] = $item;
                }
            }
            
            $row['items'] = $items;
            $orders[] = $row;
        }
    }
    
    echo json_encode(['success' => true, 'orders' => $orders]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>
