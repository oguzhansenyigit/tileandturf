<?php

/** Fixed public catalog for Porcelain Paver products (~44MB; too large for admin upload). */
define('TILEANDTURF_PORCELAIN_CATALOG_PDF', '/porcelain-paver-katalog.pdf');

function tileandturf_normalize_media_url($url)
{
    if (!is_string($url) || $url === '') {
        return $url;
    }
    $url = trim($url);
    if ($url === '') {
        return $url;
    }
    if (preg_match('#^https?://#i', $url)) {
        return $url;
    }
    if (strpos($url, '//') === 0) {
        return 'https:' . $url;
    }
    if ($url[0] !== '/') {
        $url = '/' . $url;
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'tileandturf.com';
    return $scheme . '://' . $host . $url;
}

function tileandturf_is_porcelain_row(array $row): bool
{
    $hay = strtolower(implode(' ', [
        (string) ($row['name'] ?? ''),
        (string) ($row['slug'] ?? ''),
        (string) ($row['category_name'] ?? ''),
        (string) ($row['category_slug'] ?? ''),
        (string) ($row['title'] ?? ''),
    ]));
    return strpos($hay, 'porcelain') !== false;
}

function tileandturf_normalize_product_media(array $row): array
{
    if (!empty($row['image'])) {
        $row['image'] = tileandturf_normalize_media_url($row['image']);
    }
    foreach (['comparison_before', 'comparison_after'] as $key) {
        if (!empty($row[$key])) {
            $row[$key] = tileandturf_normalize_media_url($row[$key]);
        }
    }
    if (!empty($row['gallery_images'])) {
        $gallery = $row['gallery_images'];
        if (is_string($gallery)) {
            $decoded = json_decode($gallery, true);
            if (is_array($decoded)) {
                $row['gallery_images'] = json_encode(
                    array_map('tileandturf_normalize_media_url', $decoded)
                );
            }
        }
    }

    // Always attach the porcelain catalog (no admin upload needed for large PDF)
    if (tileandturf_is_porcelain_row($row)) {
        $row['brochure_pdf'] = TILEANDTURF_PORCELAIN_CATALOG_PDF;
        if (array_key_exists('category_brochure_pdf', $row)) {
            $row['category_brochure_pdf'] = TILEANDTURF_PORCELAIN_CATALOG_PDF;
        }
    }

    return $row;
}
