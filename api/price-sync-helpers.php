<?php
/**
 * Price Sync helpers: read product prices from brazilianlumber.com (public
 * WooCommerce store) and map them onto our own products + size variations.
 *
 * Safety principles:
 *  - Only fetch from the whitelisted host (no SSRF).
 *  - Never invent new size options: we only update prices of options that
 *    already exist on our product, preserving the exact variations structure.
 *  - Matching is by product name signature (species + grade + dimension); the
 *    admin always reviews a preview and approves before anything is written.
 */

if (!defined('TILEANDTURF_PS_HOST')) {
    define('TILEANDTURF_PS_HOST', 'brazilianlumber.com');
}

function tileandturf_ps_categories() {
    return [
        'ipe' => [
            'label' => 'Ipe',
            'url' => 'https://brazilianlumber.com/product-category/ipe/',
            'species' => 'ipe',
        ],
        'cumaru' => [
            'label' => 'Cumaru',
            'url' => 'https://brazilianlumber.com/product-category/best-priced-cumaru/',
            'species' => 'cumaru',
        ],
        'tigerwood' => [
            'label' => 'Tigerwood',
            'url' => 'https://brazilianlumber.com/product-category/tigerwood/',
            'species' => 'tigerwood',
        ],
        'jatoba' => [
            'label' => 'Jatoba',
            'url' => 'https://brazilianlumber.com/product-category/best-priced-jatoba/',
            'species' => 'jatoba',
        ],
        'garapa' => [
            'label' => 'Garapa',
            'url' => 'https://brazilianlumber.com/product-category/garapa/',
            'species' => 'garapa',
        ],
    ];
}

/** Only allow URLs on the whitelisted host. */
function tileandturf_ps_is_allowed_url($url) {
    $parts = parse_url($url);
    if (!$parts || empty($parts['host']) || empty($parts['scheme'])) {
        return false;
    }
    if (!in_array($parts['scheme'], ['http', 'https'], true)) {
        return false;
    }
    $host = strtolower($parts['host']);
    return $host === TILEANDTURF_PS_HOST || $host === 'www.' . TILEANDTURF_PS_HOST;
}

function tileandturf_ps_http_get($url) {
    if (!tileandturf_ps_is_allowed_url($url)) {
        return null;
    }

    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml'],
        ]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body === false || $code >= 400) {
            return null;
        }
        return $body;
    }

    $context = stream_context_create([
        'http' => ['timeout' => 20, 'user_agent' => 'Mozilla/5.0'],
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);
    $body = @file_get_contents($url, false, $context);
    return $body === false ? null : $body;
}

/** Extract listing product URLs from one category page (custom theme markup). */
function tileandturf_ps_extract_listing_urls($html) {
    $urls = [];
    if (preg_match_all(
        '/class="product-content-image"\s+href="(https:\/\/[^"]*\/product\/[^"]+)"/i',
        $html,
        $matches
    )) {
        foreach ($matches[1] as $u) {
            $urls[$u] = true;
        }
    }
    return array_keys($urls);
}

/** Detect highest pagination page number for a category. */
function tileandturf_ps_max_page($html, $categoryUrl) {
    $path = parse_url($categoryUrl, PHP_URL_PATH);
    $path = preg_quote(rtrim($path, '/'), '/');
    $max = 1;
    if (preg_match_all('/' . $path . '\/page\/(\d+)\//', $html, $m)) {
        foreach ($m[1] as $n) {
            $max = max($max, intval($n));
        }
    }
    return min($max, 10); // hard cap
}

/**
 * Collect all product URLs for a category (following pagination).
 * Returns array of product URLs.
 */
function tileandturf_ps_category_product_urls($categoryUrl) {
    $html = tileandturf_ps_http_get($categoryUrl);
    if ($html === null) {
        return ['error' => 'Could not load category page', 'urls' => []];
    }

    $urls = tileandturf_ps_extract_listing_urls($html);
    $maxPage = tileandturf_ps_max_page($html, $categoryUrl);

    for ($page = 2; $page <= $maxPage; $page++) {
        $pageUrl = rtrim($categoryUrl, '/') . '/page/' . $page . '/';
        $pageHtml = tileandturf_ps_http_get($pageUrl);
        if ($pageHtml === null) {
            continue;
        }
        foreach (tileandturf_ps_extract_listing_urls($pageHtml) as $u) {
            $urls[] = $u;
        }
    }

    $urls = array_values(array_unique($urls));
    return ['error' => null, 'urls' => $urls];
}

