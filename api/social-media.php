<?php
require_once 'config.php';

header('Content-Type: application/json');

$sql = "SELECT platform, url, icon FROM social_media WHERE status = 'active' ORDER BY platform";
$result = $conn->query($sql);
$items = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
}

echo json_encode($items);
$conn->close();
