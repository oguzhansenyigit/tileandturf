<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!tileandturf_admin_configured()) {
        http_response_code(503);
        echo json_encode(['success' => false, 'error' => 'Admin login is not configured']);
        exit();
    }

    if (!tileandturf_login_rate_allowed()) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Too many attempts. Try again in 15 minutes.']);
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $password = $data['password'] ?? '';

    if (tileandturf_admin_login($password)) {
        tileandturf_login_rate_success();
        echo json_encode(['success' => true]);
    } else {
        tileandturf_login_rate_fail();
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid password']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();

?>
