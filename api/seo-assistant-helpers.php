<?php
/**
 * SEO scan, rule-based suggestions, optional OpenAI enhancement, apply helpers.
 */

function tileandturf_seo_has_product_meta_columns($conn) {
    static $has = null;
    if ($has !== null) {
        return $has;
    }
    $row = tileandturf_db_fetch_one(
        $conn,
        "SELECT COUNT(*) AS count FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'meta_title'",
        's',
        DB_NAME
    );
    $has = $row && intval($row['count']) > 0;
    return $has;
}

function tileandturf_seo_strip_text($html, $maxLen = null) {
    $text = trim(preg_replace('/\s+/', ' ', strip_tags((string) $html)));
    if ($maxLen !== null && strlen($text) > $maxLen) {
        $text = rtrim(substr($text, 0, $maxLen - 1)) . '…';
    }
    return $text;
}

function tileandturf_seo_truncate($text, $maxLen) {
    $text = trim((string) $text);
    if (strlen($text) <= $maxLen) {
        return $text;
    }
    return rtrim(substr($text, 0, $maxLen - 1)) . '…';
}

function tileandturf_openai_api_key() {
    if (defined('TILEANDTURF_OPENAI_API_KEY') && TILEANDTURF_OPENAI_API_KEY !== '') {
        return TILEANDTURF_OPENAI_API_KEY;
    }
    return getenv('OPENAI_API_KEY') ?: '';
}

function tileandturf_seo_keyword_candidates($name, $categoryName, $slug) {
    $parts = preg_split('/[\s,\-|\/]+/', strtolower($name . ' ' . $categoryName . ' ' . $slug));
    $parts = array_values(array_filter(array_map('trim', $parts), function ($w) {
        return strlen($w) > 2 && !in_array($w, ['the', 'and', 'for', 'with', 'tile', 'turf'], true);
    }));
    return array_slice(array_unique($parts), 0, 8);
}

function tileandturf_seo_build_suggestions($product, $categoryName, $issueCodes = []) {
    $name = trim($product['name'] ?? '');
    $slug = trim($product['slug'] ?? '');
    $description = trim($product['description'] ?? '');
    $categoryLabel = $categoryName ?: 'Building Materials';
    $productId = intval($product['id'] ?? 0);
    $currentTitle = trim($product['meta_title'] ?? '');
    $currentMetaDesc = trim($product['meta_description'] ?? '');
    $plain = tileandturf_seo_strip_text($description);

    $titleBase = $name . ' | ' . $categoryLabel . ' | Tile and Turf';
    if (in_array('duplicate_meta_title', $issueCodes, true) && $slug !== '') {
        $titleBase = $name . ' | ' . $categoryLabel . ' | ' . $slug . ' | Tile and Turf';
    }
    $suggestedTitle = tileandturf_seo_truncate($titleBase, 60);
    if (strlen($suggestedTitle) < 25) {
        $suggestedTitle = tileandturf_seo_truncate($name . ' | Premium ' . $categoryLabel . ' | Tile and Turf', 60);
    }
    if ($currentTitle !== '' && $suggestedTitle === $currentTitle && $productId > 0) {
        $suggestedTitle = tileandturf_seo_truncate($titleBase . ' #' . $productId, 60);
    }

    $templateDescription =
        "Shop {$name} from Tile and Turf. Premium {$categoryLabel} for commercial and residential outdoor projects across the USA. Request a quote or order online today.";

    if (strlen($plain) >= 120) {
        $suggestedDescription = tileandturf_seo_truncate($plain, 160);
    } else {
        $suggestedDescription = tileandturf_seo_truncate($templateDescription, 160);
    }

    if (strlen($suggestedDescription) < 120) {
        $suggestedDescription = tileandturf_seo_truncate($templateDescription, 160);
    }
    if ($currentMetaDesc !== '' && $suggestedDescription === $currentMetaDesc) {
        $suggestedDescription = tileandturf_seo_truncate($templateDescription, 160);
    }

    $keywords = tileandturf_seo_keyword_candidates($name, $categoryLabel, $slug);
    $keywords[] = 'tile and turf';
    $keywords[] = strtolower(str_replace(' ', '-', $categoryLabel));
    if ($slug !== '') {
        $keywords[] = $slug;
    }
    $suggestedKeywords = tileandturf_seo_truncate(implode(', ', array_unique($keywords)), 500);

    $suggestedBody = $description;
    if (strlen($plain) < 120) {
        $suggestedBody =
            "<p>{$name} is a professional-grade {$categoryLabel} solution from Tile and Turf, designed for durable outdoor installations in commercial and residential environments.</p>"
            . "<p>Our team supports architects, contractors, and property owners with product selection, technical guidance, and reliable supply across the United States.</p>"
            . (strlen($plain) > 0 ? "<p>{$plain}</p>" : '');
    }

    return [
        'meta_title' => $suggestedTitle,
        'meta_description' => $suggestedDescription,
        'meta_keywords' => $suggestedKeywords,
        'description' => $suggestedBody,
    ];
}

