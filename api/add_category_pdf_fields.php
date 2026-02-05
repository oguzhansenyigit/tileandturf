<?php
/**
 * Add PDF fields and parent_id to categories table
 * Run this script once to add datasheet_pdf, brochure_pdf, and parent_id columns
 */

require_once 'config.php';

header('Content-Type: application/json');

try {
    // Check if columns already exist
    $checkSql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                  WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                  AND TABLE_NAME = 'categories' 
                  AND COLUMN_NAME IN ('datasheet_pdf', 'brochure_pdf', 'parent_id')";
    
    $checkResult = $conn->query($checkSql);
    $row = $checkResult->fetch_assoc();
    
    if ($row['count'] >= 3) {
        echo json_encode([
            'success' => true,
            'message' => 'PDF fields and parent_id column already exist in categories table',
            'skipped' => true
        ]);
        $conn->close();
        exit();
    }
    
    // Add columns if they don't exist
    $alterations = [];
    
    // Check and add datasheet_pdf
    $checkDatasheet = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                        AND TABLE_NAME = 'categories' 
                        AND COLUMN_NAME = 'datasheet_pdf'";
    $result = $conn->query($checkDatasheet);
    $row = $result->fetch_assoc();
    if ($row['count'] == 0) {
        $alterations[] = "ADD COLUMN datasheet_pdf VARCHAR(500) NULL AFTER description";
    }
    
    // Check and add brochure_pdf
    $checkBrochure = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                       WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                       AND TABLE_NAME = 'categories' 
                       AND COLUMN_NAME = 'brochure_pdf'";
    $result = $conn->query($checkBrochure);
    $row = $result->fetch_assoc();
    if ($row['count'] == 0) {
        $alterations[] = "ADD COLUMN brochure_pdf VARCHAR(500) NULL AFTER datasheet_pdf";
    }
    
    // Check and add parent_id
    $checkParent = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                     WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                     AND TABLE_NAME = 'categories' 
                     AND COLUMN_NAME = 'parent_id'";
    $result = $conn->query($checkParent);
    $row = $result->fetch_assoc();
    if ($row['count'] == 0) {
        $alterations[] = "ADD COLUMN parent_id INT NULL AFTER brochure_pdf";
    }
    
    if (count($alterations) > 0) {
        $sql = "ALTER TABLE categories " . implode(', ', $alterations);
        
        if ($conn->query($sql)) {
            echo json_encode([
                'success' => true,
                'message' => 'PDF fields and parent_id column added successfully to categories table',
                'added' => count($alterations)
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to add columns: ' . $conn->error
            ]);
        }
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'All columns already exist',
            'skipped' => true
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$conn->close();
?>

