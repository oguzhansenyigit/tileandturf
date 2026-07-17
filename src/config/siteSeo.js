/** Canonical / absolute base. Override with VITE_SITE_URL if needed. */
export const SITE_ORIGIN =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) ||
  'https://tileandturf.com'

export const SITE_NAME = 'Tile and Turf'

export const SITE_AUTHOR = 'Tile and Turf'

export const SITE_PUBLISHER = 'Tile and Turf'

export const DEFAULT_ROBOTS = 'index, follow'

export const HOME_TITLE = 'Tile and Turf - Building Materials'

export const HOME_DESCRIPTION =
  'Tile and Turf (tileandturf.com) — New York outdoor building materials supplier in Maspeth, NY. Porcelain pavers, IPE wood tile, synthetic turf, green roofs, concrete pavers, and pedestal systems for USA projects.'

export const HOME_KEYWORDS =
  'Tile and Turf, tileandturf.com, Maspeth NY, New York building materials, porcelain pavers, IPE tile, synthetic turf, green roof, paver pedestals, concrete pavers, outdoor flooring, USA'

export const GENERIC_DESCRIPTION =
  'Shop premium outdoor and roofing building materials at Tile and Turf — porcelain pavers, wood tile, turf, green roofs, and pedestal systems with technical support and fast shipping.'

export const GENERIC_KEYWORDS = HOME_KEYWORDS

export const PRODUCTS_TITLE = `Our Products | ${SITE_NAME}`

export const PRODUCTS_DESCRIPTION =
  'Browse our full range of porcelain pavers, IPE tile systems, synthetic turf, green roof systems, concrete pavers, and adjustable pedestal products.'