/**
 * Parse a single product page.
 * Returns: ['name', 'image', 'length_prices' => [int length => float price],
 *           'base_price' => float|null, 'call_for_pricing' => bool]
 */
function tileandturf_ps_parse_product_page($html) {
    $result = [
        'name' => '',
        'image' => '',
        'length_prices' => [],   // numeric lengths only -> used to update size options
        'base_price' => null,    // card price = source "from" price (min over all options)
        'from_price' => null,    // min over ALL variations (incl. linear-foot "lf")
        'call_for_pricing' => false,
    ];

    // Product title
    if (preg_match('/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>(.*?)<\/h1>/is', $html, $m)) {
        $result['name'] = trim(html_entity_decode(strip_tags($m[1]), ENT_QUOTES));
    }
    if ($result['name'] === '' && preg_match('/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i', $html, $m)) {
        $result['name'] = trim(html_entity_decode($m[1], ENT_QUOTES));
    }

    // Image
    if (preg_match('/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i', $html, $m)) {
        $result['image'] = trim(html_entity_decode($m[1], ENT_QUOTES));
    }

    // Variations JSON
    if (preg_match('/data-product_variations="([^"]*)"/is', $html, $m)) {
        $raw = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5);
        $variations = json_decode($raw, true);
        if (is_array($variations)) {
            $byLength = [];
            $allPrices = [];
            foreach ($variations as $variation) {
                if (!isset($variation['display_price'])) {
                    continue;
                }
                $price = floatval($variation['display_price']);
                if ($price <= 0) {
                    continue;
                }
                // The site's headline price is the min over ALL options,
                // including the linear-foot ("lf") option, so keep every price.
                $allPrices[] = $price;

                $length = tileandturf_ps_length_from_attributes($variation['attributes'] ?? []);
                if ($length === null) {
                    continue;
                }
                // Keep the lowest price for a given numeric length.
                if (!isset($byLength[$length]) || $price < $byLength[$length]) {
                    $byLength[$length] = $price;
                }
            }
            ksort($byLength);
            $result['length_prices'] = $byLength;
            if (!empty($allPrices)) {
                $result['from_price'] = round(min($allPrices), 2);
            }
        }
    }

    // The base (card) price mirrors the source's headline price for a variable
    // product = the minimum over ALL options (including the cheap linear-foot
    // "lf" option). We deliberately do NOT use the minimum numeric-length price,
    // which can be a scary-high short-length price when short lengths are absent.
    if ($result['from_price'] !== null) {
        $result['base_price'] = $result['from_price'];
    }

    if ($result['base_price'] === null && empty($result['length_prices'])) {
        if (stripos($html, 'call for pricing') !== false) {
            $result['call_for_pricing'] = true;
        }
    }

    return $result;
}

/** Pick a numeric length from WooCommerce attributes (prefer pa_length). */
function tileandturf_ps_length_from_attributes($attributes) {
    if (!is_array($attributes)) {
        return null;
    }
    if (isset($attributes['attribute_pa_length']) && $attributes['attribute_pa_length'] !== '') {
        $n = tileandturf_ps_first_int($attributes['attribute_pa_length']);
        if ($n !== null) {
            return $n;
        }
    }
    foreach ($attributes as $key => $value) {
        if (strpos($key, 'length') !== false && $value !== '') {
            $n = tileandturf_ps_first_int($value);
            if ($n !== null) {
                return $n;
            }
        }
    }
    return null;
}

function tileandturf_ps_first_int($value) {
    if (preg_match('/\d+/', (string) $value, $m)) {
        return intval($m[0]);
    }
    return null;
}

/* ------------------------------------------------------------------ */
/* Name signature + matching                                          */
/* ------------------------------------------------------------------ */

function tileandturf_ps_norm_name($name) {
    $n = html_entity_decode((string) $name, ENT_QUOTES);
    $n = function_exists('mb_strtolower') ? mb_strtolower($n, 'UTF-8') : strtolower($n);
    $n = str_replace(['×', '✕', '⨯', 'X'], 'x', $n);
    $n = str_replace(['”', '"', '’', "'", '“'], '', $n);
    $n = preg_replace('/\s+/', ' ', $n);
    return trim($n);
}

