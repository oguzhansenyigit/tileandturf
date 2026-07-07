<?php
/**
 * Product title normalization helpers.
 *
 * House style:
 *   - Titles are UPPERCASE.
 *   - Dimensions use a single uppercase "X" with no surrounding spaces
 *     (e.g. "4x12", "1×2", "5/4 × 6"  ->  "4X12", "1X2", "5/4X6").
 *   - Extra / leading / trailing whitespace is collapsed.
 *
 * Slugs and URLs are never touched, so SEO/links stay intact.
 */

function tileandturf_title_upper($text) {
    return function_exists('mb_strtoupper')
        ? mb_strtoupper((string) $text, 'UTF-8')
        : strtoupper((string) $text);
}

/** Produce the normalized, house-style title. */
function tileandturf_title_normalize($name) {
    $t = (string) $name;

    // Collapse whitespace + trim.
    $t = preg_replace('/\s+/u', ' ', trim($t));

    // Uppercase (UTF-8 aware).
    $t = tileandturf_title_upper($t);

    // Tighten fraction spacing: "5 / 4" -> "5/4".
    $t = preg_replace('/(\d)\s*\/\s*(\d)/u', '$1/$2', $t);

    // Normalize dimension separators between numbers (incl. fractions):
    // "3 X 12", "3×12", "1 ✕ 2" -> "3X12", "3X12", "1X2".
    $t = preg_replace(
        '/(\d(?:\/\d+)?)\s*[X\x{00D7}\x{2715}\x{2A2F}]\s*(\d)/u',
        '$1X$2',
        $t
    );

    // Collapse any double spaces introduced above.
    $t = preg_replace('/\s+/u', ' ', trim($t));

    return $t;
}

/** Detect which style problems exist on the original title. */
function tileandturf_title_issues($orig) {
    $orig = (string) $orig;
    $issues = [];

    if (tileandturf_title_upper($orig) !== $orig) {
        $issues[] = ['code' => 'case', 'message' => 'Not uppercase'];
    }

    // Lowercase x, unicode multiplication signs, or spaces around the separator.
    if (preg_match('/\d\s*x\s*\d/u', $orig)
        || preg_match('/\d\s*[\x{00D7}\x{2715}\x{2A2F}]\s*\d/u', $orig)
        || preg_match('/\d\s+X\s+\d/u', $orig)
        || preg_match('/\d\s+X\d/u', $orig)
        || preg_match('/\dX\s+\d/u', $orig)) {
        $issues[] = ['code' => 'separator', 'message' => 'Inconsistent size separator'];
    }

    if (preg_match('/\s{2,}/u', $orig) || $orig !== trim($orig)) {
        $issues[] = ['code' => 'spacing', 'message' => 'Extra spacing'];
    }

    return $issues;
}

/** Scan all products and return those whose title is not house-style. */
function tileandturf_title_scan($conn) {
    $rows = tileandturf_db_fetch_all(
        $conn,
        'SELECT id, name FROM products ORDER BY name ASC',
        ''
    );

    $products = [];
    $issueCount = 0;

    foreach ($rows as $row) {
        $orig = (string) $row['name'];
        $normalized = tileandturf_title_normalize($orig);
        if ($normalized === $orig || $normalized === '') {
            continue;
        }
        $issues = tileandturf_title_issues($orig);
        if (empty($issues)) {
            // Difference exists but no specific tag — mark generic.
            $issues[] = ['code' => 'style', 'message' => 'Title style'];
        }
        $issueCount += count($issues);
        $products[] = [
            'id' => intval($row['id']),
            'current' => $orig,
            'suggested' => $normalized,
            'issues' => $issues,
        ];
    }

    return [
        'success' => true,
        'summary' => [
            'total_products' => count($rows),
            'products_with_issues' => count($products),
            'total_issues' => $issueCount,
        ],
        'products' => $products,
    ];
}

/**
 * Apply a normalized title to one product.
 * $item = ['id' => int, 'name' => string(optional override)]
 * If no name is provided, the DB title is re-normalized server-side.
 */
function tileandturf_title_apply($conn, $item) {
    $id = intval($item['id'] ?? 0);
    if ($id <= 0) {
        return ['success' => false, 'error' => 'Missing id'];
    }

    $row = tileandturf_db_fetch_one(
        $conn,
        'SELECT id, name FROM products WHERE id = ? LIMIT 1',
        'i',
        $id
    );
    if (!$row) {
        return ['success' => false, 'error' => 'Product not found', 'id' => $id];
    }

    $current = (string) $row['name'];
    $newName = isset($item['name']) && trim((string) $item['name']) !== ''
        ? tileandturf_title_normalize($item['name'])
        : tileandturf_title_normalize($current);

    if ($newName === '') {
        return ['success' => false, 'error' => 'Empty title', 'id' => $id];
    }

    if ($newName === $current) {
        return [
            'success' => true,
            'id' => $id,
            'changed' => false,
            'current' => $current,
            'new' => $newName,
        ];
    }

    $ok = tileandturf_db_execute(
        $conn,
        'UPDATE products SET name = ? WHERE id = ?',
        'si',
        $newName,
        $id
    );

    if ($ok === false) {
        return ['success' => false, 'error' => 'DB update failed', 'id' => $id];
    }

    return [
        'success' => true,
        'id' => $id,
        'changed' => true,
        'current' => $current,
        'new' => $newName,
    ];
}
