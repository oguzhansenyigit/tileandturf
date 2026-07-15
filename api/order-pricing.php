<?php
/**
 * Server-side order line pricing (prevents cart price tampering).
 */

require_once __DIR__ . '/category-helpers.php';

function tileandturf_apply_discount_amount($amount, $discountPercent) {
    $base = floatval($amount);
    $pct = floatval($discountPercent);
    if ($base <= 0 || $pct <= 0) {
        return round($base, 2);
    }
    if ($pct > 100) {
        $pct = 100;
    }
    return round($base * (1 - $pct / 100), 2);
}

function tileandturf_format_measure($value) {
    $s = number_format(floatval($value), 2, '.', '');
    return rtrim(rtrim($s, '0'), '.');
}

function tileandturf_fetch_product_for_pricing($conn, $productId) {
    $id = intval($productId);
    if ($id <= 0) {
        return null;
    }

    $catFields = tileandturf_categories_join_fields($conn);
    $sql = "SELECT p.*, $catFields FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $id AND p.status = 'active' LIMIT 1";
    $result = $conn->query($sql);
    if (!$result || $result->num_rows === 0) {
        return null;
    }

    return $result->fetch_assoc();
}

/**
 * Resolve one cart line into order_items fields.
 *
 * Sqft products: product_price = $/sqft, selected_size = "5 sqft",
 * quantity = 1, subtotal = sqft × rate. Emails/admin must show selected_size,
 * not plain "1 adet".
 */
function tileandturf_resolve_order_line($conn, $cartItem) {
    $productId = intval($cartItem['id'] ?? 0);
    $quantity = max(1, intval($cartItem['quantity'] ?? 1));

    if ($productId <= 0) {
        return null;
    }

    $productRow = tileandturf_fetch_product_for_pricing($conn, $productId);
    if (!$productRow) {
        return null;
    }

    $discount = floatval($productRow['category_discount_percent'] ?? 0);
    $sqftEnabled = !empty($productRow['sqft_enabled']);
    $lengthEnabled = !empty($productRow['length_enabled']);
    $productName = (string) $productRow['name'];
    $selectedSize = null;
    $qtyLabel = null;

    if ($sqftEnabled) {
        $sqft = max(0, floatval($cartItem['sqft'] ?? 0));
        if ($sqft <= 0) {
            return null;
        }

        $perSqft = floatval($productRow['sqft_price'] ?? 0);
        if (!empty($cartItem['variationPrices']) && is_array($cartItem['variationPrices'])) {
            $variationTotal = 0;
            foreach ($cartItem['variationPrices'] as $vp) {
                $variationTotal += floatval($vp);
            }
            if ($variationTotal > 0) {
                $perSqft = $variationTotal;
            }
        }
        if ($perSqft <= 0) {
            return null;
        }

        $perSqft = tileandturf_apply_discount_amount($perSqft, $discount);
        $lineTotal = round($sqft * $perSqft, 2);
        $sqftLabel = tileandturf_format_measure($sqft);
        $selectedSize = $sqftLabel . ' sqft';
        $qtyLabel = $selectedSize;

        return [
            'product_id' => $productId,
            'product_name' => $productName,
            'product_price' => $perSqft,
            'quantity' => 1,
            'subtotal' => $lineTotal,
            'selected_size' => $selectedSize,
            'qty_label' => $qtyLabel,
            'sqft' => $sqft,
            'length' => null,
        ];
    }

    if ($lengthEnabled) {
        $length = max(0, intval($cartItem['length'] ?? 0));
        if ($length <= 0) {
            return null;
        }

        $base = floatval($productRow['length_base_price'] ?? 0);
        $inc = floatval($productRow['length_increment_price'] ?? 0);
        if ($base <= 0) {
            return null;
        }

        $base = tileandturf_apply_discount_amount($base, $discount);
        $inc = tileandturf_apply_discount_amount($inc, $discount);
        $lineTotal = round($base + (($length - 1) * $inc), 2);
        $selectedSize = 'length: ' . $length;
        $qtyLabel = $selectedSize;

        return [
            'product_id' => $productId,
            'product_name' => $productName,
            'product_price' => $lineTotal,
            'quantity' => 1,
            'subtotal' => $lineTotal,
            'selected_size' => $selectedSize,
            'qty_label' => $qtyLabel,
            'sqft' => null,
            'length' => $length,
        ];
    }

    $unit = floatval($productRow['price'] ?? 0);
    if (!empty($productRow['is_packaged']) && !empty($productRow['pack_size'])) {
        $unit = floatval($productRow['price']);
    }
    $unit = tileandturf_apply_discount_amount($unit, $discount);
    $lineTotal = round($unit * $quantity, 2);

    $sizeFromCart = trim((string)($cartItem['selectedSize'] ?? $cartItem['selected_size'] ?? ''));
    if ($sizeFromCart !== '') {
        $selectedSize = $sizeFromCart;
    }

    return [
        'product_id' => $productId,
        'product_name' => $productName,
        'product_price' => $unit,
        'quantity' => $quantity,
        'subtotal' => $lineTotal,
        'selected_size' => $selectedSize,
        'qty_label' => (string) $quantity,
        'sqft' => null,
        'length' => null,
    ];
}

function tileandturf_calculate_order_totals($conn, $items) {
    $resolved = [];
    $total = 0;

    foreach ($items as $item) {
        if (!empty($item['is_gift'])) {
            continue;
        }

        $line = tileandturf_resolve_order_line($conn, $item);
        if ($line === null) {
            $name = trim((string)($item['name'] ?? ''));
            return [
                'ok' => false,
                'error' => $name !== ''
                    ? "Invalid pricing for \"{$name}\". Square-footage / length products require qty entered on the product page."
                    : 'Invalid product in cart',
            ];
        }
        $resolved[] = $line;
        $total += $line['subtotal'];
    }

    return [
        'ok' => true,
        'items' => $resolved,
        'total' => round($total, 2),
    ];
}

?>
