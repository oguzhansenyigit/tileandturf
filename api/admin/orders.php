<?php
require_once '../config.php';

// Note: In production, implement proper authentication
// For now, allowing access - add authentication as needed

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT o.*, 
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
            FROM orders o 
            ORDER BY o.created_at DESC";
    
    $result = $conn->query($sql);
    
    $orders = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
    }
    
    echo json_encode($orders);
}

$conn->close();
?>

