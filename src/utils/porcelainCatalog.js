/** Shared porcelain catalog path (large PDF in /public — not uploaded via admin). */
export const PORCELAIN_CATALOG_PDF = '/porcelain-paver-katalog.pdf'

export function isPorcelainProduct(product) {
  if (!product) return false
  const hay = [
    product.name,
    product.slug,
    product.category_name,
    product.category_slug,
    product.category,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes('porcelain')
}

/** Brochure URL with porcelain catalog forced when applicable. */
export function getProductBrochureUrl(product, categoryBrochure) {
  if (isPorcelainProduct(product)) return PORCELAIN_CATALOG_PDF
  return product?.brochure_pdf || categoryBrochure || null
}
