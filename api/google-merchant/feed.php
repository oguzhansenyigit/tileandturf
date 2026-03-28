<?php
// Prevent any output before XML
if (ob_get_level()) {
    ob_end_clean();
}
ob_start();

require_once '../config.php';

// Clear any output from config
if (ob_get_level()) {
    ob_clean();
}

// Base URL from settings (fallback: tileandturf.com)
$baseUrl = 'https://tileandturf.com';
$settingsResult = $conn->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('site_url', 'google_merchant_store_url')");
if ($settingsResult) {
    while ($row = $settingsResult->fetch_assoc()) {
        $val = trim($row['setting_value'] ?? '');
        if (!empty($val) && (strpos($val, 'http') === 0)) {
            $baseUrl = rtrim($val, '/');
            break;
        }
    }
}

// Check if is_hidden column exists
$hasIsHidden = false;
$checkCol = $conn->query("SELECT COUNT(*) as c FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = '" . $conn->real_escape_string(DB_NAME) . "' AND TABLE_NAME = 'products' AND COLUMN_NAME = 'is_hidden'");
if ($checkCol && ($r = $checkCol->fetch_assoc()) && $r['c'] > 0) {
    $hasIsHidden = true;
}

$where = ["p.status = 'active'"];
if ($hasIsHidden) {
    $where[] = "(p.is_hidden = 0 OR p.is_hidden IS NULL)";
}

$sql = "SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE " . implode(' AND ', $where) . "
        ORDER BY p.created_at DESC";
$result = $conn->query($sql);

// Set headers before any output
header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">' . "\n";
echo '<channel>' . "\n";
echo '<title>Brazilian Wood Products</title>' . "\n";
echo '<link>' . htmlspecialchars($baseUrl) . '</link>' . "\n";
echo '<description>Building materials including adjustable pedestals, IPE wood, concrete pavers, and green roof systems</description>' . "\n";

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Skip products that would be rejected by Google Merchant
        $price = (float)($row['price'] ?? 0);
        if ($price <= 0) continue;

        $image = trim($row['image'] ?? '');
        if (empty($image)) continue; // Required by Google

        $name = trim($row['name'] ?? '');
        if (empty($name)) continue;

        $description = strip_tags($row['description'] ?? '');
        if (strlen($description) < 10) continue; // Too short for Google

        // Product URL: prefer slug (SEO), fallback to id
        $slug = trim($row['slug'] ?? '');
        $productPath = (!empty($slug)) ? '/product/' . rawurlencode($slug) : '/product/' . $row['id'];
        $productUrl = $baseUrl . $productPath;

        $imagePath = ltrim($image, '/');
        $imageUrl = $baseUrl . '/' . $imagePath;

        $description = htmlspecialchars(substr($description, 0, 5000), ENT_XML1, 'UTF-8');

        echo '<item>' . "\n";
        echo '<g:id>' . htmlspecialchars($row['id'], ENT_XML1, 'UTF-8') . '</g:id>' . "\n";
        echo '<g:title>' . htmlspecialchars(substr($name, 0, 150), ENT_XML1, 'UTF-8') . '</g:title>' . "\n";
        echo '<g:description>' . $description . '</g:description>' . "\n";
        echo '<g:link>' . htmlspecialchars($productUrl, ENT_XML1, 'UTF-8') . '</g:link>' . "\n";
        echo '<g:image_link>' . htmlspecialchars($imageUrl, ENT_XML1, 'UTF-8') . '</g:image_link>' . "\n";
        echo '<g:price>' . number_format($price, 2, '.', '') . ' USD</g:price>' . "\n";
        echo '<g:availability>' . (($row['stock'] ?? 0) > 0 ? 'in stock' : 'out of stock') . '</g:availability>' . "\n";
        echo '<g:condition>new</g:condition>' . "\n";
        echo '<g:brand>Tile and Turf</g:brand>' . "\n";
        echo '<g:product_type>' . htmlspecialchars($row['category_name'] ?? 'Building Materials', ENT_XML1, 'UTF-8') . '</g:product_type>' . "\n";
        echo '<g:google_product_category>Home &amp; Garden &gt; Building Supplies</g:google_product_category>' . "\n";
        echo '</item>' . "\n";
    }
}

echo '</channel>' . "\n";
echo '</rss>';

$conn->close();
exit();
