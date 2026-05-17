/** Stable string key for variation option (DB may store string or { label, image, sizes, roomScene }). */
export function getVariationOptionKey(option) {
  if (option == null) return ''
  if (typeof option === 'string') return option
  if (typeof option === 'object') {
    if (option.label != null && String(option.label).trim() !== '') {
      return String(option.label)
    }
    if (option.name != null && String(option.name).trim() !== '') {
      return String(option.name)
    }
    if (option.image != null && typeof option.image === 'string') {
      return option.image
    }
    try {
      return JSON.stringify(option)
    } catch {
      return String(option)
    }
  }
  return String(option)
}

/** Human-readable label for UI */
export function getVariationOptionLabel(option) {
  return getVariationOptionKey(option)
}

/** Normalize options array from API */
export function normalizeVariationOptions(options) {
  if (!Array.isArray(options)) return []
  return options.map((opt) => getVariationOptionKey(opt)).filter(Boolean)
}

/** Match product variation JSON keys to a catalog option (string or object). */
export function resolveVariationOptionEntry(variationOptions, option) {
  const key = getVariationOptionKey(option)
  const label = getVariationOptionLabel(option)
  const map = variationOptions && typeof variationOptions === 'object' ? variationOptions : {}
  let data = map[key]
  if (!data && typeof option === 'string' && map[option]) {
    data = map[option]
  }
  if (!data) {
    for (const mapKey of Object.keys(map)) {
      if (getVariationOptionKey(mapKey) === key) {
        data = map[mapKey]
        break
      }
    }
  }
  return { key, label, data: data || {} }
}