function tileandturf_ps_species($name) {
    $n = tileandturf_ps_norm_name($name);
    $species = [
        'tigerwood', 'tiger wood', 'ipe', 'cumaru', 'jatoba', 'garapa',
        'massaranduba', 'cypress', 'cedar', 'mahogany', 'oak',
    ];
    foreach ($species as $s) {
        if (strpos($n, $s) !== false) {
            return str_replace(' ', '', $s === 'tiger wood' ? 'tigerwood' : $s);
        }
    }
    return '';
}

function tileandturf_ps_dimension($name) {
    $n = tileandturf_ps_norm_name($name);
    if (preg_match('/(\d+(?:\/\d+)?)\s*x\s*(\d+)/', $n, $m)) {
        return $m[1] . 'x' . $m[2];
    }
    return '';
}

function tileandturf_ps_grade($name) {
    $n = tileandturf_ps_norm_name($name);
    // Tolerate the common "platinium" misspelling used in some product names.
    $n = str_replace('platinium', 'platinum', $n);
    $grades = [];
    foreach (['platinum', 'extra', 'plus', 'wall panel'] as $g) {
        if (strpos($n, $g) !== false) {
            $grades[] = str_replace(' ', '', $g);
        }
    }
    sort($grades);
    return implode(',', $grades);
}

function tileandturf_ps_signature($name) {
    return tileandturf_ps_species($name) . '|' . tileandturf_ps_grade($name) . '|' . tileandturf_ps_dimension($name);
}

/**
 * Product name derived from the URL slug. Source page titles are hand-written
 * marketing copy and are sometimes wrong (e.g. the 5/4x4 page titled "1x6 Plus"),
 * so the slug is the authoritative identity for matching.
 */
function tileandturf_ps_name_from_url($url) {
    $path = parse_url($url, PHP_URL_PATH);
    if (!$path) {
        return '';
    }
    $slug = strtolower(trim(basename(rtrim($path, '/'))));
    if ($slug === '' || $slug === 'product') {
        return '';
    }
    $name = str_replace('-', ' ', $slug);
    // Restore fractional dimensions: "5 4x4" -> "5/4x4"
    $name = preg_replace('/\b(\d+) (\d+x\d+)\b/', '$1/$2', $name);
    return trim($name);
}

/** Remove source-store marketing text before creating a local draft. */
function tileandturf_ps_draft_name($name) {
    $name = trim(html_entity_decode((string) $name, ENT_QUOTES));
    $name = preg_replace('/^\s*shop\s+/i', '', $name);
    $name = preg_replace('/\s*[-–—]\s*free\s+shipping.*$/i', '', $name);
    $name = preg_replace('/\s+/', ' ', $name);
    return trim($name);
}

function tileandturf_ps_slugify($name) {
    $slug = strtolower(tileandturf_ps_norm_name($name));
    $slug = str_replace('/', '-', $slug);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    return trim($slug, '-');
}

/* ------------------------------------------------------------------ */
/* DB product access + preview + apply                                */
/* ------------------------------------------------------------------ */

/** Fetch candidate DB products for a species (id, name, price, variations). */
function tileandturf_ps_db_candidates($conn, $species) {
    if ($species === '') {
        return [];
    }
    $like = '%' . $conn->real_escape_string($species) . '%';
    $extra = '';
    if ($species === 'tigerwood') {
        $extra = " OR name LIKE '%" . $conn->real_escape_string('tiger') . "%'";
    }
    $sql = "SELECT id, name, price, variations FROM products
            WHERE (name LIKE '$like'$extra) AND status = 'active'";
    $result = $conn->query($sql);
    $rows = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
    }
    return $rows;
}

/** Build map [int length => float price] from a product's variations JSON. */
function tileandturf_ps_db_length_prices($variationsJson) {
    $map = [];
    if (!$variationsJson) {
        return $map;
    }
    $data = json_decode($variationsJson, true);
    if (!is_array($data)) {
        return $map;
    }
    foreach ($data as $variationId => $options) {
        if ($variationId === 'product_variations' || !is_array($options)) {
            continue;
        }
        foreach ($options as $optionKey => $optionData) {
            $length = tileandturf_ps_first_int($optionKey);
            if ($length === null) {
                continue;
            }
            $price = null;
            if (is_array($optionData) && isset($optionData['price'])) {
                $price = floatval($optionData['price']);
            } elseif (is_numeric($optionData)) {
                $price = floatval($optionData);
            }
            if ($price !== null) {
                $map[$length] = $price;
            }
        }
    }
    ksort($map);
    return $map;
}

/**
 * Given an external product (parsed), build a preview against DB products.
 * Returns preview payload for the UI.
 */
