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

function tileandturf_unit_price_from_product_row($productRow, $cartItem) {
    $discount = floatval($productRow['category_discount_percent'] ?? 0);

    if (!empty($cartItem['sqft']) && !empty($productRow['sqft_enabled'])) {
        $sqft = max(0, floatval($cartItem['sqft']));
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

        $perSqft = tileandturf_apply_discount_amount($perSqft, $discount);
        return round($sqft * $perSqft, 2);
    }

    if (!empty($cartItem['length']) && !empty($productRow['length_enabled'])) {
        $length = max(1, intval($cartItem['length']));
        $base = floatval($productRow['length_base_price'] ?? 0);
        $inc = floatval($productRow['length_increment_price'] ?? 0);
        $base = tileandturf_apply_discount_amount($base, $discount);
        $inc = tileandturf_apply_discount_amount($inc, $discount);
        return round($base + (($length - 1) * $inc), 2);
    }

    $unit = floatval($productRow['price'] ?? 0);
    if (!empty($productRow['is_packaged']) && !empty($productRow['pack_size'])) {
        // Cart stores package price in price for packaged items.
        $unit = floatval($productRow['price']);
    }

    return tileandturf_apply_discount_amount($unit, $discount);
}

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

    $computed = tileandturf_unit_price_from_product_row($productRow, $cartItem);
    $isCompositeLine = !empty($cartItem['sqft']) || !empty($cartItem['length']);

    if ($isCompositeLine) {
        $lineTotal = $computed;
        $unitPrice = $quantity > 0 ? round($lineTotal / $quantity, 2) : $computed;
    } else {
        $unitPrice = $computed;
        $lineTotal = round($unitPrice * $quantity, 2);
    }

    return [
        'product_id' => $productId,
        'product_name' => $productRow['name'],
        'product_price' => $unitPrice,
        'quantity' => $quantity,
        'subtotal' => $lineTotal,
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
            return ['ok' => false, 'error' => 'Invalid product in cart'];
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
