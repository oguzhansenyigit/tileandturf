<?php
/**
 * One-shot: set brochure on porcelain-paver1 only.
 *   https://tileandturf.com/api/set-porcelain-katalog.php
 */
require_once __DIR__ . '/config.php';

tileandturf_require_admin();

header('Content-Type: application/json');

$catalog = '/porcelain-paver-katalog.pdf?v=20260717';
$slug = 'porcelain-paver1';
$updated = 0;

$stmt = $conn->prepare(
    "UPDATE products SET brochure_pdf = ? WHERE LOWER(IFNULL(slug, '')) = ?"
);
if ($stmt) {
    $stmt->bind_param('ss', $catalog, $slug);
    $stmt->execute();
    $updated = $stmt->affected_rows;
    $stmt->close();
}

echo json_encode([
    'success' => true,
    'catalog' => $catalog,
    'slug' => $slug,
    'products_updated' => $updated,
    'note' => 'Delete this script after running. Ensure public/porcelain-paver-katalog.pdf is deployed.',
]);

$conn->close();
