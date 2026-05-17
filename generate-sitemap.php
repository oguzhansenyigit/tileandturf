<?php
/**
 * Standalone script to generate sitemap.xml file
 * 
 * PLACEMENT: Put this file in your ROOT directory (same level as index.html)
 * 
 * Usage via browser:
 * https://tileandturf.com/generate-sitemap.php
 * 
 * Usage via SSH:
 * php generate-sitemap.php
 */

// Check if running from command line or web
$isCLI = php_sapi_name() === 'cli';

// If running from web, set proper headers and HTML output
if (!$isCLI) {
    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Sitemap Generator</title>";
    echo "<style>body{font-family:monospace;padding:20px;background:#f5f5f5;}";
    echo ".success{color:green;font-weight:bold;} .error{color:red;font-weight:bold;}";
    echo "pre{background:#fff;padding:15px;border:1px solid #ddd;border-radius:5px;}</style></head><body>";
    echo "<h1>Sitemap Generator</h1><pre>";
}

// Database: api/config.php (same credentials as live site)
define('TILEANDTURF_SKIP_JSON_HEADERS', true);
error_reporting(E_ALL);
ini_set('display_errors', $isCLI ? 1 : 0);

try {
    require_once __DIR__ . '/api/config.php';
} catch (Throwable $e) {
    $message = 'Database connection failed: ' . $e->getMessage();
    if (!$isCLI) {
        echo "</pre>";
        echo "<div style='color:red;padding:15px;background:#ffe6e6;border:2px solid red;border-radius:5px;margin:20px 0;'>";
        echo "<strong>Database Connection Error:</strong><br>";
        echo htmlspecialchars($message);
        echo "</div></body></html>";
    } else {
        fwrite(STDERR, "Error: $message\n");
    }
    exit(1);
}

// Test query to verify connection works
$testQuery = $conn->query("SELECT 1");
if (!$testQuery) {
    if (!$isCLI) {
        echo "</pre>";
        echo "<div style='color:red;padding:15px;background:#ffe6e6;border:2px solid red;border-radius:5px;margin:20px 0;'>";
        echo "<strong>Database Query Error:</strong><br>";
        echo htmlspecialchars($conn->error);
        echo "</div></body></html>";
    } else {
        die("Error: Database query failed: " . $conn->error . "\n");
    }
    exit();
}

$baseUrl = 'https://tileandturf.com';
$currentDate = date('Y-m-d');
$sitemapFiles = [
    __DIR__ . '/sitemap.xml',
    __DIR__ . '/public/sitemap.xml',
];

// Get all active products
// Check which timestamp column exists
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

if (!$productsResult) {
    $errorMsg = "Error executing products query: " . $conn->error;
    if (!$isCLI) {
        echo "</pre>";
        echo "<div style='color:red;padding:15px;background:#ffe6e6;border:2px solid red;border-radius:5px;margin:20px 0;'>";
        echo "<strong>Products Query Error:</strong><br>";
        echo htmlspecialchars($errorMsg);
        echo "</div></body></html>";
    } else {
        die($errorMsg . "\n");
    }
    exit();
}

// Get all categories
$categoriesSql = "SELECT slug FROM categories";
$categoriesResult = $conn->query($categoriesSql);

if (!$categoriesResult) {
    $errorMsg = "Error executing categories query: " . $conn->error;
    if (!$isCLI) {
        echo "</pre>";
        echo "<div style='color:red;padding:15px;background:#ffe6e6;border:2px solid red;border-radius:5px;margin:20px 0;'>";
        echo "<strong>Categories Query Error:</strong><br>";
        echo htmlspecialchars($errorMsg);
        echo "</div></body></html>";
    } else {
        die($errorMsg . "\n");
    }
    exit();
}

// Debug info
if (!$isCLI) {
    echo "Database connection: OK\n";
    echo "Products found: " . $productsResult->num_rows . "\n";
    echo "Categories found: " . $categoriesResult->num_rows . "\n";
    echo "Generating sitemap...\n\n";
}

$xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

// Homepage
$xml .= '<url>' . "\n";
$xml .= '<loc>' . htmlspecialchars($baseUrl, ENT_XML1, 'UTF-8') . '</loc>' . "\n";
$xml .= '<lastmod>' . $currentDate . '</lastmod>' . "\n";
$xml .= '<changefreq>daily</changefreq>' . "\n";
$xml .= '<priority>1.0</priority>' . "\n";
$xml .= '</url>' . "\n";

// Products page
$xml .= '<url>' . "\n";
$xml .= '<loc>' . htmlspecialchars($baseUrl . '/products', ENT_XML1, 'UTF-8') . '</loc>' . "\n";
$xml .= '<lastmod>' . $currentDate . '</lastmod>' . "\n";
$xml .= '<changefreq>daily</changefreq>' . "\n";
$xml .= '<priority>0.9</priority>' . "\n";
$xml .= '</url>' . "\n";

// Resources page
$xml .= '<url>' . "\n";
$xml .= '<loc>' . htmlspecialchars($baseUrl . '/resources', ENT_XML1, 'UTF-8') . '</loc>' . "\n";
$xml .= '<lastmod>' . $currentDate . '</lastmod>' . "\n";
$xml .= '<changefreq>weekly</changefreq>' . "\n";
$xml .= '<priority>0.8</priority>' . "\n";
$xml .= '</url>' . "\n";

