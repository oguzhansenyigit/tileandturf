function setMetaName(name, content) {
  if (content == null || content === '') return
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.insertBefore(el, document.head.firstChild)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  if (!href) return
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * @param {{
 *   title?: string
 *   description?: string
 *   keywords?: string
 *   canonicalUrl?: string
 *   robots?: string
 *   author?: string
 *   publisher?: string
 * }} opts
 */
export function applyDocumentSeo(opts = {}) {
  const {
    title,
    description,
    keywords,
    canonicalUrl,
    robots,
    author,
    publisher,
  } = opts

  if (title) document.title = title
  if (description) setMetaName('description', description)
  if (keywords) setMetaName('keywords', keywords)
  if (robots) setMetaName('robots', robots)
  if (author) setMetaName('author', author)
  if (publisher) setMetaName('publisher', publisher)
  if (canonicalUrl) setCanonical(canonicalUrl)
}

const PRODUCT_LD_ID = 'tt-product-jsonld'

/**
 * Inject / update Product + Offer JSON-LD for the current product page.
 * Leaves Organization JSON-LD from the server shell intact.
 */
export function applyProductJsonLd(data) {
  if (!data || typeof document === 'undefined') return

  // Prefer a single product script (remove SSR duplicate if present)
  const ssr = document.getElementById('tt-product-jsonld-ssr')
  if (ssr) ssr.remove()

  let el = document.getElementById(PRODUCT_LD_ID)
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = PRODUCT_LD_ID
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export function clearProductJsonLd() {
  if (typeof document === 'undefined') return
  document.getElementById(PRODUCT_LD_ID)?.remove()
  document.getElementById('tt-product-jsonld-ssr')?.remove()
}
