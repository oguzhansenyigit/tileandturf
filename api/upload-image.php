<?php
require_once 'config.php';

tileandturf_require_admin();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$uploadDir = __DIR__ . '/uploads/images/';

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if (!isset($_FILES['file'])) {
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
$validation = tileandturf_validate_uploaded_file(
    $file,
    ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    5 * 1024 * 1024
);

if (!$validation['ok']) {
    echo json_encode(['success' => false, 'error' => $validation['error']]);
    exit;
}

$filename = uniqid('img_', true) . '.' . $validation['extension'];
$filepath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    $url = '/api/uploads/images/' . $filename;
    echo json_encode(['success' => true, 'url' => $url, 'filename' => $filename]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to upload file']);
}

?>
