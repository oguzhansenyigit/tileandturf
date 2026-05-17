import React from 'react'
import {
  applySingleColorChoice,
  getOptionSizeLabels,
  getVariationOptionKey,
  getVariationOptionLabel,
  isDuplicateOfColorVariation
} from '../utils/variationOption'

const ProductVariationSelector = ({
  product,
  variations,
  variationLibraryLoading,
  selectedVariations,
  setSelectedVariations,
  variationPrices,
  setVariationPrices,
  selectedSize,
  setSelectedSize,
  onColorVisualChange
}) => {
  if (!product || (variations.length === 0 && !variationLibraryLoading)) {
    return null
  }

  let productVariationsJson = {}
  try {
    productVariationsJson = product.variations
      ? typeof product.variations === 'string'
        ? JSON.parse(product.variations)
        : product.variations
      : {}
  } catch {
    productVariationsJson = {}
  }

  const colorVars = variations.filter((v) => v.type === 'color')
  const otherVars = variations.filter(
    (v) => v.type !== 'color' && !isDuplicateOfColorVariation(v, productVariationsJson, colorVars)
  )
  const colorVariationIds = colorVars.map((v) => v.id)
  const primaryColor = colorVars[0]
  const primaryColorId = primaryColor?.id

  const renderNonColorVariation = (variation) => {
    const variationId = variation.id
    const selectedOption = selectedVariations[variationId]
    const variationOptions = productVariationsJson[variationId] || {}
    const selectedPrice = variationPrices[variationId] || 0
    const needsThisOption = !selectedOption

    const availableOptions = Array.isArray(variation.options)
      ? variation.options.filter((option) => variationOptions[getVariationOptionKey(option)] !== undefined)
      : Object.keys(variationOptions).filter((key) => variationOptions[key])

    return (
      <div
        key={variation.id}
        className={`rounded-lg border p-4 ${
          selectedOption ? 'border-primary bg-primary/5' : 'border-red-200 bg-red-50/50'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-semibold text-gray-800 text-sm">
            {variation.name}
            {needsThisOption && <span className="text-red-500 ml-0.5">*</span>}
          </span>
          {selectedOption ? (
            selectedPrice > 0 ? (
              <span className="text-xs font-semibold text-primary">+${selectedPrice.toFixed(2)}</span>
            ) : (
              <span className="text-xs text-gray-500">Base</span>
            )
          ) : (
            <span className="text-xs text-red-500">Required</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableOptions.map((option, idx) => {
            const key =
              typeof option === 'string' ? option : getVariationOptionKey(option)
            const optionData = variationOptions[key] || {}
            const optionPrice = optionData.price || 0
            const isSelected = selectedOption === key
            const label = optionData.value || getVariationOptionLabel(option)
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedVariations((prev) => {
                    const cur = prev[variationId]
                    const turningOff = String(cur) === String(key)
                    setVariationPrices((prevP) => {
                      const n = { ...prevP }
                      if (turningOff) delete n[variationId]
                      else if (optionPrice) n[variationId] = optionPrice
                      else delete n[variationId]
                      return n
                    })
                    if (turningOff) {
                      const n = { ...prev }
                      delete n[variationId]
                      return n
                    }
                    return { ...prev, [variationId]: key }
                  })
                }}
                className={`min-w-[5.5rem] px-3 py-2 rounded-md border text-xs font-medium text-center transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-gray-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {label}
                {optionPrice > 0 && (
                  <span className="block text-[10px] mt-0.5 opacity-90">
                    +${parseFloat(optionPrice).toFixed(2)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {needsThisOption && <p className="text-xs text-red-600 mt-2">Please select</p>}
      </div>
    )
  }

  const primaryOpts = primaryColor ? productVariationsJson[primaryColorId] || {} : {}
  const colorAvailableOptions =
    primaryColor && Array.isArray(primaryColor.options)
      ? primaryColor.options.filter((option) => primaryOpts[getVariationOptionKey(option)] !== undefined)
      : []

  const mainColorOptions = []
  const extraSectionOrder = []
  const extraSectionMap = new Map()
  for (const option of colorAvailableOptions) {
    const k = getVariationOptionKey(option)
    const dg = String(primaryOpts[k]?.displayGroup || '').trim()
    if (dg) {
      if (!extraSectionMap.has(dg)) {
        extraSectionMap.set(dg, [])
        extraSectionOrder.push(dg)
      }
      extraSectionMap.get(dg).push(option)
    } else {
      mainColorOptions.push(option)
    }
  }
  const extraColorSections = extraSectionOrder.map((title) => ({
    title,
    options: extraSectionMap.get(title) || []
  }))

  const selectedColorOption = primaryColorId != null ? selectedVariations[primaryColorId] : null
  const selectedColorPrice = primaryColorId != null ? variationPrices[primaryColorId] || 0 : 0
  const needsColor = primaryColor && !selectedColorOption

  const renderColorSwatch = (option, listKey) => {
    const key = getVariationOptionKey(option)
    const optionData = primaryOpts[key] || {}
    const optionPrice = optionData.price || 0
    const isSelected = selectedColorOption === key
    const label = optionData.value || getVariationOptionLabel(option)
    const optionImage = typeof option === 'object' && option?.image
    const sizeLabels = getOptionSizeLabels(option)

    return (
      <button
        key={`${listKey}-${key}`}
        type="button"
        aria-pressed={isSelected}
        onClick={() => {
          setSelectedSize('')
          const cur = selectedVariations[primaryColorId]
          const turningOff = String(cur) === String(key)

          if (turningOff) {
            onColorVisualChange?.(null)
            setSelectedVariations((prev) => {
              const n = { ...prev }
              colorVariationIds.forEach((id) => delete n[id])
              return n
            })
            setVariationPrices((prevP) => {
              const n = { ...prevP }
              colorVariationIds.forEach((id) => delete n[id])
              return n
            })
          } else {
            onColorVisualChange?.(key)
            setSelectedVariations((prev) =>
              applySingleColorChoice(prev, key, colorVariationIds, primaryColorId)
            )
            setVariationPrices((prevP) => {
              const n = { ...prevP }
              colorVariationIds.forEach((id) => delete n[id])
              if (optionPrice) n[primaryColorId] = optionPrice
              return n
            })
          }
        }}
        className={`flex flex-col w-[calc(50%-0.375rem)] sm:w-36 shrink-0 text-left rounded-md border overflow-hidden transition-colors ${
          isSelected
            ? 'border-primary ring-1 ring-primary bg-primary/5'
            : 'border-gray-200 bg-white hover:border-gray-400'
        }`}
      >
        {optionImage ? (
          <div className="w-full h-24 sm:h-28 bg-gray-100 border-b border-gray-200">
            <img
              src={optionImage}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div className="w-full h-16 sm:h-20 bg-gray-50 border-b border-gray-200 flex items-center justify-center text-xs text-gray-500 px-1 text-center">
            {label}
          </div>
        )}
        <div className="p-2">
          {optionImage && (
            <span className="text-xs font-medium text-gray-900 leading-tight block">{label}</span>
          )}
          {sizeLabels.length > 0 && (
            <span className="text-[10px] text-gray-500 mt-1 block leading-snug">
              {sizeLabels.join(' · ')}
            </span>
          )}
          {optionPrice > 0 && (
            <span className="text-[10px] text-gray-600 mt-0.5 block">
              +${parseFloat(optionPrice).toFixed(2)}
            </span>
          )}
        </div>
      </button>
    )
  }

  const selOpt = primaryColor?.options?.find(
    (o) => String(getVariationOptionKey(o)) === String(selectedColorOption)
  )
  const sizeOptions = getOptionSizeLabels(selOpt || {})
  const needsSize = sizeOptions.length >= 2 && !selectedSize

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800">Options</h3>
          {variationLibraryLoading && <span className="text-xs text-gray-500">Loading…</span>}
        </div>
        {Object.keys(selectedVariations).length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelectedVariations({})
              setVariationPrices({})
              setSelectedSize('')
            }}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear
          </button>
        )}
      </div>

      {primaryColor && (
        <div
          className={`rounded-lg border p-4 ${
            selectedColorOption ? 'border-primary bg-white' : 'border-red-200 bg-red-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-800 text-sm">
              {primaryColor.name}
              {needsColor && <span className="text-red-500 ml-0.5">*</span>}
            </span>
            {selectedColorOption ? (
              selectedColorPrice > 0 ? (
                <span className="text-xs font-semibold text-primary">+${selectedColorPrice.toFixed(2)}</span>
              ) : (
                <span className="text-xs text-gray-500">Base</span>
              )
            ) : (
              <span className="text-xs text-red-500">Required</span>
            )}
          </div>

          {mainColorOptions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {mainColorOptions.map((option) => renderColorSwatch(option, 'main'))}
            </div>
          )}
          {extraColorSections.map(({ title, options: secOpts }, si) => (
            <div
              key={`extra-${title}-${si}`}
              className={`${si > 0 || mainColorOptions.length > 0 ? 'mt-5 pt-4 border-t border-gray-200' : ''}`}
            >
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>
              <div className="flex flex-wrap gap-3">
                {secOpts.map((o) => renderColorSwatch(o, `g${si}`))}
              </div>
            </div>
          ))}

          {selectedColorOption && sizeOptions.length >= 2 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Size</p>
              <div className="flex flex-wrap gap-3">
                {sizeOptions.map((sz) => (
                  <label
                    key={sz}
                    className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-800"
                  >
                    <input
                      type="radio"
                      name="color-size"
                      checked={selectedSize === sz}
                      onChange={() => setSelectedSize(sz)}
                      className="text-primary border-gray-300 focus:ring-primary"
                    />
                    {sz}
                  </label>
                ))}
              </div>
              {needsSize && <p className="text-xs text-red-600 mt-1.5">Please select a size</p>}
            </div>
          )}
          {needsColor && <p className="text-xs text-red-600 mt-2">Please select a color</p>}
        </div>
      )}

      {otherVars.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {otherVars.map((v) => renderNonColorVariation(v))}
        </div>
      )}
    </div>
  )
}

export default ProductVariationSelector
