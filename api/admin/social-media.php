<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM social_media ORDER BY platform";
    $result = $conn->query($sql);
    $social = [];
    while ($row = $result->fetch_assoc()) {
        $social[] = $row;
    }
    echo json_encode($social);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $platform = $conn->real_escape_string($data['platform']);
    $url = $conn->real_escape_string($data['url']);
    $icon = $conn->real_escape_string($data['icon'] ?? $platform);
    $status = $conn->real_escape_string($data['status'] ?? 'active');
    
    $sql = "INSERT INTO social_media (platform, url, icon, status) 
            VALUES ('$platform', '$url', '$icon', '$status')
            ON DUPLICATE KEY UPDATE url = '$url', icon = '$icon', status = '$status'";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true, 'message' => 'Social media added successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id']);
    
    $platform = $conn->real_escape_string($data['platform']);
    $url = $conn->real_escape_string($data['url']);
    $icon = $conn->real_escape_string($data['icon'] ?? $platform);
    $status = $conn->real_escape_string($data['status'] ?? 'active');
    
    $sql = "UPDATE social_media SET 
            platform = '$platform',
            url = '$url',
            icon = '$icon',
            status = '$status'
            WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = intval($_GET['id']);
    $sql = "DELETE FROM social_media WHERE id = $id";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
}

$conn->close();
?>

