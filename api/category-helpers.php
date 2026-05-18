<?php
/**
 * Shared helpers for category table columns and product JOIN selects.
 */

function tileandturf_category_column_exists($conn, $column) {
    $col = $conn->real_escape_string($column);
    $sql = "SELECT COUNT(*) as count FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = '" . DB_NAME . "' 
            AND TABLE_NAME = 'categories' 
            AND COLUMN_NAME = '$col'";
    $result = $conn->query($sql);
    if ($result && ($row = $result->fetch_assoc())) {
        return intval($row['count']) > 0;
    }
    return false;
}

function tileandturf_categories_join_fields($conn) {
    static $fields = null;
    if ($fields !== null) {
        return $fields;
    }

    $fields = 'c.name as category_name, c.slug as category_slug';
    if (
        tileandturf_category_column_exists($conn, 'datasheet_pdf')
        && tileandturf_category_column_exists($conn, 'brochure_pdf')
    ) {
        $fields .= ', c.datasheet_pdf as category_datasheet_pdf, c.brochure_pdf as category_brochure_pdf';
    }
    if (tileandturf_category_column_exists($conn, 'discount_percent')) {
        $fields .= ', c.discount_percent as category_discount_percent';
    }

    return $fields;
}

function tileandturf_category_discount_sql_value($conn, $discountPercent) {
    if (!tileandturf_category_column_exists($conn, 'discount_percent')) {
        return null;
    }
    if ($discountPercent === null || $discountPercent === '') {
        return 'NULL';
    }
    $value = floatval($discountPercent);
    if ($value <= 0) {
        return 'NULL';
    }
    if ($value > 100) {
        $value = 100;
    }
    return number_format($value, 2, '.', '');
}

function tileandturf_category_discount_set_fragment($conn, $data) {
    $sqlValue = tileandturf_category_discount_sql_value($conn, $data['discount_percent'] ?? null);
    if ($sqlValue === null) {
        return '';
    }
    return ', discount_percent = ' . $sqlValue;
}

?>
