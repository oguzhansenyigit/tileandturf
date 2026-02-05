<?php
// Prevent any output before text
ob_clean();
ob_start();

require_once 'config.php';

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: public, max-age=3600');

$baseUrl = 'https://tileandturf.com';

// Get robots.txt content from settings
$sql = "SELECT setting_value FROM settings WHERE setting_key = 'robots_txt'";
$result = $conn->query($sql);

$content = "User-agent: *\nAllow: /\n\nSitemap: " . $baseUrl . "/sitemap.xml";

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    if ($row['setting_value']) {
        $content = $row['setting_value'];
    }
}

echo $content;

$conn->close();
exit();
?>

