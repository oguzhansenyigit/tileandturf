<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if ($id) {
        $sql = "SELECT * FROM customers WHERE id = $id";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            echo json_encode($result->fetch_assoc());
        } else {
            echo json_encode(['success' => false, 'error' => 'Customer not found']);
        }
    } else {
        $sql = "SELECT * FROM customers ORDER BY created_at DESC";
        $result = $conn->query($sql);
        $customers = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                unset($row['password']); // Don't send password
                $customers[] = $row;
            }
        }
        echo json_encode($customers);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id']);
    $status = $conn->real_escape_string($data['status']);
    
    $sql = "UPDATE customers SET status = '$status' WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = intval($_GET['id']);
    $sql = "DELETE FROM customers WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
}

$conn->close();
?>

