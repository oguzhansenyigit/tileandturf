<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Track visitor
    $sessionId = session_id() ?: uniqid('visitor_', true);
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $sql = "INSERT INTO active_visitors (session_id, ip_address, user_agent, last_activity) 
            VALUES ('$sessionId', '$ipAddress', '$userAgent', NOW())
            ON DUPLICATE KEY UPDATE last_activity = NOW()";
    
    $conn->query($sql);
    
    // Clean up old visitors (inactive for more than 5 minutes)
    $cleanupSql = "DELETE FROM active_visitors WHERE last_activity < DATE_SUB(NOW(), INTERVAL 5 MINUTE)";
    $conn->query($cleanupSql);
    
    echo json_encode(['success' => true]);
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get active visitor count
    $sql = "SELECT COUNT(*) as count FROM active_visitors WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)";
    $result = $conn->query($sql);
    $count = $result->fetch_assoc()['count'];
    
    echo json_encode(['success' => true, 'active_visitors' => (int)$count]);
}

$conn->close();
?>

