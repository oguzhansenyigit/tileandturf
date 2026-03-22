<?php
require_once 'config.php';

@ini_set('upload_max_filesize', '32M');
@ini_set('post_max_size', '36M');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$uploadDir = __DIR__ . '/uploads/images/';

// Create upload directory if it doesn't exist
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (!isset($_FILES['file'])) {
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 20 * 1024 * 1024; // 20MB (room scenes / high-res product photos)

// Validate file type
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.']);
    exit;
}

// Validate file size
if ($file['size'] > $maxSize) {
    echo json_encode(['success' => false, 'error' => 'File size exceeds 20MB limit.']);
    exit;
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('img_', true) . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    $url = '/api/uploads/images/' . $filename;
    echo json_encode(['success' => true, 'url' => $url, 'filename' => $filename]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to upload file']);
}

?>

