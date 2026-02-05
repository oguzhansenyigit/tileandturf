<?php
require_once 'config.php';

header('Content-Type: application/json');

$messages = [];
$success = true;

try {
    // Check if datasheet_pdf column exists
    $checkSql = "SHOW COLUMNS FROM products LIKE 'datasheet_pdf'";
    $result = $conn->query($checkSql);
    
    if ($result && $result->num_rows == 0) {
        // Add datasheet_pdf column
        $sql1 = "ALTER TABLE products ADD COLUMN datasheet_pdf VARCHAR(500) NULL AFTER stock";
        if ($conn->query($sql1)) {
            $messages[] = "Column 'datasheet_pdf' added successfully.";
        } else {
            $success = false;
            $messages[] = "Error adding datasheet_pdf: " . $conn->error;
        }
    } else {
        $messages[] = "Column 'datasheet_pdf' already exists.";
    }
    
    // Check if brochure_pdf column exists
    $checkSql2 = "SHOW COLUMNS FROM products LIKE 'brochure_pdf'";
    $result2 = $conn->query($checkSql2);
    
    if ($result2 && $result2->num_rows == 0) {
        // Add brochure_pdf column
        $sql2 = "ALTER TABLE products ADD COLUMN brochure_pdf VARCHAR(500) NULL AFTER datasheet_pdf";
        if ($conn->query($sql2)) {
            $messages[] = "Column 'brochure_pdf' added successfully.";
        } else {
            $success = false;
            $messages[] = "Error adding brochure_pdf: " . $conn->error;
        }
    } else {
        $messages[] = "Column 'brochure_pdf' already exists.";
    }
    
    if ($success) {
        echo json_encode(['success' => true, 'message' => implode(' ', $messages)]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => implode(' ', $messages)]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>

