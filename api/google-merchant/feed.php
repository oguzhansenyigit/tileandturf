<?php
// Prevent any output before XML
if (ob_get_level()) {
    ob_end_clean();
}
ob_start();

// Suppress any output from config
require_once '../config.php';

// Clear any output from config
if (ob_get_level()) {
    ob_clean();
}

// Set headers before any output
header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');

// Get products for Google Merchant Center
$sql = "SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.status = 'active' 
        ORDER BY p.created_at DESC";
$result = $conn->query($sql);

$baseUrl = 'https://tileandturf.com';

// Start XML output
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">' . "\n";
echo '<channel>' . "\n";
echo '<title>Brazilian Wood Products</title>' . "\n";
echo '<link>' . htmlspecialchars($baseUrl) . '</link>' . "\n";
echo '<description>Building materials including adjustable pedestals, IPE wood, concrete pavers, and green roof systems</description>' . "\n";

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $productUrl = $baseUrl . '/product/' . $row['id'];
        $imageUrl = $baseUrl . '/' . ltrim($row['image'] ?? 'slider.webp', '/');
        
        // Clean description - remove HTML and limit length
        $description = strip_tags($row['description'] ?? '');
        $description = htmlspecialchars(substr($description, 0, 5000), ENT_XML1, 'UTF-8');
        
        echo '<item>' . "\n";
        echo '<g:id>' . htmlspecialchars($row['id'], ENT_XML1, 'UTF-8') . '</g:id>' . "\n";
        echo '<g:title>' . htmlspecialchars(substr($row['name'], 0, 150), ENT_XML1, 'UTF-8') . '</g:title>' . "\n";
        echo '<g:description>' . $description . '</g:description>' . "\n";
        echo '<g:link>' . htmlspecialchars($productUrl, ENT_XML1, 'UTF-8') . '</g:link>' . "\n";
        echo '<g:image_link>' . htmlspecialchars($imageUrl, ENT_XML1, 'UTF-8') . '</g:image_link>' . "\n";
        echo '<g:price>' . number_format((float)$row['price'], 2, '.', '') . ' USD</g:price>' . "\n";
        echo '<g:availability>' . ($row['stock'] > 0 ? 'in stock' : 'out of stock') . '</g:availability>' . "\n";
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
?>

