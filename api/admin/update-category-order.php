<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['categories']) || !is_array($data['categories'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid data format']);
        exit();
    }
    
    try {
        $conn->begin_transaction();
        
        $updated = 0;
        $stmt = $conn->prepare("UPDATE categories SET order_index = ? WHERE id = ?");
        
        foreach ($data['categories'] as $category) {
            if (!isset($category['id']) || !isset($category['order_index'])) {
                continue;
            }
            
            $id = intval($category['id']);
            $orderIndex = intval($category['order_index']);
            
            $stmt->bind_param("ii", $orderIndex, $id);
            if ($stmt->execute()) {
                $updated++;
            }
        }
        
        $stmt->close();
        $conn->commit();
        echo json_encode([
            'success' => true,
            'message' => "Updated order for $updated categories",
            'updated' => $updated
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

$conn->close();
?>
