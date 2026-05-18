<?php
require_once '../config.php';

tileandturf_require_admin();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid data format']);
    exit;
}

try {
    $conn->begin_transaction();

    $stmt = $conn->prepare('UPDATE menu_items SET order_index = ? WHERE id = ?');
    $updated = 0;

    foreach ($data['items'] as $item) {
        if (!isset($item['id']) || !isset($item['order_index'])) {
            continue;
        }

        $id = intval($item['id']);
        $orderIndex = intval($item['order_index']);

        $stmt->bind_param('ii', $orderIndex, $id);
        if ($stmt->execute()) {
            $updated++;
        }
    }

    $stmt->close();
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => "Updated order for $updated menu items",
        'updated' => $updated,
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}

$conn->close();