// Individual products
if ($productsResult && $productsResult->num_rows > 0) {
    while($row = $productsResult->fetch_assoc()) {
        $slug = isset($row['slug']) ? trim((string)$row['slug']) : '';
        $pathSegment = $slug !== '' ? rawurlencode($slug) : (string)$row['id'];
        $productUrl = $baseUrl . '/product/' . $pathSegment;
        
        // Determine lastmod date
        if (isset($row['updated_at']) && $row['updated_at']) {
            $lastmod = date('Y-m-d', strtotime($row['updated_at']));
        } elseif (isset($row['created_at']) && $row['created_at']) {
            $lastmod = date('Y-m-d', strtotime($row['created_at']));
        } else {
            $lastmod = $currentDate;
        }
        
        $xml .= '<url>' . "\n";
        $xml .= '<loc>' . htmlspecialchars($productUrl, ENT_XML1, 'UTF-8') . '</loc>' . "\n";
        $xml .= '<lastmod>' . $lastmod . '</lastmod>' . "\n";
        $xml .= '<changefreq>weekly</changefreq>' . "\n";
        $xml .= '<priority>0.7</priority>' . "\n";
        $xml .= '</url>' . "\n";
    }
}

// Category pages
if ($categoriesResult && $categoriesResult->num_rows > 0) {
    while($row = $categoriesResult->fetch_assoc()) {
        $categoryUrl = $baseUrl . '/products/' . $row['slug'];
        
        $xml .= '<url>' . "\n";
        $xml .= '<loc>' . htmlspecialchars($categoryUrl, ENT_XML1, 'UTF-8') . '</loc>' . "\n";
        $xml .= '<lastmod>' . $currentDate . '</lastmod>' . "\n";
        $xml .= '<changefreq>weekly</changefreq>' . "\n";
        $xml .= '<priority>0.6</priority>' . "\n";
        $xml .= '</url>' . "\n";
    }
}

// Static pages
$staticPages = [
    '/terms-and-conditions',
    '/privacy-policy',
    '/distance-sales-agreement',
    '/return-policy',
    '/shipping-policy'
];

foreach ($staticPages as $page) {
    $xml .= '<url>' . "\n";
    $xml .= '<loc>' . htmlspecialchars($baseUrl . $page, ENT_XML1, 'UTF-8') . '</loc>' . "\n";
    $xml .= '<lastmod>' . $currentDate . '</lastmod>' . "\n";
    $xml .= '<changefreq>monthly</changefreq>' . "\n";
    $xml .= '<priority>0.5</priority>' . "\n";
    $xml .= '</url>' . "\n";
}

$xml .= '</urlset>';

// Write to file(s)
$bytesWritten = false;
$writtenPaths = [];
foreach ($sitemapFiles as $sitemapFile) {
    $dir = dirname($sitemapFile);
    if (!is_dir($dir)) {
        continue;
    }
    $n = file_put_contents($sitemapFile, $xml);
    if ($n !== false) {
        $bytesWritten = $n;
        $writtenPaths[] = $sitemapFile;
    }
}

if ($bytesWritten !== false) {
    $productCount = $productsResult->num_rows;
    $categoryCount = $categoriesResult->num_rows;
    $totalUrls = 3 + $productCount + $categoryCount + 5; // homepage + products + resources + products + categories + static pages
    
    echo "<span class='success'>✓ Sitemap.xml generated successfully!</span>\n";
    foreach ($writtenPaths as $sitemapFile) {
        echo "  Location: $sitemapFile\n";
    }
    echo "  Size: " . number_format($bytesWritten) . " bytes\n";
    echo "  Total URLs: $totalUrls\n";
    echo "    - Products: $productCount\n";
    echo "    - Categories: $categoryCount\n";
    echo "    - Static pages: 5\n";
    echo "  URL: <a href='/sitemap.xml' target='_blank'>$baseUrl/sitemap.xml</a>\n";
    
    // If running from web, also show preview
    if (!$isCLI) {
        echo "\n--- XML Content Preview (first 500 chars) ---\n";
        echo htmlspecialchars(substr($xml, 0, 500)) . "...\n";
        echo "\n<a href='/sitemap.xml' target='_blank' style='display:inline-block;margin-top:10px;padding:10px 20px;background:#3a925c;color:white;text-decoration:none;border-radius:5px;'>View Full Sitemap</a>\n";
    }
} else {
    $error = error_get_last();
    echo "<span class='error'>✗ Error: Could not write sitemap.xml file.</span>\n";
    foreach ($sitemapFiles as $sitemapFile) {
        echo "  File: $sitemapFile\n";
    }
    echo "  Check file permissions (directory must be writable)\n";
    if ($error) {
        echo "  PHP Error: " . htmlspecialchars($error['message']) . "\n";
    }
    echo "\n  Try setting permissions: chmod 755 " . dirname($sitemapFiles[0]) . "\n";
}

$conn->close();

// Close HTML if web
if (!$isCLI) {
    echo "</pre></body></html>";
}
?>