function tileandturf_ps_build_preview($conn, $external, $species, $url = '') {
    // Match on the URL slug when it contains a size; page titles are unreliable.
    $matchName = $external['name'];
    $nameNote = null;
    $slugName = $url !== '' ? tileandturf_ps_name_from_url($url) : '';
    if ($slugName !== '' && tileandturf_ps_dimension($slugName) !== '') {
        if (tileandturf_ps_signature($slugName) !== tileandturf_ps_signature($external['name'])) {
            $nameNote = 'Source page title does not match its URL; matched by URL instead.';
        }
        $matchName = $slugName;
    }

    $signature = tileandturf_ps_signature($matchName);
    $extSpecies = tileandturf_ps_species($matchName);
    if ($extSpecies === '') {
        $extSpecies = $species;
        $signature = $extSpecies . '|' . tileandturf_ps_grade($matchName) . '|' . tileandturf_ps_dimension($matchName);
    }

    $preview = [
        'name' => $nameNote !== null ? strtoupper($matchName) : $external['name'],
        'name_note' => $nameNote,
        'image' => $external['image'],
        'signature' => $signature,
        'base_price' => $external['base_price'],
        'call_for_pricing' => $external['call_for_pricing'],
        'external_sizes' => [],
        'status' => 'no_match',
        'product_id' => null,
        'product_name' => null,
        'sizes' => [],
        'base_old' => null,
        'base_new' => null,
        'updatable_count' => 0,
        'candidates' => [],
    ];

    foreach ($external['length_prices'] as $len => $price) {
        $preview['external_sizes'][] = ['length' => $len, 'price' => round($price, 2)];
    }

    if ($external['call_for_pricing'] ||
        (empty($external['length_prices']) && $external['base_price'] === null)) {
        $preview['status'] = 'no_price';
        return $preview;
    }

    $dimension = tileandturf_ps_dimension($matchName);
    if ($dimension === '') {
        $preview['status'] = 'no_dimension';
        return $preview;
    }

    $candidates = tileandturf_ps_db_candidates($conn, $extSpecies);
    $matches = [];
    foreach ($candidates as $row) {
        if (tileandturf_ps_signature($row['name']) === $signature) {
            $matches[] = $row;
        }
        if (count($preview['candidates']) < 8) {
            $preview['candidates'][] = ['id' => intval($row['id']), 'name' => $row['name']];
        }
    }

    if (count($matches) === 0) {
        $preview['status'] = 'no_match';
        $preview['can_add_draft'] = true;
        return $preview;
    }
    if (count($matches) > 1) {
        $preview['status'] = 'ambiguous';
        $preview['matches'] = array_map(function ($r) {
            return ['id' => intval($r['id']), 'name' => $r['name']];
        }, $matches);
        return $preview;
    }

    $match = $matches[0];
    $preview['product_id'] = intval($match['id']);
    $preview['product_name'] = $match['name'];
    $preview['base_old'] = round(floatval($match['price']), 2);

    $dbLengths = tileandturf_ps_db_length_prices($match['variations']);
    $newPricesForBase = [];

    // Base (card) price mirrors what the source site displays.
    $sourceBase = $external['base_price'];

    if (!empty($dbLengths)) {
        foreach ($dbLengths as $len => $oldPrice) {
            $row = ['length' => $len, 'old' => round($oldPrice, 2), 'new' => null];
            if (isset($external['length_prices'][$len])) {
                $row['new'] = round($external['length_prices'][$len], 2);
                $newPricesForBase[] = $row['new'];
                if (abs($row['new'] - $row['old']) >= 0.01) {
                    $preview['updatable_count']++;
                }
            }
            $preview['sizes'][] = $row;
        }
        if ($sourceBase !== null) {
            $preview['base_new'] = round($sourceBase, 2);
        } elseif (!empty($newPricesForBase)) {
            $preview['base_new'] = round(min($newPricesForBase), 2);
        } else {
            $preview['base_new'] = $preview['base_old'];
        }
        if ($preview['base_new'] !== null && abs($preview['base_new'] - $preview['base_old']) >= 0.01) {
            $preview['updatable_count']++;
        }
        $preview['status'] = 'matched';
    } else {
        // Simple product (no size options): update base price only.
        $newBase = $sourceBase !== null
            ? round(floatval($sourceBase), 2)
            : ($external['length_prices'] ? round(min($external['length_prices']), 2) : null);
        $preview['base_new'] = $newBase;
        $preview['status'] = 'matched_simple';
        if ($newBase !== null && abs($newBase - $preview['base_old']) >= 0.01) {
            $preview['updatable_count'] = 1;
        }
    }

    return $preview;
}

