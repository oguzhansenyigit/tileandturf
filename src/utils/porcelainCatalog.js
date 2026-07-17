/** Catalog for the single Porcelain Paver product (large PDF in /public). */
export const PORCELAIN_CATALOG_PDF = '/porcelain-paver-katalog.pdf'
export const PORCELAIN_PRODUCT_SLUG = 'porcelain-paver1'

export function isPorcelainPaverProduct(product) {
  if (!product) return false
  return String(product.slug || '').toLowerCase() === PORCELAIN_PRODUCT_SLUG
}

/** Brochure URL — forces catalog only on porcelain-paver1. */
export function getProductBrochureUrl(product, categoryBrochure) {
  if (isPorcelainPaverProduct(product)) return PORCELAIN_CATALOG_PDF
  return product?.brochure_pdf || categoryBrochure || null
}