function tileandturf_seo_analyze_product($product, $categoryName, $titleCounts) {
    $issues = [];
    $metaTitle = trim($product['meta_title'] ?? '');
    $metaDescription = trim($product['meta_description'] ?? '');
    $metaKeywords = trim($product['meta_keywords'] ?? '');
    $description = trim($product['description'] ?? '');
    $slug = trim($product['slug'] ?? '');
    $plainDesc = tileandturf_seo_strip_text($description);

    if ($metaTitle === '') {
        $issues[] = ['code' => 'missing_meta_title', 'severity' => 'high', 'message' => 'Meta title is missing'];
    } elseif (strlen($metaTitle) > 60) {
        $issues[] = ['code' => 'meta_title_long', 'severity' => 'medium', 'message' => 'Meta title exceeds 60 characters'];
    } elseif (strlen($metaTitle) < 25) {
        $issues[] = ['code' => 'meta_title_short', 'severity' => 'low', 'message' => 'Meta title is very short'];
    }

    if ($metaDescription === '') {
        $issues[] = ['code' => 'missing_meta_description', 'severity' => 'high', 'message' => 'Meta description is missing'];
    } elseif (strlen($metaDescription) > 160) {
        $issues[] = ['code' => 'meta_description_long', 'severity' => 'medium', 'message' => 'Meta description exceeds 160 characters'];
    } elseif (strlen($metaDescription) < 100) {
        $issues[] = ['code' => 'meta_description_short', 'severity' => 'low', 'message' => 'Meta description is short for SEO'];
    }

    if ($metaKeywords === '') {
        $issues[] = ['code' => 'missing_meta_keywords', 'severity' => 'low', 'message' => 'Meta keywords are missing'];
    }

    if ($plainDesc === '') {
        $issues[] = ['code' => 'missing_description', 'severity' => 'high', 'message' => 'Product description is empty'];
    } elseif (strlen($plainDesc) < 120) {
        $issues[] = ['code' => 'description_short', 'severity' => 'medium', 'message' => 'Product description is too short for organic SEO'];
    }

    if ($slug === '') {
        $issues[] = ['code' => 'missing_slug', 'severity' => 'high', 'message' => 'Product slug is missing'];
    }

    if ($metaTitle !== '' && isset($titleCounts[$metaTitle]) && $titleCounts[$metaTitle] > 1) {
        $issues[] = ['code' => 'duplicate_meta_title', 'severity' => 'high', 'message' => 'Duplicate meta title used on another product'];
    }

    if (empty($issues)) {
        return null;
    }

    $issueCodes = array_map(function ($issue) {
        return $issue['code'];
    }, $issues);
    $suggestions = tileandturf_seo_build_suggestions($product, $categoryName, $issueCodes);

    return [
        'entity_type' => 'product',
        'id' => intval($product['id']),
        'name' => $product['name'] ?? '',
        'slug' => $slug,
        'category_name' => $categoryName,
        'url' => '/product/' . ($slug ?: $product['id']),
        'current' => [
            'meta_title' => $metaTitle,
            'meta_description' => $metaDescription,
            'meta_keywords' => $metaKeywords,
            'description' => $description,
        ],
        'issues' => $issues,
        'suggested' => $suggestions,
        'score' => max(0, 100 - count($issues) * 12),
    ];
}

