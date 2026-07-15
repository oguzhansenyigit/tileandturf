<?php
/**
 * Ensures default SEO tags exist in served HTML (crawlers / audit tools without JS).
 */
function tileandturf_upsert_meta(string &$html, string $name, string $content): void
{
    $escaped = htmlspecialchars($content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $pattern =
        '/<meta\s+name=["\']' .
        preg_quote($name, '/') .
        '["\']\s+content=["\'][^"\']*["\']\s*\/?>/i';
    $tag = '<meta name="' . $name . '" content="' . $escaped . '" />';
    if (preg_match($pattern, $html)) {
        $html = preg_replace($pattern, $tag, $html, 1);
        return;
    }
    $html = preg_replace('/<head([^>]*)>/i', '<head$1>' . "\n    " . $tag, $html, 1);
}

function tileandturf_upsert_canonical(string &$html, string $href): void
{
    $escaped = htmlspecialchars($href, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $pattern = '/<link\s+rel=["\']canonical["\']\s+href=["\'][^"\']*["\']\s*\/?>/i';
    $tag = '<link rel="canonical" href="' . $escaped . '" />';
    if (preg_match($pattern, $html)) {
        $html = preg_replace($pattern, $tag, $html, 1);
        return;
    }
    $html = preg_replace('/<head([^>]*)>/i', '<head$1>' . "\n    " . $tag, $html, 1);
}

/**
 * Injects an Organization + WebSite JSON-LD graph so search engines and AI
 * assistants can recognise the brand as a distinct entity ("tileandturf").
 * Runs on every server-rendered page; skipped if a graph is already present.
 */
function tileandturf_inject_jsonld(string &$html, string $origin): void
{
    if (stripos($html, 'application/ld+json') !== false) {
        return;
    }

    $graph = [
        '@context' => 'https://schema.org',
        '@graph' => [
            [
                '@type' => 'Organization',
                '@id' => $origin . '/#organization',
                'name' => 'Tile and Turf',
                'alternateName' => ['TileAndTurf', 'Tile & Turf', 'tileandturf'],
                'legalName' => 'Tile and Turf',
                'url' => $origin . '/',
                'logo' => [
                    '@type' => 'ImageObject',
                    'url' => $origin . '/logo.svg',
                ],
                'image' => $origin . '/logo.svg',
                'description' =>
                    'Tile and Turf is a USA supplier of premium outdoor and roofing building materials: porcelain pavers, Brazilian hardwood decking and wood tile (IPE, Cumaru, Tigerwood, Jatoba, Garapa), synthetic turf, green roof systems, concrete pavers, and adjustable paver pedestal systems for commercial and residential projects.',
                'slogan' => 'Premium building materials for outdoor and roofing projects.',
                'email' => 'info@tileandturf.com',
                'telephone' => '+1-516-774-1808',
                'address' => [
                    '@type' => 'PostalAddress',
                    'streetAddress' => '5424 73rd Pl',
                    'addressLocality' => 'Maspeth',
                    'addressRegion' => 'NY',
                    'postalCode' => '11378',
                    'addressCountry' => 'US',
                ],
                'areaServed' => [
                    '@type' => 'Country',
                    'name' => 'United States',
                ],
                'contactPoint' => [
                    '@type' => 'ContactPoint',
                    'telephone' => '+1-516-774-1808',
                    'email' => 'info@tileandturf.com',
                    'contactType' => 'sales',
                    'areaServed' => 'US',
                    'availableLanguage' => ['English'],
                ],
                'knowsAbout' => [
                    'Porcelain pavers',
                    'IPE wood tile',
                    'Brazilian hardwood decking',
                    'Cumaru decking',
                    'Tigerwood decking',
                    'Jatoba decking',
                    'Garapa decking',
                    'Synthetic turf',
                    'Green roof systems',
                    'Concrete pavers',
                    'Adjustable paver pedestal systems',
                    'Outdoor flooring',
                    'Rooftop deck systems',
                ],
                'makesOffer' => [
                    ['@type' => 'Offer', 'itemOffered' => ['@type' => 'Product', 'name' => 'Porcelain Pavers']],
                    ['@type' => 'Offer', 'itemOffered' => ['@type' => 'Product', 'name' => 'IPE Wood Tile']],
                    ['@type' => 'Offer', 'itemOffered' => ['@type' => 'Product', 'name' => 'Brazilian Hardwood Decking (IPE, Cumaru, Tigerwood, Jatoba, Garapa)']],
                    ['@type' => 'Offer', 'itemOffered' => ['@type' => 'Product', 'name' => 'Synthetic Turf']],
                    ['@type' => 'Offer', 'itemOffered' => ['@type' => 'Product', 'name' => 'Green Roof Systems']],
                    ['@type' => 'Offer', 'itemOffered' => ['@type' => 'Product', 'name' => 'Concrete Pavers']],
                    ['@type' => 'Offer', 'itemOffered' => ['@type' => 'Product', 'name' => 'Adjustable Paver Pedestal Systems']],
                ],
            ],
            [
                '@type' => 'WebSite',
                '@id' => $origin . '/#website',
                'name' => 'Tile and Turf',
                'alternateName' => 'tileandturf.com',
                'url' => $origin . '/',
                'description' =>
                    'Shop premium outdoor and roofing building materials at Tile and Turf — porcelain pavers, wood tile and Brazilian hardwood decking, synthetic turf, green roof systems, concrete pavers, and pedestal systems with technical support and fast shipping across the USA.',
                'inLanguage' => 'en-US',
                'publisher' => ['@id' => $origin . '/#organization'],
                'potentialAction' => [
                    '@type' => 'SearchAction',
                    'target' => [
                        '@type' => 'EntryPoint',
                        'urlTemplate' => $origin . '/products?search={search_term_string}',
                    ],
                    'query-input' => 'required name=search_term_string',
                ],
            ],
        ],
    ];

    $json = json_encode(
        $graph,
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );
    if ($json === false) {
        return;
    }

    $tag = '<script type="application/ld+json">' . $json . '</script>';
    $html = preg_replace('/<\/head>/i', '    ' . $tag . "\n</head>", $html, 1);
}

/**
 * Append Product + Offer JSON-LD for /product/{slug|id} (crawler-friendly).
 *
 * @param mysqli|null $conn
 */
function tileandturf_inject_product_jsonld(string &$html, string $origin, $conn = null): void
{
    if (!$conn instanceof mysqli) {
        return;
    }
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    if (!preg_match('#^/product/([^/]+)/?$#', $path, $m)) {
        return;
    }
    $slug = rawurldecode($m[1]);
    if ($slug === '') {
        return;
    }

    $product = null;
    if (ctype_digit($slug)) {
        $id = intval($slug);
        $stmt = $conn->prepare(
            'SELECT id, name, slug, description, meta_description, price, image, sku, status
             FROM products WHERE id = ? LIMIT 1'
        );
        if ($stmt) {
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $res = $stmt->get_result();
            $product = $res ? $res->fetch_assoc() : null;
            $stmt->close();
        }
    }
    if (!$product) {
        $stmt = $conn->prepare(
            'SELECT id, name, slug, description, meta_description, price, image, sku, status
             FROM products WHERE slug = ? LIMIT 1'
        );
        if ($stmt) {
            $stmt->bind_param('s', $slug);
            $stmt->execute();
            $res = $stmt->get_result();
            $product = $res ? $res->fetch_assoc() : null;
            $stmt->close();
        }
    }
    if (!$product) {
        return;
    }

    $pathSeg = (!empty($product['slug']))
        ? rawurlencode((string)$product['slug'])
        : (string)intval($product['id']);
    $url = rtrim($origin, '/') . '/product/' . $pathSeg;
    $desc = trim((string)($product['meta_description'] ?: ''));
    if ($desc === '') {
        $desc = trim(strip_tags((string)($product['description'] ?? '')));
    }
    if (strlen($desc) > 300) {
        $desc = substr($desc, 0, 297) . '...';
    }
    $img = trim((string)($product['image'] ?? ''));
    if ($img !== '' && strpos($img, 'http') !== 0) {
        $img = rtrim($origin, '/') . '/' . ltrim($img, '/');
    }
    $price = floatval($product['price'] ?? 0);
    $inStock = strtolower((string)($product['status'] ?? 'active')) === 'active';

    $ld = [
        '@context' => 'https://schema.org',
        '@type' => 'Product',
        '@id' => $url . '#product',
        'name' => $product['name'],
        'sku' => $product['sku'] ?: (string)$product['id'],
        'mpn' => $product['sku'] ?: (string)$product['id'],
        'brand' => [
            '@type' => 'Brand',
            'name' => 'Tile and Turf',
        ],
        'url' => $url,
        'offers' => [
            '@type' => 'Offer',
            'url' => $url,
            'priceCurrency' => 'USD',
            'price' => number_format($price, 2, '.', ''),
            'availability' => $inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            'itemCondition' => 'https://schema.org/NewCondition',
            'seller' => [
                '@type' => 'Organization',
                '@id' => rtrim($origin, '/') . '/#organization',
                'name' => 'Tile and Turf',
            ],
        ],
    ];
    if ($desc !== '') {
        $ld['description'] = $desc;
    }
    if ($img !== '') {
        $ld['image'] = [$img];
    }

    $json = json_encode($ld, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return;
    }
    $tag = '<script type="application/ld+json" id="tt-product-jsonld-ssr">' . $json . '</script>';
    $html = preg_replace('/<\/head>/i', '    ' . $tag . "\n</head>", $html, 1);
}

function tileandturf_ensure_document_seo(string $html, $conn = null): string
{
    $origin = 'https://tileandturf.com';
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    if ($path !== '/' && substr($path, -1) === '/') {
        $path = rtrim($path, '/') ?: '/';
    }
    $canonical = rtrim($origin, '/') . ($path === '/' ? '/' : $path);

    $description =
        'Tile and Turf supplies premium building materials including porcelain pavers, IPE wood tile, synthetic turf, green roof systems, concrete pavers, and adjustable paver pedestal systems for commercial and residential projects in the USA.';
    $keywords =
        'tile and turf, building materials, porcelain pavers, IPE tile, synthetic turf, green roof, paver pedestals, concrete pavers, outdoor flooring, USA';

    tileandturf_upsert_meta($html, 'description', $description);
    tileandturf_upsert_meta($html, 'keywords', $keywords);
    tileandturf_upsert_meta($html, 'robots', 'index, follow');
    tileandturf_upsert_meta($html, 'author', 'Tile and Turf');
    tileandturf_upsert_meta($html, 'publisher', 'Tile and Turf');
    tileandturf_upsert_canonical($html, $canonical);
    tileandturf_inject_jsonld($html, $origin);
    tileandturf_inject_product_jsonld($html, $origin, $conn);

    return $html;
}
