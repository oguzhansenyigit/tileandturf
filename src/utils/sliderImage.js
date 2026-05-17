/** Slider image column may be a URL string or JSON with { image, label, ... }. */
export function resolveSliderImage(image) {
  if (image == null || image === '') return ''
  if (typeof image === 'object') {
    return image.image || image.url || ''
  }
  const str = String(image).trim()
  if (str.startsWith('{') || str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str)
      if (parsed && typeof parsed === 'object') {
        return parsed.image || parsed.url || str
      }
    } catch {
      /* use raw string */
    }
  }
  return str
}
