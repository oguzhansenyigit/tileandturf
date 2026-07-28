<?php
/**
 * Google Merchant Center product feed.
 */
if (ob_get_level()) {
    ob_end_clean();
}
ob_start();

define('TILEANDTURF_SKIP_JSON_HEADERS', true);
require_once __DIR__ . '/../config.php';

if (ob_get_level()) {
    ob_clean();
}

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

/**
 * Build an absolute image URL Google can fetch.
 * Fixes double-prefix bugs like https://tileandturf.com/https://...
 */
function tileandturf_merchant_image_url($image, $baseUrl) {
    $image = trim((string) $image);
    $baseUrl = rtrim($baseUrl, '/');

    if ($image === '') {
        return '';
    }

    // Protocol-relative
    if (strpos($image, '//') === 0) {
        $image = 'https:' . $image;
    }

    // Already absolute — but may be wrongly stored as site + absolute.
    if (preg_match('#^https?://#i', $image)) {
        // Collapse accidental double absolute: https://tileandturf.com/https://...
        if (preg_match('#^https?://[^/]+/(https?://.+)$#i', $image, $m)) {
            $image = $m[1];
        }
        return $image;
    }

    // Relative path on our site
    return $baseUrl . '/' . ltrim(str_replace('\\', '/', $image), '/');
}

function tileandturf_merchant_google_category($categoryName) {
    $name = strtolower(trim((string) $categoryName));

    if (strpos($name, 'grass') !== false || strpos($name, 'turf') !== false || strpos($name, 'sedum') !== false) {
        return '2991'; // Home & Garden > Lawn & Garden
    }
    if (strpos($name, 'paver') !== false || strpos($name, 'porcelain') !== false || strpos($name, 'concrete') !== false) {
        return '503738'; // Hardware > Building Materials > Flooring
    }
    if (strpos($name, 'pedestal') !== false || strpos($name, 'grating') !== false || strpos($name, 'frp') !== false) {
        return '632'; // Hardware > Building Materials
    }
    if (
        strpos($name, 'ipe') !== false
        || strpos($name, 'cumaru') !== false
        || strpos($name, 'garapa') !== false
        || strpos($name, 'jatoba') !== false
        || strpos($name, 'wood') !== false
        || strpos($name, 'lumber') !== false
        || strpos($name, 'deck') !== false
    ) {
        return '1237'; // Hardware > Building Materials > Lumber & Composites
    }
    return '632'; // Hardware > Building Materials
}

$baseUrl = 'https://tileandturf.com';

$hasHidden = false;
$col = @$conn->query("SHOW COLUMNS FROM products LIKE 'is_hidden'");
if ($col && $col->num_rows > 0) {
    $hasHidden = true;
}

$sql = "SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.status = 'active'";
if ($hasHidden) {
    $sql .= " AND (p.is_hidden = 0 OR p.is_hidden IS NULL)";
}
$sql .= " ORDER BY p.created_at DESC";

$result = $conn->query($sql);

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">' . "\n";
echo '<channel>' . "\n";
echo '<title>Tile and Turf</title>' . "\n";
echo '<link>' . htmlspecialchars($baseUrl, ENT_XML1, 'UTF-8') . '</link>' . "\n";
echo '<description>Building materials including hardwood, adjustable pedestals, pavers, and green roof systems</description>' . "\n";

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $price = round(floatval($row['price'] ?? 0), 2);
        // Google rejects 0 / missing prices — skip until priced.
        if ($price <= 0) {
            continue;
        }

        $imageUrl = tileandturf_merchant_image_url($row['image'] ?? '', $baseUrl);
        if ($imageUrl === '' || !preg_match('#^https?://#i', $imageUrl)) {
            continue;
        }
        // Still broken if double-prefixed somehow
        if (preg_match('#https?://.+https?://#i', $imageUrl)) {
            $imageUrl = tileandturf_merchant_image_url($imageUrl, $baseUrl);
        }
        if (preg_match('#https?://.+https?://#i', $imageUrl)) {
            continue;
        }

        $productId = intval($row['id']);
        $slug = trim((string) ($row['slug'] ?? ''));
        $productUrl = $slug !== ''
            ? $baseUrl . '/product/' . rawurlencode($slug)
            : $baseUrl . '/product/' . $productId;

        $description = strip_tags($row['description'] ?? '');
        $description = trim(preg_replace('/\s+/', ' ', $description));
        if ($description === '') {
            $description = trim((string) ($row['name'] ?? 'Product'));
        }
        $description = htmlspecialchars(substr($description, 0, 5000), ENT_XML1, 'UTF-8');

        $stockRaw = $row['stock'] ?? null;
        if ($stockRaw === null || $stockRaw === '') {
            $availability = 'in stock';
        } else {
            $availability = intval($stockRaw) > 0 ? 'in stock' : 'out of stock';
        }

        $googleCat = tileandturf_merchant_google_category(
            ($row['category_name'] ?? '') . ' ' . ($row['name'] ?? '')
        );

        echo '<item>' . "\n";
        echo '<g:id>' . htmlspecialchars((string) $productId, ENT_XML1, 'UTF-8') . '</g:id>' . "\n";
        echo '<g:title>' . htmlspecialchars(substr((string) $row['name'], 0, 150), ENT_XML1, 'UTF-8') . '</g:title>' . "\n";
        echo '<g:description>' . $description . '</g:description>' . "\n";
        echo '<g:link>' . htmlspecialchars($productUrl, ENT_XML1, 'UTF-8') . '</g:link>' . "\n";
        echo '<g:image_link>' . htmlspecialchars($imageUrl, ENT_XML1, 'UTF-8') . '</g:image_link>' . "\n";
        echo '<g:price>' . number_format($price, 2, '.', '') . ' USD</g:price>' . "\n";
        echo '<g:availability>' . $availability . '</g:availability>' . "\n";
        echo '<g:condition>new</g:condition>' . "\n";
        echo '<g:brand>Tile and Turf</g:brand>' . "\n";
        echo '<g:product_type>' . htmlspecialchars($row['category_name'] ?? 'Building Materials', ENT_XML1, 'UTF-8') . '</g:product_type>' . "\n";
        echo '<g:google_product_category>' . htmlspecialchars($googleCat, ENT_XML1, 'UTF-8') . '</g:google_product_category>' . "\n";
        echo '</item>' . "\n";
    }
}

echo '</channel>' . "\n";
echo '</rss>';

$conn->close();
exit();
