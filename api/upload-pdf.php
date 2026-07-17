<?php
require_once 'config.php';

tileandturf_require_admin();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
    exit();
}

$file = $_FILES['file'];
$validation = tileandturf_validate_uploaded_file(
    $file,
    ['application/pdf'],
    ['pdf'],
    50 * 1024 * 1024
);

if (!$validation['ok']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $validation['error']]);
    exit();
}

$filename = uniqid('pdf_', true) . '.pdf';
$uploadDir = __DIR__ . '/uploads/pdfs/';

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$targetPath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $url = '/uploads/pdfs/' . $filename;
    echo json_encode(['success' => true, 'url' => $url]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to upload file']);
}

$conn->close();

?>
