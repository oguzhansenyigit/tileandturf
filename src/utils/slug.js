/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - Text to convert to slug
 * @returns {string} - URL-friendly slug
 */
export const createSlug = (text) => {
  if (!text) return ''
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '')          // Trim - from end of text
}

/**
 * Get product URL using slug or fallback to id
 * @param {object} product - Product object with slug and id
 * @returns {string} - Product URL
 */
export const getProductUrl = (product) => {
  if (!product) return '/products'
  
  // Prefer slug if available, otherwise use id
  if (product.slug && product.slug.trim() !== '') {
    // Encode slug to handle special characters in URL
    return `/product/${encodeURIComponent(product.slug)}`
  }
  
  // Fallback to id if slug doesn't exist
  return `/product/${product.id}`
}