function tileandturf_seo_scan($conn) {
    if (!tileandturf_seo_has_product_meta_columns($conn)) {
        return [
            'success' => false,
            'error' => 'Product SEO columns are missing. Run api/add_seo_fields.php first.',
        ];
    }

    $products = tileandturf_db_fetch_all(
        $conn,
        "SELECT p.id, p.name, p.slug, p.description, p.meta_title, p.meta_description, p.meta_keywords, p.status,
                c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         ORDER BY p.name ASC",
        ''
    );

    $titleCounts = [];
    foreach ($products as $product) {
        $title = trim($product['meta_title'] ?? '');
        if ($title !== '') {
            $titleCounts[$title] = ($titleCounts[$title] ?? 0) + 1;
        }
    }

    $findings = [];
    foreach ($products as $product) {
        $finding = tileandturf_seo_analyze_product($product, $product['category_name'] ?? '', $titleCounts);
        if ($finding) {
            $findings[] = $finding;
        }
    }

    $siteIssues = [];
    $robots = tileandturf_db_fetch_one(
        $conn,
        "SELECT setting_value FROM settings WHERE setting_key = 'robots_txt' LIMIT 1",
        ''
    );
    $robotsContent = $robots['setting_value'] ?? '';
    if ($robotsContent === '' || stripos($robotsContent, 'sitemap') === false) {
        $siteIssues[] = [
            'code' => 'robots_sitemap',
            'severity' => 'medium',
            'message' => 'robots.txt should reference your sitemap URL',
        ];
    }

    $missingMetaCount = count($findings);
    $highSeverity = 0;
    foreach ($findings as $f) {
        foreach ($f['issues'] as $issue) {
            if ($issue['severity'] === 'high') {
                $highSeverity++;
            }
        }
    }

    return [
        'success' => true,
        'scanned_at' => gmdate('c'),
        'ai_available' => tileandturf_openai_api_key() !== '',
        'summary' => [
            'total_products' => count($products),
            'products_with_issues' => $missingMetaCount,
            'high_severity_issues' => $highSeverity,
            'site_issues' => count($siteIssues),
        ],
        'site_issues' => $siteIssues,
        'site_recommendations' => [
            'Refresh sitemap after applying product SEO fixes (SEO Management tab).',
            'Keep meta titles under 60 characters and meta descriptions between 120–160 characters.',
            'Use unique meta titles for every active product.',
            'Add OpenAI API key to config.local.php for richer AI-generated organic copy.',
        ],
        'products' => $findings,
    ];
}

function tileandturf_openai_enhance_product_seo($product, $categoryName, $baseSuggestions) {
    $apiKey = tileandturf_openai_api_key();
    if ($apiKey === '') {
        return ['success' => true, 'suggested' => $baseSuggestions, 'ai_used' => false];
    }

    $payload = [
        'model' => 'gpt-4o-mini',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are an SEO copywriter for Tile and Turf, a New York (Maspeth, NY) based US building materials company serving the United States only. Never mention Turkey, Istanbul, Bahcelievler, or any non-US local market. Write natural, organic, non-spammy English. Return ONLY valid JSON with keys: meta_title (max 60 chars), meta_description (max 160 chars), meta_keywords (comma-separated, max 500 chars), description (HTML with 2-3 short paragraphs, no hype, factual).',
            ],
            [
                'role' => 'user',
                'content' => json_encode([
                    'product_name' => $product['name'] ?? '',
                    'category' => $categoryName,
                    'slug' => $product['slug'] ?? '',
                    'current_description' => tileandturf_seo_strip_text($product['description'] ?? '', 500),
                    'baseline_suggestions' => $baseSuggestions,
                ], JSON_UNESCAPED_UNICODE),
            ],
        ],
        'temperature' => 0.5,
        'response_format' => ['type' => 'json_object'],
    ];

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 45,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return ['success' => false, 'error' => 'AI request failed', 'suggested' => $baseSuggestions, 'ai_used' => false];
    }

    $decoded = json_decode($response, true);
    $content = $decoded['choices'][0]['message']['content'] ?? '';
    $json = json_decode($content, true);
    if (!is_array($json)) {
        return ['success' => false, 'error' => 'Invalid AI response', 'suggested' => $baseSuggestions, 'ai_used' => false];
    }

    $suggested = [
        'meta_title' => tileandturf_seo_truncate($json['meta_title'] ?? $baseSuggestions['meta_title'], 60),
        'meta_description' => tileandturf_seo_truncate($json['meta_description'] ?? $baseSuggestions['meta_description'], 160),
        'meta_keywords' => tileandturf_seo_truncate($json['meta_keywords'] ?? $baseSuggestions['meta_keywords'], 500),
        'description' => $json['description'] ?? $baseSuggestions['description'],
    ];

    return ['success' => true, 'suggested' => $suggested, 'ai_used' => true];
}

