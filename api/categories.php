<?php
require_once 'config.php';
require_once __DIR__ . '/category-helpers.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $select = 'id, name, slug, description, created_at';
        if (tileandturf_category_column_exists($conn, 'datasheet_pdf')) {
            $select .= ', datasheet_pdf';
        }
        if (tileandturf_category_column_exists($conn, 'brochure_pdf')) {
            $select .= ', brochure_pdf';
        }
        if (tileandturf_category_column_exists($conn, 'parent_id')) {
            $select .= ', parent_id';
        }
        if (tileandturf_category_column_exists($conn, 'discount_percent')) {
            $select .= ', discount_percent';
        }
        $sql = "SELECT $select FROM categories ORDER BY created_at DESC";
        
        $result = $conn->query($sql);
        
        $categories = [];
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $hay = strtolower(($row['name'] ?? '') . ' ' . ($row['slug'] ?? ''));
                if (strpos($hay, 'porcelain') !== false) {
                    $row['brochure_pdf'] = '/porcelain-paver-katalog.pdf';
                }
                $categories[] = $row;
            }
        }
        
        echo json_encode($categories);
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        tileandturf_require_admin();
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
            
            $discountSet = tileandturf_category_discount_set_fragment($conn, $data);
            if ($hasColumns) {
                $sql = "UPDATE categories SET name = '$name', slug = '$slug', description = '$description', 
                        datasheet_pdf = " . ($datasheet_pdf ? "'$datasheet_pdf'" : 'NULL') . ", 
                        brochure_pdf = " . ($brochure_pdf ? "'$brochure_pdf'" : 'NULL') . ", 
                        parent_id = $parent_id$discountSet WHERE id = $id";
            } else {
                $sql = "UPDATE categories SET name = '$name', slug = '$slug', description = '$description'$discountSet WHERE id = $id";
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
            
            $discountSql = tileandturf_category_discount_sql_value($conn, $data['discount_percent'] ?? null);
            $discountInsert = ($discountSql !== null) ? ', discount_percent' : '';
            $discountValues = ($discountSql !== null) ? ", $discountSql" : '';
            if ($hasColumns) {
                $sql = "INSERT INTO categories (name, slug, description, datasheet_pdf, brochure_pdf, parent_id$discountInsert) 
                        VALUES ('$name', '$slug', '$description', 
                        " . ($datasheet_pdf ? "'$datasheet_pdf'" : 'NULL') . ", 
                        " . ($brochure_pdf ? "'$brochure_pdf'" : 'NULL') . ", 
                        " . ($parent_id ? $parent_id : 'NULL') . "$discountValues)";
            } else {
                $sql = "INSERT INTO categories (name, slug, description$discountInsert) VALUES ('$name', '$slug', '$description'$discountValues)";
            }
            
            if ($conn->query($sql)) {
                echo json_encode(['success' => true, 'id' => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => $conn->error]);
            }
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        tileandturf_require_admin();
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
        
        $discountSet = tileandturf_category_discount_set_fragment($conn, $data);
        if ($hasColumns) {
            $sql = "UPDATE categories SET name = '$name', slug = '$slug', description = '$description', 
                    datasheet_pdf = " . ($datasheet_pdf ? "'$datasheet_pdf'" : 'NULL') . ", 
                    brochure_pdf = " . ($brochure_pdf ? "'$brochure_pdf'" : 'NULL') . ", 
                    parent_id = $parent_id$discountSet WHERE id = $id";
        } else {
            $sql = "UPDATE categories SET name = '$name', slug = '$slug', description = '$description'$discountSet WHERE id = $id";
        }
        
        if ($conn->query($sql)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        tileandturf_require_admin();
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
