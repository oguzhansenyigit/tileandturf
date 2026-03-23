<?php
/**
 * One-time script: Remove duplicate menu_items (same slug + parent_id).
 * Keeps the row with the lowest id.
 * Run via browser: /api/fix-menu-duplicates.php
 */
require_once 'config.php';
header('Content-Type: application/json');

$sql = "SELECT id, slug, parent_id FROM menu_items ORDER BY id ASC";
$result = $conn->query($sql);
$seen = [];
$toDelete = [];

while ($row = $result->fetch_assoc()) {
    $key = ($row['parent_id'] ?? '') . '|' . $row['slug'];
    if (isset($seen[$key])) {
        $toDelete[] = $row['id'];
    } else {
        $seen[$key] = $row['id'];
    }
}

$deleted = 0;
foreach ($toDelete as $id) {
    if ($conn->query("DELETE FROM menu_items WHERE id = " . intval($id))) {
        $deleted++;
    }
}

echo json_encode([
    'success' => true,
    'duplicates_found' => count($toDelete),
    'deleted' => $deleted,
]);