function tileandturf_seo_fetch_product_row($conn, $id) {
    return tileandturf_db_fetch_one(
        $conn,
        "SELECT p.id, p.name, p.slug, p.description, p.meta_title, p.meta_description, p.meta_keywords, p.status,
                c.name AS category_name
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.id = ?
         LIMIT 1",
        'i',
        $id
    );
}

function tileandturf_seo_apply_product($conn, $item) {
    $id = intval($item['id'] ?? 0);
    if (!$id) {
        return ['success' => false, 'error' => 'Invalid product id'];
    }

    if (!tileandturf_seo_has_product_meta_columns($conn)) {
        return ['success' => false, 'error' => 'SEO columns missing. Run api/add_seo_fields.php first.'];
    }

    $existing = tileandturf_seo_fetch_product_row($conn, $id);
    if (!$existing) {
        return ['success' => false, 'error' => 'Product not found'];
    }

    $metaTitle = trim($item['meta_title'] ?? '');
    $metaDescription = trim($item['meta_description'] ?? '');
    $metaKeywords = trim($item['meta_keywords'] ?? '');
    $applyDescription = array_key_exists('description', $item) && trim((string) $item['description']) !== '';
    $description = $applyDescription ? trim((string) $item['description']) : null;

    if ($metaTitle === '' && $metaDescription === '' && !$applyDescription) {
        return ['success' => false, 'error' => 'Nothing to apply'];
    }

    $sets = [];
    if ($metaTitle !== '') {
        $sets[] = "meta_title = '" . $conn->real_escape_string($metaTitle) . "'";
    }
    if ($metaDescription !== '') {
        $sets[] = "meta_description = '" . $conn->real_escape_string($metaDescription) . "'";
    }
    if ($metaKeywords !== '') {
        $sets[] = "meta_keywords = '" . $conn->real_escape_string($metaKeywords) . "'";
    }
    if ($applyDescription) {
        $sets[] = "description = '" . $conn->real_escape_string($description) . "'";
    }

    if (empty($sets)) {
        return ['success' => false, 'error' => 'Nothing to apply'];
    }

    $sql = 'UPDATE products SET ' . implode(', ', $sets) . ' WHERE id = ' . $id;
    if (!$conn->query($sql)) {
        return ['success' => false, 'error' => 'Database update failed: ' . $conn->error];
    }

    $updated = tileandturf_seo_fetch_product_row($conn, $id);

    return [
        'success' => true,
        'id' => $id,
        'changed' => $conn->affected_rows > 0,
        'updated' => [
            'meta_title' => $updated['meta_title'] ?? '',
            'meta_description' => $updated['meta_description'] ?? '',
            'meta_keywords' => $updated['meta_keywords'] ?? '',
            'description' => $updated['description'] ?? '',
        ],
        'before' => [
            'meta_title' => $existing['meta_title'] ?? '',
            'meta_description' => $existing['meta_description'] ?? '',
            'meta_keywords' => $existing['meta_keywords'] ?? '',
            'description' => $existing['description'] ?? '',
        ],
    ];
}

?>
