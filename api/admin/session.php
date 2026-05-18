<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['authenticated' => tileandturf_admin_session_valid()]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    tileandturf_admin_logout();
    echo json_encode(['success' => true]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$conn->close();

?>
