<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if ($id) {
        $sql = "SELECT * FROM product_variations WHERE id = $id";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            $variation = $result->fetch_assoc();
            // Parse JSON fields
            if ($variation['options']) {
                $variation['options'] = json_decode($variation['options'], true);
            }
            echo json_encode($variation);
        } else {
            echo json_encode(['success' => false, 'error' => 'Variation not found']);
        }
    } else {
        $sql = "SELECT * FROM product_variations ORDER BY name ASC";
        $result = $conn->query($sql);
        $variations = [];
        while ($row = $result->fetch_assoc()) {
            // Parse JSON fields
            if ($row['options']) {
                $row['options'] = json_decode($row['options'], true);
            }
            $variations[] = $row;
        }
        echo json_encode($variations);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $conn->real_escape_string($data['name'] ?? '');
    $type = $conn->real_escape_string($data['type'] ?? 'select'); // select, color, size, etc.
    $options = isset($data['options']) ? json_encode($data['options']) : '[]';
    $description = $conn->real_escape_string($data['description'] ?? '');
    
    $sql = "INSERT INTO product_variations (name, type, options, description) 
            VALUES ('$name', '$type', '$options', '$description')";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id']);
    
    $name = $conn->real_escape_string($data['name'] ?? '');
    $type = $conn->real_escape_string($data['type'] ?? 'select');
    $options = isset($data['options']) ? json_encode($data['options']) : '[]';
    $description = $conn->real_escape_string($data['description'] ?? '');
    
    $sql = "UPDATE product_variations 
            SET name = '$name', type = '$type', options = '$options', description = '$description'
            WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = intval($_GET['id']);
    $sql = "DELETE FROM product_variations WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
}

$conn->close();
?>

