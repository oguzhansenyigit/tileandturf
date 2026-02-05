<?php
require_once 'config.php';

// Increase PHP upload limits for large PDF files
@ini_set('upload_max_filesize', '100M');
@ini_set('post_max_size', '100M');
@ini_set('max_execution_time', '300');
@ini_set('max_input_time', '300');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit();
}

// Debug: Log all received data
error_log('Upload PDF - POST data: ' . print_r($_POST, true));
error_log('Upload PDF - FILES data: ' . print_r($_FILES, true));
error_log('Upload PDF - CONTENT_TYPE: ' . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
error_log('Upload PDF - REQUEST_METHOD: ' . $_SERVER['REQUEST_METHOD']);

if (!isset($_FILES['file'])) {
    echo json_encode([
        'success' => false, 
        'error' => 'No file uploaded',
        'debug' => [
            'files_empty' => empty($_FILES),
            'files_keys' => array_keys($_FILES),
            'post_data' => $_POST,
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
            'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'not set'
        ]
    ]);
    exit();
}

$file = $_FILES['file'];

// Check if file upload had errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errorMsg = 'No file uploaded';
    switch ($file['error']) {
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
        default:
            $errorMsg = 'Unknown upload error: ' . $file['error'];
    }
    echo json_encode([
        'success' => false, 
        'error' => $errorMsg,
        'error_code' => $file['error']
    ]);
    exit();
}

// Check file type - be more flexible with MIME type checking
$allowedTypes = ['application/pdf', 'application/x-pdf', 'application/octet-stream'];
$fileType = $file['type'];
$fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// Check file extension first (more reliable than MIME type)
if ($fileExtension !== 'pdf') {
    echo json_encode([
        'success' => false, 
        'error' => 'Only PDF files are allowed. File extension must be .pdf',
        'received_type' => $fileType,
        'received_extension' => $fileExtension,
        'filename' => $file['name']
    ]);
    exit();
}

// Also check MIME type if available (but be lenient)
if ($fileType && !in_array($fileType, $allowedTypes) && $fileType !== '') {
    // Log warning but don't block if extension is correct
    error_log('Warning: Unexpected MIME type for PDF: ' . $fileType . ' (File: ' . $file['name'] . ')');
}

// Check file size (max 100MB for large catalog PDFs)
$maxSize = 100 * 1024 * 1024; // 100MB
if ($file['size'] > $maxSize) {
    echo json_encode(['success' => false, 'error' => 'File size exceeds 100MB limit']);
    exit();
}

// Also check PHP upload limits
$uploadMaxFilesize = ini_get('upload_max_filesize');
$postMaxSize = ini_get('post_max_size');
error_log('PHP upload_max_filesize: ' . $uploadMaxFilesize);
error_log('PHP post_max_size: ' . $postMaxSize);
error_log('File size: ' . $file['size'] . ' bytes (' . round($file['size'] / 1024 / 1024, 2) . ' MB)');

// Generate filename from original name (sanitized for security)
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
// Sanitize filename: remove special characters, keep only alphanumeric, spaces, hyphens, underscores
$sanitizedName = preg_replace('/[^a-zA-Z0-9\s\-_]/', '', $originalName);
$sanitizedName = preg_replace('/\s+/', '_', trim($sanitizedName)); // Replace spaces with underscores
// Add timestamp to ensure uniqueness
$filename = $sanitizedName . '_' . time() . '.' . $extension;
// If filename is too long, truncate it
if (strlen($filename) > 200) {
    $filename = substr($sanitizedName, 0, 150) . '_' . time() . '.' . $extension;
}
$uploadDir = '../uploads/pdfs/';

// Create upload directory if it doesn't exist
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$targetPath = $uploadDir . $filename;

// Ensure the upload directory exists and is writable
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode(['success' => false, 'error' => 'Failed to create upload directory']);
        exit();
    }
}

// Check if directory is writable
if (!is_writable($uploadDir)) {
    echo json_encode(['success' => false, 'error' => 'Upload directory is not writable']);
    exit();
}

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // Return URL - use absolute path from root
    $url = '/uploads/pdfs/' . $filename;
    
    // Debug logging
    error_log('PDF uploaded successfully: ' . $targetPath);
    error_log('PDF URL returned: ' . $url);
    error_log('File size: ' . filesize($targetPath) . ' bytes');
    
    echo json_encode([
        'success' => true, 
        'url' => $url,
        'filename' => $filename,
        'original_filename' => $file['name'], // Store original filename for download
        'size' => filesize($targetPath)
    ]);
} else {
    $error = error_get_last();
    echo json_encode([
        'success' => false, 
        'error' => 'Failed to upload file',
        'php_error' => $error ? $error['message'] : 'Unknown error',
        'tmp_name' => $file['tmp_name'],
        'target_path' => $targetPath
    ]);
}

$conn->close();
?>
