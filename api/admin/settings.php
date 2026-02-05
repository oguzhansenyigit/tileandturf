<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $key = isset($_GET['key']) ? $conn->real_escape_string($_GET['key']) : null;
    
    if ($key) {
        $sql = "SELECT * FROM settings WHERE setting_key = '$key'";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            echo json_encode($result->fetch_assoc());
        } else {
            echo json_encode(['success' => false, 'error' => 'Setting not found']);
        }
    } else {
        $sql = "SELECT * FROM settings ORDER BY setting_key";
        $result = $conn->query($sql);
        $settings = [];
        while ($row = $result->fetch_assoc()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        echo json_encode($settings);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    foreach ($data as $key => $value) {
        $key = $conn->real_escape_string($key);
        $value = $conn->real_escape_string($value);
        
        $sql = "INSERT INTO settings (setting_key, setting_value) 
                VALUES ('$key', '$value')
                ON DUPLICATE KEY UPDATE setting_value = '$value'";
        $conn->query($sql);
    }
    
    echo json_encode(['success' => true, 'message' => 'Settings updated successfully']);
}

$conn->close();
?>

