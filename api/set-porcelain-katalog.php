<?php
/**
 * One-shot: point Porcelain Paver catalog PDFs to /porcelain-paver-katalog.pdf
 * (large file lives in public/ — too big for admin upload).
 *
 * Run once while logged in as admin, then delete this file:
 *   https://tileandturf.com/api/set-porcelain-katalog.php
 */
require_once __DIR__ . '/config.php';

tileandturf_require_admin();

header('Content-Type: application/json');

$catalog = '/porcelain-paver-katalog.pdf';
$updated = [
    'products' => 0,
    'categories' => 0,
];

// Products: name/slug contains porcelain
$prodSql = "UPDATE products
            SET brochure_pdf = ?
            WHERE status = 'active'
              AND (
                LOWER(name) LIKE '%porcelain%'
                OR LOWER(IFNULL(slug, '')) LIKE '%porcelain%'
              )";
$stmt = $conn->prepare($prodSql);
if ($stmt) {
    $stmt->bind_param('s', $catalog);
    $stmt->execute();
    $updated['products'] = $stmt->affected_rows;
    $stmt->close();
}

// Categories with brochure_pdf column
$hasBrochure = false;
$col = @$conn->query("SHOW COLUMNS FROM categories LIKE 'brochure_pdf'");
if ($col && $col->num_rows > 0) {
    $hasBrochure = true;
}

if ($hasBrochure) {
    $catSql = "UPDATE categories
               SET brochure_pdf = ?
               WHERE LOWER(name) LIKE '%porcelain%'
                  OR LOWER(IFNULL(slug, '')) LIKE '%porcelain%'";
    $stmt = $conn->prepare($catSql);
    if ($stmt) {
        $stmt->bind_param('s', $catalog);
        $stmt->execute();
        $updated['categories'] = $stmt->affected_rows;
        $stmt->close();
    }
}

// Resource library table if present
$resUpdated = 0;
$resTable = @$conn->query("SHOW TABLES LIKE 'resource_library'");
if ($resTable && $resTable->num_rows > 0) {
    $resSql = "UPDATE resource_library
               SET catalog_url = ?
               WHERE LOWER(title) LIKE '%porcelain%'";
    $stmt = $conn->prepare($resSql);
    if ($stmt) {
        $stmt->bind_param('s', $catalog);
        $stmt->execute();
        $resUpdated = $stmt->affected_rows;
        $stmt->close();
    }
}

echo json_encode([
    'success' => true,
    'catalog' => $catalog,
    'products_updated' => $updated['products'],
    'categories_updated' => $updated['categories'],
    'resource_library_updated' => $resUpdated,
    'note' => 'Delete this script after running. Ensure public/porcelain-paver-katalog.pdf is deployed.',
]);

$conn->close();
