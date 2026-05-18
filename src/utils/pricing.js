/**
 * Category-level percentage discounts (applied to products in that category).
 */

export function getCategoryDiscountPercent(product) {
  const raw =
    product?.category_discount_percent ??
    product?.discount_percent ??
    null
  if (raw == null || raw === '' || raw === 0 || raw === '0') return 0
  const n = parseFloat(raw)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(n, 100)
}

export function hasCategoryDiscount(product) {
  return getCategoryDiscountPercent(product) > 0
}

export function applyCategoryDiscount(amount, product) {
  const base = parseFloat(amount)
  if (!Number.isFinite(base)) return 0
  const pct = getCategoryDiscountPercent(product)
  if (pct <= 0) return base
  return Math.round(base * (1 - pct / 100) * 100) / 100
}

/** Apply discount to all price fields on a product before cart / checkout. */
export function applyProductCategoryDiscount(product) {
  if (!product || !hasCategoryDiscount(product)) return product

  const d = (value) => {
    if (value == null || value === '') return value
    return applyCategoryDiscount(value, product)
  }

  const next = {
    ...product,
    price: d(product.price),
    sqft_price: d(product.sqft_price),
    length_base_price: d(product.length_base_price),
    length_increment_price: d(product.length_increment_price),
  }

  if (product.variationPrices && typeof product.variationPrices === 'object') {
    const variationPrices = {}
    Object.keys(product.variationPrices).forEach((key) => {
      variationPrices[key] = d(product.variationPrices[key])
    })
    next.variationPrices = variationPrices
  }

  return next
}
