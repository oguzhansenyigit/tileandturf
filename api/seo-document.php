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

    return $html;
}
