import React, { useState } from 'react'
import { Link } from 'react-router-dom'

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
    { label: 'Custom Size', value: 'custom' }
  ]

  // Get pedestal count for a tile based on its dimensions
  // Based on installation patterns:
  // - 24x24, 18x18, 12x12, 12x24: 4 pedestals (corners only)
  // - 24x48: 6 pedestals (4 corners + 2 middle on long sides)
  // - 18x36: 5 pedestals (4 corners + 1 middle on long side)
  const getPedestalCountForTile = (width, height) => {
    const minDim = Math.min(width, height)
    const maxDim = Math.max(width, height)
    
    // Tiles with max dimension <= 24: 4 pedestals (corners only)
    if (maxDim <= 24) {
      return 4
    }
    
    // For tiles with max dimension > 24, add middle pedestals
    // Calculate how many 24" segments fit in the longer dimension
    const segments = maxDim / 24
    // Number of additional pedestals needed (excluding corners)
    // Each segment beyond the first requires 1 pedestal per long side
    const additionalPedestals = Math.floor(segments - 1) * 2
    
    // Special case: if segments is between 1 and 2 (e.g., 18x36 = 1.5 segments)
    // Add 1 pedestal on one long side only
    if (segments > 1 && segments < 2) {
      return 4 + 1 // 4 corners + 1 middle
    }
    
    // For segments >= 2 (e.g., 24x48 = 2 segments)
    return 4 + additionalPedestals
  }


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
    // Convert inches to sqft: (width × height) / 144
    return (dimensions.width * dimensions.height) / 144
  }

  const calculateResults = () => {
    const area = parseFloat(totalArea) || 0
    const tileArea = calculateTileArea()
    const dimensions = getTileDimensions()
    
    if (area <= 0 || tileArea <= 0 || !dimensions) {
      return null
    }

    // Calculate exact tile count (can be decimal)
    const exactTileCount = area / tileArea
    // Round up tile count for display
    const tileCount = Math.ceil(exactTileCount)
    
    // Get pedestal count per tile based on dimensions
    const pedestalsPerTile = getPedestalCountForTile(dimensions.width, dimensions.height)
    
    // Calculate total pedestal count: exact tile count × pedestals per tile
    const pedestalCount = Math.ceil(exactTileCount * pedestalsPerTile)

    return {
      totalArea: area,
      pedestalPatternArea: tileArea, // Changed from tileArea to pedestalPatternArea
      tileCount: tileCount,
      exactTileCount: exactTileCount,
      pedestalCount: pedestalCount,
      pedestalsPerTile: pedestalsPerTile
    }
  }

  const results = calculateResults()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 md:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pedestal Calculator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Calculate the number of adjustable pedestals needed for your project based on total area and tile size.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="space-y-6">
            {/* Total Area Input */}
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

            {/* Tile Size Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Tile Size <span className="text-red-500">*</span>
              </label>
              
              {/* Common Sizes */}
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

              {/* Custom Size Inputs */}
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

            {/* Results */}
            {results && (
              <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Calculation Results</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Total Area:</span>
                    <span className="text-gray-900 font-bold">{results.totalArea.toFixed(2)} sqft</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Pedestal Pattern Area:</span>
                    <span className="text-gray-900 font-bold">{results.pedestalPatternArea.toFixed(2)} sqft</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Number of Tiles:</span>
                    <span className="text-gray-900 font-bold">{results.tileCount} tiles</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Pedestals per Tile:</span>
                    <span className="text-gray-900 font-bold">{results.pedestalsPerTile} pedestals</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium text-sm">Calculation:</span>
                    <span className="text-gray-600 font-medium text-sm">
                      {results.exactTileCount.toFixed(2)} tiles × {results.pedestalsPerTile} pedestals = {(results.exactTileCount * results.pedestalsPerTile).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-4">
                    <span className="text-gray-900 font-bold text-lg">Pedestals Needed:</span>
                    <span className="text-primary font-bold text-2xl">{results.pedestalCount} pedestals</span>
                  </div>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Calculation Formula:</strong> Pedestal Count = (Total Area ÷ Pedestal Pattern Area) × Pedestals per Tile
                <br />
                The number of pedestals per tile depends on the tile dimensions. Smaller tiles (≤24") use 4 pedestals at corners, while larger tiles require additional pedestals in the middle of longer sides.
              </p>
            </div>

            {/* Adjustable Pedestals Category Promotion */}
            <div className="mt-6 p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Product Image */}
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
                
                {/* Content */}
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

        {/* Additional Info */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use This Calculator</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Enter the total square footage of your project area</li>
            <li>Select your tile size from the common sizes or enter custom dimensions</li>
            <li>The calculator will automatically determine the number of pedestals needed</li>
            <li>Click "Add to Cart" to add the calculated quantity to your shopping cart</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default PedestalCalculator
