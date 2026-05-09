<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Debug: Log all received data
error_log('Upload PDF - POST data: ' . print_r($_POST, true));
error_log('Upload PDF - FILES data: ' . print_r($_FILES, true));

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorMsg = 'No file uploaded';
    if (isset($_FILES['file']['error'])) {
        switch ($_FILES['file']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errorMsg = 'File size exceeds limit';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errorMsg = 'File upload was incomplete';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errorMsg = 'No file was uploaded';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $errorMsg = 'Missing temporary folder';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $errorMsg = 'Failed to write file to disk';
                break;
            case UPLOAD_ERR_EXTENSION:
                $errorMsg = 'File upload stopped by extension';
                break;
        }
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $errorMsg]);
    exit();
}

$file = $_FILES['file'];

// Check file type
$allowedTypes = ['application/pdf'];
$fileType = $file['type'];

if (!in_array($fileType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Only PDF files are allowed']);
    exit();
}

// Check file size (max 10MB)
$maxSize = 10 * 1024 * 1024; // 10MB
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'File size exceeds 10MB limit']);
    exit();
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('pdf_', true) . '.' . $extension;
$uploadDir = '../uploads/pdfs/';

// Create upload directory if it doesn't exist
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
