<?php
require_once 'config.php';

header('Content-Type: application/json');

$messages = [];
$success = true;

try {
    // Check if weight column exists
    $checkSql = "SHOW COLUMNS FROM products LIKE 'weight_lbs'";
    $result = $conn->query($checkSql);
    
    if ($result && $result->num_rows == 0) {
        $sql1 = "ALTER TABLE products ADD COLUMN weight_lbs DECIMAL(10, 2) NULL AFTER stock";
        if ($conn->query($sql1)) {
            $messages[] = "Column 'weight_lbs' added successfully.";
        } else {
            $success = false;
            $messages[] = "Error adding weight_lbs: " . $conn->error;
        }
    } else {
        $messages[] = "Column 'weight_lbs' already exists.";
    }
    
    // Check if variations column exists
    $checkSql2 = "SHOW COLUMNS FROM products LIKE 'variations'";
    $result2 = $conn->query($checkSql2);
    
    if ($result2 && $result2->num_rows == 0) {
        $sql2 = "ALTER TABLE products ADD COLUMN variations TEXT NULL AFTER weight_lbs";
        if ($conn->query($sql2)) {
            $messages[] = "Column 'variations' added successfully.";
        } else {
            $success = false;
            $messages[] = "Error adding variations: " . $conn->error;
        }
    } else {
        $messages[] = "Column 'variations' already exists.";
    }
    
    // Check if gallery_images column exists
    $checkSql3 = "SHOW COLUMNS FROM products LIKE 'gallery_images'";
    $result3 = $conn->query($checkSql3);
    
    if ($result3 && $result3->num_rows == 0) {
        $sql3 = "ALTER TABLE products ADD COLUMN gallery_images TEXT NULL AFTER image";
        if ($conn->query($sql3)) {
            $messages[] = "Column 'gallery_images' added successfully.";
        } else {
            $success = false;
            $messages[] = "Error adding gallery_images: " . $conn->error;
        }
    } else {
        $messages[] = "Column 'gallery_images' already exists.";
    }
    
    // Check if comparison_before column exists
    $checkSql4 = "SHOW COLUMNS FROM products LIKE 'comparison_before'";
    $result4 = $conn->query($checkSql4);
    
    if ($result4 && $result4->num_rows == 0) {
        $sql4 = "ALTER TABLE products ADD COLUMN comparison_before VARCHAR(500) NULL AFTER gallery_images";
        if ($conn->query($sql4)) {
            $messages[] = "Column 'comparison_before' added successfully.";
        } else {
            $success = false;
            $messages[] = "Error adding comparison_before: " . $conn->error;
        }
    } else {
        $messages[] = "Column 'comparison_before' already exists.";
    }
    
    // Check if comparison_after column exists
    $checkSql5 = "SHOW COLUMNS FROM products LIKE 'comparison_after'";
    $result5 = $conn->query($checkSql5);
    
    if ($result5 && $result5->num_rows == 0) {
        $sql5 = "ALTER TABLE products ADD COLUMN comparison_after VARCHAR(500) NULL AFTER comparison_before";
        if ($conn->query($sql5)) {
            $messages[] = "Column 'comparison_after' added successfully.";
        } else {
            $success = false;
            $messages[] = "Error adding comparison_after: " . $conn->error;
        }
    } else {
        $messages[] = "Column 'comparison_after' already exists.";
    }
    
    // Check if related_products column exists
    $checkSql6 = "SHOW COLUMNS FROM products LIKE 'related_products'";
    $result6 = $conn->query($checkSql6);
    
    if ($result6 && $result6->num_rows == 0) {
        $sql6 = "ALTER TABLE products ADD COLUMN related_products TEXT NULL AFTER comparison_after";
        if ($conn->query($sql6)) {
            $messages[] = "Column 'related_products' added successfully.";
        } else {
            $success = false;
            $messages[] = "Error adding related_products: " . $conn->error;
        }
    } else {
        $messages[] = "Column 'related_products' already exists.";
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

