<?php
require_once '../config.php';

// Note: In production, implement proper authentication
// For now, allowing access - add authentication as needed

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $orderId = intval($data['orderId']);
    $status = $conn->real_escape_string($data['status']);
    
    $sql = "UPDATE orders SET status = '$status' WHERE id = $orderId";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
}

$conn->close();
?>

