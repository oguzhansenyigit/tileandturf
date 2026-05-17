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

export function getColorOptionVisual(option) {
  if (typeof option !== 'object' || !option) {
    return { swatch: null, roomScene: null }
  }
  return {
    swatch: option.image || null,
    roomScene: option.roomScene || null
  }
}

export function getOptionSizeLabels(option) {
  if (typeof option === 'object' && option !== null && Array.isArray(option.sizes)) {
    return option.sizes.filter((s) => typeof s === 'string' && s.trim() !== '')
  }
  return []
}

export function applySingleColorChoice(prev, key, colorVariationIds, primaryId) {
  const next = { ...prev }
  for (const cid of colorVariationIds) {
    delete next[cid]
  }
  next[primaryId] = key
  return next
}

/** Normalize options array from API */
export function normalizeVariationOptions(options) {
  if (!Array.isArray(options)) return []
  return options.map((opt) => getVariationOptionKey(opt)).filter(Boolean)
}

export function isVariationOptionEnabled(optionData) {
  return optionData != null && typeof optionData === 'object'
}

/** Options configured on the product (price optional — sqft/base price may apply). */
export function getConfiguredProductOptions(variation, variationOptions) {
  const map = variationOptions && typeof variationOptions === 'object' ? variationOptions : {}

  if (Array.isArray(variation?.options) && variation.options.length > 0) {
    return variation.options
      .map((option) => resolveVariationOptionEntry(map, option))
      .filter(({ key, data }) => key && isVariationOptionEnabled(data))
  }

  return Object.keys(map)
    .filter((key) => isVariationOptionEnabled(map[key]))
    .map((key) => ({
      key,
      label: map[key]?.value || key,
      data: map[key]
    }))
}

/** Group select options (e.g. Wood Planks Color) for &lt;optgroup&gt; labels. */
export function groupOptionsByDisplayGroup(options) {
  const ungrouped = []
  const groups = {}

  for (const opt of options) {
    const groupLabel = opt.data?.displayGroup
    if (groupLabel) {
      if (!groups[groupLabel]) groups[groupLabel] = []
      groups[groupLabel].push(opt)
    } else {
      ungrouped.push(opt)
    }
  }

  return { ungrouped, groups }
}

function getVariationOptionsMap(variationsData, variationId) {
  return variationsData?.[variationId] ?? variationsData?.[String(variationId)] ?? {}
}

/** Keys already offered under color-type variations (e.g. African Beige on Color + orphan row). */
export function getColorVariationOptionKeys(variationsData, colorVariations) {
  const keys = new Set()
  for (const variation of colorVariations || []) {
    const map = getVariationOptionsMap(variationsData, variation.id)
    for (const key of Object.keys(map)) {
      if (isVariationOptionEnabled(map[key])) keys.add(key)
    }
  }
  return keys
}

/** Hide legacy duplicate rows (only African Beige under "Options" while Color already lists it). */
export function isDuplicateOfColorVariation(variation, variationsData, colorVariations) {
  if (!variation || variation.type === 'color') return false
  const colorKeys = getColorVariationOptionKeys(variationsData, colorVariations)
  if (colorKeys.size === 0) return false

  const map = getVariationOptionsMap(variationsData, variation.id)
  const keys = Object.keys(map).filter((k) => isVariationOptionEnabled(map[k]))
  if (keys.length === 0) return true

  return keys.every((k) => colorKeys.has(k))
}

export function buildVariationsFromProductData(variationsData, fetchedVariations = []) {
  if (!variationsData || typeof variationsData !== 'object') return []

  const byId = new Map(
    (Array.isArray(fetchedVariations) ? fetchedVariations : [])
      .filter((v) => v && v.id != null && !v.error)
      .map((v) => [String(v.id), v])
  )

  const built = Object.keys(variationsData)
    .filter((id) => id !== 'product_variations')
    .map((id) => {
      const variationOptions = variationsData[id] || {}
      if (!Object.keys(variationOptions).some((k) => isVariationOptionEnabled(variationOptions[k]))) {
        return null
      }

      const existing = byId.get(String(id))
      if (existing) return existing

      return {
        id: parseInt(id, 10),
        name: 'Options',
        type: 'select',
        options: Object.keys(variationOptions)
      }
    })
    .filter(Boolean)

  const colorVariations = built.filter((v) => v.type === 'color')

  return built.filter((v) => {
    if (v.type === 'color') return true
    return !isDuplicateOfColorVariation(v, variationsData, colorVariations)
  })
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