/**
 * Create a hidden draft product from a source URL. Only no-match products may be
 * inserted; duplicate signatures are rejected regardless of visibility or status.
 */
function tileandturf_ps_add_draft($conn, $url, $fallbackSpecies = '') {
    if (!tileandturf_ps_is_allowed_url($url)) {
        return ['success' => false, 'error' => 'URL not allowed', 'url' => $url];
    }

    $html = tileandturf_ps_http_get($url);
    if ($html === null) {
        return ['success' => false, 'error' => 'Could not fetch product page', 'url' => $url];
    }

    $external = tileandturf_ps_parse_product_page($html);
    $name = tileandturf_ps_draft_name($external['name']);
    // Trust the URL slug over the page title when they disagree on the size.
    $slugName = tileandturf_ps_name_from_url($url);
    if ($slugName !== '' && tileandturf_ps_dimension($slugName) !== '' &&
        tileandturf_ps_signature($slugName) !== tileandturf_ps_signature($name)) {
        $name = strtoupper($slugName);
    }
    $species = tileandturf_ps_species($name);
    if ($species === '') {
        $species = strtolower(trim((string) $fallbackSpecies));
    }
    $dimension = tileandturf_ps_dimension($name);
    if ($name === '' || $species === '' || $dimension === '') {
        return ['success' => false, 'error' => 'Product name, species, or size is missing', 'url' => $url];
    }
    if ($external['base_price'] === null && empty($external['length_prices'])) {
        return ['success' => false, 'error' => 'No source price found', 'url' => $url];
    }

    $signature = $species . '|' . tileandturf_ps_grade($name) . '|' . $dimension;
    $allCandidates = tileandturf_db_fetch_all(
        $conn,
        'SELECT id, name FROM products WHERE LOWER(name) LIKE ?',
        's',
        '%' . $species . '%'
    );
    foreach ($allCandidates as $candidate) {
        if (tileandturf_ps_signature($candidate['name']) === $signature) {
            return [
                'success' => false,
                'error' => 'A product with the same species, grade, and size already exists',
                'product_id' => intval($candidate['id']),
                'url' => $url,
            ];
        }
    }

    $category = tileandturf_db_fetch_one(
        $conn,
        'SELECT id FROM categories WHERE LOWER(slug) = ? OR LOWER(name) = ? ORDER BY id LIMIT 1',
        'ss',
        $species,
        $species
    );
    $categoryId = $category ? intval($category['id']) : null;

    $variations = null;
    if (!empty($external['length_prices'])) {
        $lengthOptions = [];
        foreach ($external['length_prices'] as $length => $price) {
            $key = (string) intval($length);
            $lengthOptions[$key] = ['value' => $key, 'price' => round(floatval($price), 2)];
        }
        $variations = json_encode(['1' => $lengthOptions], JSON_UNESCAPED_SLASHES);
    }

    $basePrice = $external['base_price'] !== null
        ? round(floatval($external['base_price']), 2)
        : round(min($external['length_prices']), 2);
    $baseSlug = tileandturf_ps_slugify($name);
    if ($baseSlug === '') {
        return ['success' => false, 'error' => 'Could not create product slug', 'url' => $url];
    }
    $slug = $baseSlug;
    $suffix = 2;
    while (tileandturf_db_fetch_one($conn, 'SELECT id FROM products WHERE slug = ? LIMIT 1', 's', $slug)) {
        $slug = $baseSlug . '-' . $suffix;
        $suffix++;
    }

    $description = 'Draft imported by Price Sync. Review product details, stock, images, and pricing before activation.';
    $image = (string) ($external['image'] ?? '');
    // This project publishes products through is_hidden. Keep the row active so
    // Product Management can publish it later by unchecking "Hide Product".
    $status = 'active';
    $isHidden = 1;
    $stock = 0;
    $catalogMode = 'no';
    $stmt = $conn->prepare(
        'INSERT INTO products (name, slug, description, price, image, category_id, stock, variations, catalog_mode, status, is_hidden)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    if (!$stmt) {
        return ['success' => false, 'error' => 'Could not prepare draft insert', 'url' => $url];
    }
    $stmt->bind_param(
        'sssdsiisssi',
        $name,
        $slug,
        $description,
        $basePrice,
        $image,
        $categoryId,
        $stock,
        $variations,
        $catalogMode,
        $status,
        $isHidden
    );
    if (!$stmt->execute()) {
        $error = $stmt->error;
        $stmt->close();
        return ['success' => false, 'error' => 'Draft insert failed: ' . $error, 'url' => $url];
    }
    $productId = $stmt->insert_id;
    $stmt->close();

    return [
        'success' => true,
        'id' => intval($productId),
        'name' => $name,
        'slug' => $slug,
        'status' => 'hidden_draft',
        'url' => $url,
    ];
}

