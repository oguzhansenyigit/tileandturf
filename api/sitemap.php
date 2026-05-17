<?php
define('TILEANDTURF_SKIP_JSON_HEADERS', true);

$cacheDir = dirname(__DIR__) . '/cache';
$cacheFile = $cacheDir . '/sitemap.xml';
$cacheTtl = 3600;
$forceRefresh = isset($_GET['t']) || isset($_GET['refresh']);

if (!$forceRefresh && is_file($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    readfile($cacheFile);
    exit();
}

if (ob_get_level()) {
    ob_end_clean();
}
ob_start();

require_once 'config.php';

if (ob_get_level()) {
    ob_clean();
}

header_remove('Content-Type');
header('Content-Type: application/xml; charset=utf-8');
if ($forceRefresh) {
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
} else {
    header('Cache-Control: public, max-age=3600');
}

$baseUrl = 'https://tileandturf.com';
$currentDate = date('Y-m-d');

$checkColumns = $conn->query("SHOW COLUMNS FROM products LIKE 'updated_at'");
$hasUpdatedAt = $checkColumns && $checkColumns->num_rows > 0;

$checkColumns = $conn->query("SHOW COLUMNS FROM products LIKE 'created_at'");
$hasCreatedAt = $checkColumns && $checkColumns->num_rows > 0;

if ($hasUpdatedAt) {
    $productsSql = "SELECT id, slug, updated_at FROM products WHERE status = 'active' ORDER BY updated_at DESC";
} elseif ($hasCreatedAt) {
    $productsSql = "SELECT id, slug, created_at FROM products WHERE status = 'active' ORDER BY created_at DESC";
} else {
    $productsSql = "SELECT id, slug FROM products WHERE status = 'active' ORDER BY id DESC";
}

$productsResult = $conn->query($productsSql);
$categoriesSql = "SELECT slug FROM categories";
$categoriesResult = $conn->query($categoriesSql);

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

echo '<url>' . "\n";
echo '<loc>' . htmlspecialchars($baseUrl, ENT_XML1, 'UTF-8') . '</loc>' . "\n";
echo '<lastmod>' . $currentDate . '</lastmod>' . "\n";
echo '<changefreq>daily</changefreq>' . "\n";
echo '<priority>1.0</priority>' . "\n";
echo '</url>' . "\n";

echo '<url>' . "\n";
echo '<loc>' . htmlspecialchars($baseUrl . '/products', ENT_XML1, 'UTF-8') . '</loc>' . "\n";
echo '<lastmod>' . $currentDate . '</lastmod>' . "\n";
echo '<changefreq>daily</changefreq>' . "\n";
echo '<priority>0.9</priority>' . "\n";
echo '</url>' . "\n";

echo '<url>' . "\n";
echo '<loc>' . htmlspecialchars($baseUrl . '/resources', ENT_XML1, 'UTF-8') . '</loc>' . "\n";
echo '<lastmod>' . $currentDate . '</lastmod>' . "\n";
echo '<changefreq>weekly</changefreq>' . "\n";
echo '<priority>0.8</priority>' . "\n";
echo '</url>' . "\n";

if ($productsResult && $productsResult->num_rows > 0) {
    while ($row = $productsResult->fetch_assoc()) {
        $slug = isset($row['slug']) ? trim((string)$row['slug']) : '';
        $pathSegment = $slug !== '' ? rawurlencode($slug) : (string)$row['id'];
        $productUrl = $baseUrl . '/product/' . $pathSegment;

        if (isset($row['updated_at']) && $row['updated_at']) {
            $lastmod = date('Y-m-d', strtotime($row['updated_at']));
        } elseif (isset($row['created_at']) && $row['created_at']) {
            $lastmod = date('Y-m-d', strtotime($row['created_at']));
        } else {
            $lastmod = $currentDate;
        }

        echo '<url>' . "\n";
        echo '<loc>' . htmlspecialchars($productUrl, ENT_XML1, 'UTF-8') . '</loc>' . "\n";
        echo '<lastmod>' . $lastmod . '</lastmod>' . "\n";
        echo '<changefreq>weekly</changefreq>' . "\n";
        echo '<priority>0.7</priority>' . "\n";
        echo '</url>' . "\n";
    }
}

if ($categoriesResult && $categoriesResult->num_rows > 0) {
    while ($row = $categoriesResult->fetch_assoc()) {
        $categoryUrl = $baseUrl . '/products/' . $row['slug'];

        echo '<url>' . "\n";
        echo '<loc>' . htmlspecialchars($categoryUrl, ENT_XML1, 'UTF-8') . '</loc>' . "\n";
        echo '<lastmod>' . $currentDate . '</lastmod>' . "\n";
        echo '<changefreq>weekly</changefreq>' . "\n";
        echo '<priority>0.6</priority>' . "\n";
        echo '</url>' . "\n";
    }
}

$staticPages = [
    '/terms-and-conditions',
    '/privacy-policy',
    '/distance-sales-agreement',
    '/return-policy',
    '/shipping-policy',
];

foreach ($staticPages as $page) {
    echo '<url>' . "\n";
    echo '<loc>' . htmlspecialchars($baseUrl . $page, ENT_XML1, 'UTF-8') . '</loc>' . "\n";
    echo '<lastmod>' . $currentDate . '</lastmod>' . "\n";
    echo '<changefreq>monthly</changefreq>' . "\n";
    echo '<priority>0.5</priority>' . "\n";
    echo '</url>' . "\n";
}

echo '</urlset>';

$xml = ob_get_clean();
if ($xml !== '' && (is_dir($cacheDir) || @mkdir($cacheDir, 0755, true))) {
    @file_put_contents($cacheFile, $xml);
}
echo $xml;

$conn->close();
exit();
