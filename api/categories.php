<?php
require_once 'config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Check if PDF columns and order_index exist
        $checkColumns = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                        AND TABLE_NAME = 'categories' 
                        AND COLUMN_NAME IN ('datasheet_pdf', 'brochure_pdf', 'parent_id', 'order_index')";
        $colResult = $conn->query($checkColumns);
        $hasPDFColumns = false;
        $hasOrderIndex = false;
        
        if ($colResult) {
            $colRow = $colResult->fetch_assoc();
            $hasPDFColumns = $colRow['count'] >= 3; // datasheet_pdf, brochure_pdf, parent_id
            
            // Check specifically for order_index
            $checkOrderIndex = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                               WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                               AND TABLE_NAME = 'categories' 
                               AND COLUMN_NAME = 'order_index'";
            $orderIndexResult = $conn->query($checkOrderIndex);
            if ($orderIndexResult) {
                $orderIndexRow = $orderIndexResult->fetch_assoc();
                $hasOrderIndex = $orderIndexRow['count'] > 0;
            }
        }
        
        // Build SELECT clause
        $selectFields = ['id', 'name', 'slug', 'description', 'created_at'];
        if ($hasPDFColumns) {
            $selectFields = array_merge($selectFields, ['datasheet_pdf', 'brochure_pdf', 'parent_id']);
        }
        if ($hasOrderIndex) {
            $selectFields[] = 'order_index';
        }
        
        $selectClause = implode(', ', $selectFields);
        
        // Build ORDER BY clause - use order_index if available, otherwise created_at
        $orderBy = $hasOrderIndex 
            ? 'ORDER BY COALESCE(order_index, 999999) ASC, created_at ASC'
            : 'ORDER BY created_at DESC';
        
        $sql = "SELECT $selectClause FROM categories $orderBy";
        
        $result = $conn->query($sql);
        
        $categories = [];
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $categories[] = $row;
            }
        }
        
        echo json_encode($categories);
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check if this is an update (has id)
        if (isset($data['id']) && $data['id']) {
            $id = intval($data['id']);
            $name = $conn->real_escape_string($data['name'] ?? '');
            $slug = $conn->real_escape_string($data['slug'] ?? '');
            $description = $conn->real_escape_string($data['description'] ?? '');
            $datasheet_pdf = $conn->real_escape_string($data['datasheet_pdf'] ?? '');
            $brochure_pdf = $conn->real_escape_string($data['brochure_pdf'] ?? '');
            $parent_id = isset($data['parent_id']) && $data['parent_id'] ? intval($data['parent_id']) : 'NULL';
            
            // Check if columns exist
            $checkColumns = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                            WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                            AND TABLE_NAME = 'categories' 
                            AND COLUMN_NAME IN ('datasheet_pdf', 'brochure_pdf', 'parent_id')";
            $colResult = $conn->query($checkColumns);
            $hasColumns = false;
            if ($colResult) {
                $colRow = $colResult->fetch_assoc();
                $hasColumns = $colRow['count'] >= 3;
            }
            
            if ($hasColumns) {
                $sql = "UPDATE categories SET name = '$name', slug = '$slug', description = '$description', 
                        datasheet_pdf = " . ($datasheet_pdf ? "'$datasheet_pdf'" : 'NULL') . ", 
                        brochure_pdf = " . ($brochure_pdf ? "'$brochure_pdf'" : 'NULL') . ", 
                        parent_id = $parent_id WHERE id = $id";
            } else {
                $sql = "UPDATE categories SET name = '$name', slug = '$slug', description = '$description' WHERE id = $id";
            }
            
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'id' => $id]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $conn->error]);
            }
        } else {
            // Insert new category
            $name = $conn->real_escape_string($data['name'] ?? '');
            $slug = $conn->real_escape_string($data['slug'] ?? '');
            $description = $conn->real_escape_string($data['description'] ?? '');
            // Handle PDF fields - empty string should be NULL
            $datasheet_pdf = isset($data['datasheet_pdf']) && trim($data['datasheet_pdf']) !== '' 
                ? $conn->real_escape_string($data['datasheet_pdf']) 
                : '';
            $brochure_pdf = isset($data['brochure_pdf']) && trim($data['brochure_pdf']) !== '' 
                ? $conn->real_escape_string($data['brochure_pdf']) 
                : '';
            $parent_id = isset($data['parent_id']) && $data['parent_id'] ? intval($data['parent_id']) : null;
            
            if (empty($name)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Category name is required']);
                exit();
            }
            
            // Check if columns exist
            $checkColumns = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                            WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                            AND TABLE_NAME = 'categories' 
                            AND COLUMN_NAME IN ('datasheet_pdf', 'brochure_pdf', 'parent_id')";
            $colResult = $conn->query($checkColumns);
            $hasColumns = false;
            if ($colResult) {
                $colRow = $colResult->fetch_assoc();
                $hasColumns = $colRow['count'] >= 3;
            }
            
            if ($hasColumns) {
                $sql = "INSERT INTO categories (name, slug, description, datasheet_pdf, brochure_pdf, parent_id) 
                        VALUES ('$name', '$slug', '$description', 
                        " . ($datasheet_pdf ? "'$datasheet_pdf'" : 'NULL') . ", 
                        " . ($brochure_pdf ? "'$brochure_pdf'" : 'NULL') . ", 
                        " . ($parent_id ? $parent_id : 'NULL') . ")";
            } else {
                $sql = "INSERT INTO categories (name, slug, description) VALUES ('$name', '$slug', '$description')";
            }
            
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'id' => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $conn->error]);
            }
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = intval($data['id'] ?? 0);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Category ID is required']);
            exit();
        }
        
        $name = $conn->real_escape_string($data['name'] ?? '');
        $slug = $conn->real_escape_string($data['slug'] ?? '');
        $description = $conn->real_escape_string($data['description'] ?? '');
        // Handle PDF fields - empty string should be NULL
        $datasheet_pdf = isset($data['datasheet_pdf']) && trim($data['datasheet_pdf']) !== '' 
            ? $conn->real_escape_string($data['datasheet_pdf']) 
            : '';
        $brochure_pdf = isset($data['brochure_pdf']) && trim($data['brochure_pdf']) !== '' 
            ? $conn->real_escape_string($data['brochure_pdf']) 
            : '';
        $parent_id = isset($data['parent_id']) && $data['parent_id'] ? intval($data['parent_id']) : 'NULL';
        
        // Check if columns exist
        $checkColumns = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
                        AND TABLE_NAME = 'categories' 
                        AND COLUMN_NAME IN ('datasheet_pdf', 'brochure_pdf', 'parent_id')";
        $colResult = $conn->query($checkColumns);
        $hasColumns = false;
        if ($colResult) {
            $colRow = $colResult->fetch_assoc();
            $hasColumns = $colRow['count'] >= 3;
        }
        
        if ($hasColumns) {
            $sql = "UPDATE categories SET name = '$name', slug = '$slug', description = '$description', 
                    datasheet_pdf = " . ($datasheet_pdf ? "'$datasheet_pdf'" : 'NULL') . ", 
                    brochure_pdf = " . ($brochure_pdf ? "'$brochure_pdf'" : 'NULL') . ", 
                    parent_id = $parent_id WHERE id = $id";
        } else {
            $sql = "UPDATE categories SET name = '$name', slug = '$slug', description = '$description' WHERE id = $id";
        }
        
        // Debug logging
        error_log("Category UPDATE SQL: " . $sql);
        error_log("Category UPDATE Data: datasheet_pdf=" . $datasheet_pdf . ", brochure_pdf=" . $brochure_pdf);
        
        if ($conn->query($sql)) {
            // Verify the update
            $verifySql = "SELECT datasheet_pdf, brochure_pdf FROM categories WHERE id = $id";
            $verifyResult = $conn->query($verifySql);
            if ($verifyResult) {
                $verifyRow = $verifyResult->fetch_assoc();
                error_log("Category UPDATE Verified: datasheet_pdf=" . ($verifyRow['datasheet_pdf'] ?? 'NULL') . ", brochure_pdf=" . ($verifyRow['brochure_pdf'] ?? 'NULL'));
            }
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $id = intval($_GET['id'] ?? 0);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Category ID is required']);
            exit();
        }
        
        // Check if category has products
        $checkSql = "SELECT COUNT(*) as count FROM products WHERE category_id = $id";
        $result = $conn->query($checkSql);
        $row = $result->fetch_assoc();
        
        if ($row['count'] > 0) {
            // Don't delete, just warn - or set products to NULL category
            $updateSql = "UPDATE products SET category_id = NULL WHERE category_id = $id";
            $conn->query($updateSql);
        }
        
        $sql = "DELETE FROM categories WHERE id = $id";
        
        if ($conn->query($sql)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>
