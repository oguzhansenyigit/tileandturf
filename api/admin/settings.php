<?php
require_once '../config.php';

tileandturf_require_admin_for_write();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $key = isset($_GET['key']) ? $conn->real_escape_string($_GET['key']) : null;
    $publicOnly = !tileandturf_admin_session_valid();
    
    if ($key) {
        if ($publicOnly && !in_array($_GET['key'], tileandturf_public_settings_keys(), true)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Setting not found']);
            exit();
        }
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
        $allowedKeys = tileandturf_public_settings_keys();
        while ($row = $result->fetch_assoc()) {
            if ($publicOnly && !in_array($row['setting_key'], $allowedKeys, true)) {
                continue;
            }
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

