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

function tileandturf_ensure_document_seo(string $html): string
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

    return $html;
}
