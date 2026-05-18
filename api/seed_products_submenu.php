<?php
/**
 * Sitedeki varsayılan OUR PRODUCTS alt menüsünü veritabanına yazar.
 * Header.jsx bu kayıtlar yokken kod içi yedek listeyi gösterir; admin sadece DB kayıtlarını listeler.
 */
require_once 'config.php';

tileandturf_require_admin();

header('Content-Type: application/json');

$defaults = [
    ['Adjustable Pedestal', 'adjustable-pedestal', '/products/adjustable-pedestal', 1],
    ['IPE Tile', 'ipe-tile', '/products/ipe-tile', 2],
    ['IPE Wood Deck', 'ipe-wood-deck', '/products/ipe-lumber', 3],
    ['Concrete Pavers', 'concrete-pavers', '/products/concrete-pavers-systems', 4],
    ['Porcelain Paver', 'porcelain-paver', '/products/porcelain-paver-systems', 5],
    ['Synthetic Grass', 'synthetic-grass', '/products/synthetic-grass', 6],
];

// OUR PRODUCTS ana menüsü
$parentSql = "SELECT id FROM menu_items 
              WHERE (slug = 'our-products' OR slug = 'products' OR name = 'OUR PRODUCTS') 
              AND (parent_id IS NULL OR parent_id = 0)
              ORDER BY id ASC LIMIT 1";
$parentResult = $conn->query($parentSql);

if (!$parentResult || $parentResult->num_rows === 0) {
    $insertParent = "INSERT INTO menu_items (name, slug, link, parent_id, order_index, status)
                     VALUES ('OUR PRODUCTS', 'our-products', '/products', NULL, 0, 'active')";
    if (!$conn->query($insertParent)) {
        echo json_encode(['success' => false, 'error' => 'OUR PRODUCTS oluşturulamadı: ' . $conn->error]);
        $conn->close();
        exit;
    }
    $parentId = $conn->insert_id;
} else {
    $parentRow = $parentResult->fetch_assoc();
    $parentId = (int) $parentRow['id'];
}

$inserted = 0;
$skipped = 0;
$errors = [];

foreach ($defaults as $item) {
    [$name, $slug, $link, $orderIndex] = $item;
    $nameEsc = $conn->real_escape_string($name);
    $slugEsc = $conn->real_escape_string($slug);
    $linkEsc = $conn->real_escape_string($link);

    $checkSql = "SELECT id, parent_id FROM menu_items WHERE slug = '$slugEsc' LIMIT 1";
    $check = $conn->query($checkSql);

    if ($check && $check->num_rows > 0) {
        $row = $check->fetch_assoc();
        $existingParent = $row['parent_id'];
        if ($existingParent === null || $existingParent === '' || (int) $existingParent === 0) {
            $updateSql = "UPDATE menu_items SET parent_id = $parentId, order_index = $orderIndex, link = '$linkEsc', name = '$nameEsc', status = 'active' WHERE id = " . (int) $row['id'];
            if ($conn->query($updateSql)) {
                $inserted++;
            } else {
                $errors[] = "$name: " . $conn->error;
            }
        } else {
            $skipped++;
        }
        continue;
    }

    $insertSql = "INSERT INTO menu_items (name, slug, link, parent_id, order_index, status)
                  VALUES ('$nameEsc', '$slugEsc', '$linkEsc', $parentId, $orderIndex, 'active')";
    if ($conn->query($insertSql)) {
        $inserted++;
    } else {
        $errors[] = "$name: " . $conn->error;
    }
}

echo json_encode([
    'success' => count($errors) === 0,
    'parent_id' => $parentId,
    'inserted' => $inserted,
    'skipped' => $skipped,
    'errors' => $errors,
    'message' => count($errors) === 0
        ? "Varsayılan alt menüler veritabanına aktarıldı ($inserted kayıt)."
        : 'Bazı kayıtlar aktarılamadı.'
]);

$conn->close();
