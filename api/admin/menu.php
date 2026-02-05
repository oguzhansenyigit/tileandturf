<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM menu_items ORDER BY order_index ASC";
    $result = $conn->query($sql);
    $menuItems = [];
    while ($row = $result->fetch_assoc()) {
        $menuItems[] = $row;
    }
    echo json_encode($menuItems);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $conn->real_escape_string($data['name']);
    $slug = $conn->real_escape_string($data['slug']);
    $link = $conn->real_escape_string($data['link'] ?? '');
    $parentId = isset($data['parent_id']) ? intval($data['parent_id']) : null;
    $orderIndex = isset($data['order_index']) ? intval($data['order_index']) : 0;
    $status = $conn->real_escape_string($data['status'] ?? 'active');
    
    $sql = "INSERT INTO menu_items (name, slug, link, parent_id, order_index, status) 
            VALUES ('$name', '$slug', '$link', " . ($parentId ? $parentId : 'NULL') . ", $orderIndex, '$status')";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id']);
    
    $name = $conn->real_escape_string($data['name']);
    $slug = $conn->real_escape_string($data['slug']);
    $link = $conn->real_escape_string($data['link'] ?? '');
    $parentId = isset($data['parent_id']) ? intval($data['parent_id']) : null;
    $orderIndex = isset($data['order_index']) ? intval($data['order_index']) : 0;
    $status = $conn->real_escape_string($data['status'] ?? 'active');
    
    $sql = "UPDATE menu_items SET 
            name = '$name',
            slug = '$slug',
            link = '$link',
            parent_id = " . ($parentId ? $parentId : 'NULL') . ",
            order_index = $orderIndex,
            status = '$status'
            WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = intval($_GET['id']);
    $sql = "DELETE FROM menu_items WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
}

$conn->close();
?>

