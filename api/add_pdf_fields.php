<?php
require_once 'config.php';

// Check if columns exist and add if they don't
$result = $conn->query("SHOW COLUMNS FROM products LIKE 'datasheet_pdf'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE products ADD COLUMN datasheet_pdf VARCHAR(500) NULL");
}

$result = $conn->query("SHOW COLUMNS FROM products LIKE 'brochure_pdf'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE products ADD COLUMN brochure_pdf VARCHAR(500) NULL");
}

echo json_encode(['success' => true, 'message' => 'PDF fields added successfully']);

$conn->close();
?>

