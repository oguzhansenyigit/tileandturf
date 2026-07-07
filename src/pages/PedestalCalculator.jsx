import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const MAX_PEDESTAL_SPACING_IN = 24
const PEDESTAL_WASTE_FACTOR = 1.35

/** Pedestal grid cell size (inches) — max 24" between pedestals; long tiles use short side when long > 24". */
const getPedestalApplicationDimensions = (widthIn, heightIn) => {
  const w = Number(widthIn)
  const h = Number(heightIn)
  if (!w || !h || w <= 0 || h <= 0) return null

  const short = Math.min(w, h)
  const long = Math.max(w, h)

  if (long > MAX_PEDESTAL_SPACING_IN) {
    const spacing = Math.min(short, MAX_PEDESTAL_SPACING_IN)
    return { width: spacing, height: spacing }
  }

  return { width: w, height: h }
}

const getPedestalApplicationAreaSqft = (widthIn, heightIn) => {
  const dims = getPedestalApplicationDimensions(widthIn, heightIn)
  if (!dims) return 0
  return (dims.width * dims.height) / 144
}

const calculatePedestalCount = (totalAreaSqft, widthIn, heightIn) => {
  const area = Number(totalAreaSqft)
  const applicationArea = getPedestalApplicationAreaSqft(widthIn, heightIn)
  if (!area || area <= 0 || !applicationArea || applicationArea <= 0) return null
  return Math.ceil((area / applicationArea) * PEDESTAL_WASTE_FACTOR)
}

const PedestalCalculator = () => {
  const [totalArea, setTotalArea] = useState('')
  const [tileSize, setTileSize] = useState('24x24')
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const [useCustomSize, setUseCustomSize] = useState(false)

  // Common tile sizes in inches (width x height)
  const commonTileSizes = [
    { label: '24" × 24"', value: '24x24', width: 24, height: 24, sqft: 4 },
    { label: '18" × 18"', value: '18x18', width: 18, height: 18, sqft: 2.25 },
    { label: '12" × 12"', value: '12x12', width: 12, height: 12, sqft: 1 },
    { label: '12" × 24"', value: '12x24', width: 12, height: 24, sqft: 2 },
    { label: '24" × 48"', value: '24x48', width: 24, height: 48, sqft: 8 },
    { label: '18" × 36"', value: '18x36', width: 18, height: 36, sqft: 4.5 },
    { label: 'Custom Size', value: 'custom' }
  ]

  const getTileDimensions = () => {
    if (useCustomSize) {
      const width = parseFloat(customWidth) || 0
      const height = parseFloat(customHeight) || 0
      if (width > 0 && height > 0) {
        return { width, height }
      }
      return null
    } else {
      const selected = commonTileSizes.find(size => size.value === tileSize)
      if (selected && selected.width && selected.height) {
        return { width: selected.width, height: selected.height }
      }
      return null
    }
  }

  const calculateTileArea = () => {
    const dimensions = getTileDimensions()
    if (!dimensions) return 0
    return (dimensions.width * dimensions.height) / 144
  }

  const calculateResults = () => {
    const area = parseFloat(totalArea) || 0
    const tileArea = calculateTileArea()
    const dimensions = getTileDimensions()

    if (area <= 0 || tileArea <= 0 || !dimensions) {
      return null
    }

    const applicationDims = getPedestalApplicationDimensions(dimensions.width, dimensions.height)
    const applicationArea = getPedestalApplicationAreaSqft(dimensions.width, dimensions.height)
    const pedestalCount = calculatePedestalCount(area, dimensions.width, dimensions.height)
    const exactTileCount = area / tileArea
    const tileCount = Math.ceil(exactTileCount)
    const rawRatio = (area / applicationArea) * PEDESTAL_WASTE_FACTOR

    return {
      totalArea: area,
      tileArea,
      applicationDims,
      applicationArea,
      tileCount,
      exactTileCount,
      pedestalCount,
      rawRatio,
    }
  }

  const results = calculateResults()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 md:px-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pedestal Calculator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Calculate the number of adjustable pedestals needed for your project based on total area and tile size.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Total Area (sqft) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={totalArea}
                onChange={(e) => setTotalArea(e.target.value)}
                placeholder="e.g., 1000"
                min="0"
                step="0.01"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the total square footage of your project area
              </p>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Tile Size <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {commonTileSizes.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => {
                      if (size.value === 'custom') {
                        setUseCustomSize(true)
                        setTileSize('custom')
                      } else {
                        setUseCustomSize(false)
                        setTileSize(size.value)
                      }
                    }}
                    className={`px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                      (useCustomSize && size.value === 'custom') || (!useCustomSize && tileSize === size.value)
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>

              {useCustomSize && (
                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Width (inches)
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      placeholder="e.g., 24"
                      min="0"
                      step="0.1"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Height (inches)
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="e.g., 24"
                      min="0"
                      step="0.1"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {results && (
              <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Calculation Results</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Total Area:</span>
                    <span className="text-gray-900 font-bold">{results.totalArea.toFixed(2)} sqft</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Tile Area:</span>
                    <span className="text-gray-900 font-bold">{results.tileArea.toFixed(2)} sqft</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Pedestal Application Area (B):</span>
                    <span className="text-gray-900 font-bold">
                      {results.applicationDims.width}" × {results.applicationDims.height}" ({results.applicationArea.toFixed(2)} sqft)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Estimated Tiles:</span>
                    <span className="text-gray-900 font-bold">{results.tileCount} tiles</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium text-sm">Calculation:</span>
                    <span className="text-gray-600 font-medium text-sm text-right">
                      ({results.totalArea.toFixed(2)} ÷ {results.applicationArea.toFixed(2)}) × {PEDESTAL_WASTE_FACTOR} = {results.rawRatio.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-4">
                    <span className="text-gray-900 font-bold text-lg">Pedestals Needed:</span>
                    <span className="text-primary font-bold text-2xl">{results.pedestalCount} pedestals</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 space-y-2">
              <p>
                <strong>Formula:</strong> Pedestal count = (Total area A ÷ Application area B) × {PEDESTAL_WASTE_FACTOR}
              </p>
              <p>
                <strong>Application area (B):</strong> Maximum {MAX_PEDESTAL_SPACING_IN}" spacing between pedestals.
                24×24 tile → 24×24; 24×48 → 24×24; 18×36 → 18×18 (centered on long edge); 12×12 → 12×12.
              </p>
            </div>

            <div className="mt-6 p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <img 
                    src="/adjustable-pedestal-mainpage.webp" 
                    alt="Adjustable Pedestals" 
                    className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.target.src = '/slider.webp'
                    }}
                  />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    Shop Adjustable Pedestals
                  </h3>
                  <p className="text-gray-700 mb-4 text-sm md:text-base">
                    Browse our complete selection of adjustable pedestal systems. Find the perfect pedestals for your project with various heights, materials, and specifications to meet your installation needs.
                  </p>
                  <Link
                    to="/products?category=adjustable-pedestal"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                  >
                    <span>View Adjustable Pedestals</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use This Calculator</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Enter the total square footage of your project (A)</li>
            <li>Select tile size — application area (B) is calculated from the max {MAX_PEDESTAL_SPACING_IN}" pedestal spacing rule</li>
            <li>Result: (A ÷ B) × {PEDESTAL_WASTE_FACTOR} = pedestals needed (rounded up)</li>
            <li>Use the result to plan material quantities for your installation</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default PedestalCalculator
