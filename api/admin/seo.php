<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = $_GET['type'] ?? 'robots';
    
    if ($type === 'robots') {
        // Get robots.txt content from settings
        $sql = "SELECT setting_value FROM settings WHERE setting_key = 'robots_txt'";
        $result = $conn->query($sql);
        $content = "User-agent: *\nAllow: /\n\nSitemap: https://tileandturf.com/sitemap.xml";
        
        if ($result && $result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $content = $row['setting_value'] ?: $content;
        }
        
        echo json_encode(['success' => true, 'content' => $content]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid type']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $type = $data['type'] ?? 'robots';
    $content = $data['content'] ?? '';
    
    if ($type === 'robots') {
        $content = $conn->real_escape_string($content);
        $sql = "INSERT INTO settings (setting_key, setting_value, setting_type) 
                VALUES ('robots_txt', '$content', 'text')
                ON DUPLICATE KEY UPDATE setting_value = '$content'";
        
        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Robots.txt updated successfully']);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
    } else if ($type === 'delete_sitemap') {
        // Delete static sitemap.xml file if it exists
        $sitemapFile = dirname(dirname(__FILE__)) . '/sitemap.xml';
        if (file_exists($sitemapFile)) {
            if (unlink($sitemapFile)) {
                echo json_encode(['success' => true, 'message' => 'Static sitemap.xml deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to delete sitemap.xml']);
            }
        } else {
            echo json_encode(['success' => true, 'message' => 'No static sitemap.xml file found']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid type']);
    }
}

$conn->close();
?>