/**
 * Apply new prices to one product (re-fetches the product page for fresh data).
 * $item = ['product_id' => int, 'url' => string]
 */
function tileandturf_ps_apply_item($conn, $item) {
    $productId = intval($item['product_id'] ?? 0);
    $url = $item['url'] ?? '';

    if ($productId <= 0) {
        return ['success' => false, 'error' => 'Missing product_id'];
    }
    if (!tileandturf_ps_is_allowed_url($url)) {
        return ['success' => false, 'error' => 'URL not allowed'];
    }

    $html = tileandturf_ps_http_get($url);
    if ($html === null) {
        return ['success' => false, 'error' => 'Could not fetch product page', 'id' => $productId];
    }

    $external = tileandturf_ps_parse_product_page($html);

    $row = tileandturf_db_fetch_one(
        $conn,
        'SELECT id, name, price, variations FROM products WHERE id = ? LIMIT 1',
        'i',
        $productId
    );
    if (!$row) {
        return ['success' => false, 'error' => 'Product not found', 'id' => $productId];
    }

    $changes = [];
    $variationsJson = $row['variations'];
    $data = $variationsJson ? json_decode($variationsJson, true) : null;

    $updatedNewPrices = [];

    if (is_array($data) && !empty($external['length_prices'])) {
        foreach ($data as $variationId => &$options) {
            if ($variationId === 'product_variations' || !is_array($options)) {
                continue;
            }
            foreach ($options as $optionKey => &$optionData) {
                $length = tileandturf_ps_first_int($optionKey);
                if ($length === null || !isset($external['length_prices'][$length])) {
                    continue;
                }
                $newPrice = round(floatval($external['length_prices'][$length]), 2);
                $oldPrice = null;
                if (is_array($optionData)) {
                    $oldPrice = isset($optionData['price']) ? floatval($optionData['price']) : null;
                    $optionData['price'] = $newPrice;
                    if (!isset($optionData['value'])) {
                        $optionData['value'] = $optionKey;
                    }
                } else {
                    $oldPrice = is_numeric($optionData) ? floatval($optionData) : null;
                    $optionData = ['value' => $optionKey, 'price' => $newPrice];
                }
                $updatedNewPrices[] = $newPrice;
                if ($oldPrice === null || abs($oldPrice - $newPrice) >= 0.01) {
                    $changes[] = ['length' => $length, 'old' => $oldPrice, 'new' => $newPrice];
                }
            }
            unset($optionData);
        }
        unset($options);
    }

    // Determine new base (card) price: mirror the source's displayed price.
    $newBase = null;
    if ($external['base_price'] !== null) {
        $newBase = round(floatval($external['base_price']), 2);
    } elseif (!empty($updatedNewPrices)) {
        $newBase = round(min($updatedNewPrices), 2);
    } elseif (!empty($external['length_prices'])) {
        $newBase = round(min($external['length_prices']), 2);
    }

    if ($newBase === null && empty($changes)) {
        return ['success' => false, 'error' => 'No price data to apply', 'id' => $productId];
    }

    // Persist
    $sets = [];
    if ($newBase !== null) {
        $sets[] = 'price = ' . $newBase;
    }
    if (!empty($changes) && is_array($data)) {
        $newVariations = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $sets[] = "variations = '" . $conn->real_escape_string($newVariations) . "'";
    }

    if (empty($sets)) {
        return [
            'success' => true,
            'id' => $productId,
            'changed' => false,
            'changes' => [],
            'base_new' => $newBase,
            'message' => 'Already up to date',
        ];
    }

    $sql = 'UPDATE products SET ' . implode(', ', $sets) . ' WHERE id = ' . $productId;
    if (!$conn->query($sql)) {
        return ['success' => false, 'error' => 'DB update failed: ' . $conn->error, 'id' => $productId];
    }

    return [
        'success' => true,
        'id' => $productId,
        'product_name' => $row['name'],
        'changed' => true,
        'changes' => $changes,
        'base_new' => $newBase,
        'sizes_updated' => count($changes),
    ];
}
