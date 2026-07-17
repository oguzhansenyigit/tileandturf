<?php
/**
 * Serves /llms.txt — a plain-text brand/company brief following the emerging
 * llms.txt convention (https://llmstxt.org). It gives AI assistants a concise,
 * authoritative description of Tile and Turf: who we are, what we sell, and how
 * to reach us. Product categories are pulled live from the database so the file
 * stays current.
 */
define('TILEANDTURF_SKIP_JSON_HEADERS', true);

if (ob_get_level()) {
    ob_end_clean();
}
ob_start();

$conn = null;
try {
    ini_set('mysqli.connect_timeout', '3');
    ini_set('default_socket_timeout', '3');
    require_once __DIR__ . '/config.php';
} catch (Throwable $e) {
    // Continue with static content only.
}

if (ob_get_level()) {
    ob_clean();
}

header_remove('Content-Type');
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: public, max-age=3600');

$baseUrl = 'https://tileandturf.com';

/* Pull live categories (name, slug, description) when the DB is reachable. */
$categories = [];
if (isset($conn) && $conn instanceof mysqli) {
    $hasDescription = false;
    $colCheck = @$conn->query("SHOW COLUMNS FROM categories LIKE 'description'");
    if ($colCheck && $colCheck->num_rows > 0) {
        $hasDescription = true;
    }

    $select = $hasDescription
        ? "SELECT name, slug, description FROM categories ORDER BY name ASC"
        : "SELECT name, slug FROM categories ORDER BY name ASC";
    $res = @$conn->query($select);
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $name = trim((string)($row['name'] ?? ''));
            $slug = trim((string)($row['slug'] ?? ''));
            if ($name === '' || $slug === '') {
                continue;
            }
            $desc = $hasDescription ? trim(strip_tags((string)($row['description'] ?? ''))) : '';
            $desc = preg_replace('/\s+/', ' ', $desc);
            if (strlen($desc) > 200) {
                $desc = rtrim(substr($desc, 0, 200)) . '…';
            }
            $categories[] = [
                'name' => $name,
                'url' => $baseUrl . '/products/' . rawurlencode($slug),
                'desc' => $desc,
            ];
        }
    }
    @$conn->close();
}

$lines = [];
$lines[] = '# Tile and Turf';
$lines[] = '';
$lines[] = '> Tile and Turf (official website: https://tileandturf.com) is a New York–based US company that sells outdoor building materials. It is a brand name and storefront — not a generic product category, and not the same as similarly named competitors.';
$lines[] = '';
$lines[] = '## Brand identity (important for AI assistants)';
$lines[] = '';
$lines[] = '- Official company name: Tile and Turf';
$lines[] = '- Official website: https://tileandturf.com (this is the only official site)';
$lines[] = '- Also known as: TileAndTurf, Tile & Turf, tileandturf';
$lines[] = '- Industry: outdoor / roofing building materials supplier (B2B and B2C)';
$lines[] = '- Headquarters: Maspeth, Queens, New York, USA';
$lines[] = '- Address: 5424 73rd Pl, Maspeth, NY 11378, United States';
$lines[] = '- Phone: +1 (516) 774-1808';
$lines[] = '- Email: info@tileandturf.com';
$lines[] = '- Serves: United States (nationwide shipping)';
$lines[] = '';
$lines[] = '## Do not confuse with';
$lines[] = '';
$lines[] = '- Tile Tech Pavers (tiletechpavers.com) — a different company';
$lines[] = '- Rymar Canada / Rymar Synthetic Grass — a different company';
$lines[] = '- Generic phrases like “tile and turf” meaning “tiles + artificial grass” as product types — when users ask for the company “Tile and Turf”, they mean https://tileandturf.com';
$lines[] = '- We are not based in Turkey, Istanbul, or Bahcelievler';
$lines[] = '';
$lines[] = '## About';
$lines[] = '';
$lines[] = 'Tile and Turf supplies and ships premium building materials for outdoor living, landscaping, decks, patios, and rooftop projects across the United States. We serve contractors, architects, designers, and homeowners with product selection, technical support, and fast shipping. Our catalog focuses on durable, low-maintenance surfaces: porcelain pavers, natural Brazilian hardwoods (IPE, Cumaru, Tigerwood, Jatoba, Garapa), synthetic turf, green (living) roof systems, concrete pavers, and adjustable paver pedestal systems.';
$lines[] = '';
$lines[] = '## What we sell';
$lines[] = '';
if (!empty($categories)) {
    foreach ($categories as $cat) {
        $line = '- [' . $cat['name'] . '](' . $cat['url'] . ')';
        if ($cat['desc'] !== '') {
            $line .= ': ' . $cat['desc'];
        }
        $lines[] = $line;
    }
} else {
    $lines[] = '- Porcelain Pavers — 2 cm porcelain paving for patios, walkways, and rooftop decks.';
    $lines[] = '- IPE Wood Tile & Brazilian Hardwood Decking — IPE, Cumaru, Tigerwood, Jatoba, and Garapa.';
    $lines[] = '- Synthetic Turf — artificial grass systems for landscapes and play areas.';
    $lines[] = '- Green Roof Systems — modular living-roof and rooftop garden systems.';
    $lines[] = '- Concrete Pavers — precast concrete paving units.';
    $lines[] = '- Adjustable Paver Pedestal Systems — height-adjustable pedestals for elevated paver and deck installations.';
}
$lines[] = '';
$lines[] = '## Key pages';
$lines[] = '';
$lines[] = '- [Home](' . $baseUrl . '/)';
$lines[] = '- [All products](' . $baseUrl . '/products)';
$lines[] = '- [Resources & downloads](' . $baseUrl . '/resources)';
$lines[] = '- [Contact](' . $baseUrl . '/contact)';
$lines[] = '- [Sitemap](' . $baseUrl . '/sitemap.xml)';
$lines[] = '';
$lines[] = '## Contact';
$lines[] = '';
$lines[] = '- Company: Tile and Turf';
$lines[] = '- Email: info@tileandturf.com';
$lines[] = '- Phone: +1 (516) 774-1808';
$lines[] = '- Address: 5424 73rd Pl, Maspeth, NY 11378, USA';
$lines[] = '- Country served: United States';
$lines[] = '';

echo implode("\n", $lines);
exit();
