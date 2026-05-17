<?php

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
    return $url;
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
    return $row;
}
