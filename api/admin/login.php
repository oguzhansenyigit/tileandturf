<?php
require_once '../config.php';

// Simple password check - in production, use proper authentication
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $password = $data['password'] ?? '';
    
    // Simple password check - in production, use proper authentication
    if ($password === 'admin123') {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid password']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();
?>

