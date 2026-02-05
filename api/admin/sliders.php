<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if ($id) {
        $sql = "SELECT * FROM sliders WHERE id = $id";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            echo json_encode($result->fetch_assoc());
        } else {
            echo json_encode(['success' => false, 'error' => 'Slider not found']);
        }
    } else {
        $sql = "SELECT * FROM sliders ORDER BY order_index ASC";
        $result = $conn->query($sql);
        $sliders = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $sliders[] = $row;
            }
        } else {
            // Log error if query fails
            error_log("Slider fetch error: " . $conn->error);
        }
        echo json_encode($sliders);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $title = $conn->real_escape_string($data['title']);
    $description = $conn->real_escape_string($data['description'] ?? '');
    $image = $conn->real_escape_string($data['image']);
    $buttonText = $conn->real_escape_string($data['button_text'] ?? '');
    $buttonLink = $conn->real_escape_string($data['button_link'] ?? '');
    $orderIndex = isset($data['order_index']) ? intval($data['order_index']) : 0;
    $status = $conn->real_escape_string($data['status'] ?? 'active');
    $imagePositionX = $conn->real_escape_string($data['image_position_x'] ?? 'center');
    $imagePositionY = $conn->real_escape_string($data['image_position_y'] ?? 'center');
    
    $sql = "INSERT INTO sliders (title, description, image, button_text, button_link, order_index, status, image_position_x, image_position_y) 
            VALUES ('$title', '$description', '$image', '$buttonText', '$buttonLink', $orderIndex, '$status', '$imagePositionX', '$imagePositionY')";
    
    if ($conn->query($sql)) {
        $newId = $conn->insert_id;
        // Return the newly created slider
        $getSql = "SELECT * FROM sliders WHERE id = $newId";
        $getResult = $conn->query($getSql);
        $newSlider = $getResult->fetch_assoc();
        echo json_encode(['success' => true, 'id' => $newId, 'slider' => $newSlider]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id']);
    
    $title = $conn->real_escape_string($data['title']);
    $description = $conn->real_escape_string($data['description'] ?? '');
    $image = $conn->real_escape_string($data['image']);
    $buttonText = $conn->real_escape_string($data['button_text'] ?? '');
    $buttonLink = $conn->real_escape_string($data['button_link'] ?? '');
    $orderIndex = isset($data['order_index']) ? intval($data['order_index']) : 0;
    $status = $conn->real_escape_string($data['status'] ?? 'active');
    $imagePositionX = $conn->real_escape_string($data['image_position_x'] ?? 'center');
    $imagePositionY = $conn->real_escape_string($data['image_position_y'] ?? 'center');
    
    $sql = "UPDATE sliders SET 
            title = '$title',
            description = '$description',
            image = '$image',
            button_text = '$buttonText',
            button_link = '$buttonLink',
            order_index = $orderIndex,
            status = '$status',
            image_position_x = '$imagePositionX',
            image_position_y = '$imagePositionY'
            WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = intval($_GET['id']);
    $sql = "DELETE FROM sliders WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
}

$conn->close();
?>

