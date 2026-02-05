import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useSettings } from '../context/SettingsContext'

const ShippingCalculator = ({ cart, state, onShippingCalculated, showContactButtons = true }) => {
  const { whatsappNumber, phoneNumber } = useSettings()
  const [shippingCost, setShippingCost] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (state && cart && cart.length > 0) {
      calculateShipping()
    } else {
      setShippingCost(null)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, cart?.length])

  const calculateShipping = async () => {
    if (!state || !cart || cart.length === 0) {
      setShippingCost(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // AI-Enhanced calculation: Estimate sqft based on product type, category, and quantity
      const totalSqft = cart.reduce((total, item) => {
        // Smart estimation based on category first (more accurate), then product name
        let sqftPerItem = 10 // Default
        
        const productName = (item.name || '').toLowerCase()
        const categoryName = ((item.category_name || item.category || '')).toLowerCase()
        
        // Category-based estimation (more accurate)
        if (categoryName.includes('paver') || categoryName.includes('tile') || categoryName.includes('porcelain')) {
          sqftPerItem = 12 // Pavers/tiles: typically 12 sqft per package
        } else if (categoryName.includes('pedestal')) {
          sqftPerItem = 8 // Pedestal systems: more compact, ~8 sqft
        } else if (categoryName.includes('wood') || categoryName.includes('ipe') || categoryName.includes('lumber')) {
          sqftPerItem = 15 // Wood products: ~15 sqft per package
        } else if (categoryName.includes('turf') || categoryName.includes('grass') || categoryName.includes('synthetic')) {
          sqftPerItem = 20 // Synthetic turf: covers large areas, ~20 sqft
        } else if (categoryName.includes('roof') || categoryName.includes('green')) {
          sqftPerItem = 12 // Roof systems: ~12 sqft
        } else {
          // Product name-based estimation (fallback)
          if (productName.includes('paver') || productName.includes('tile') || productName.includes('porcelain')) {
            sqftPerItem = 12
          } else if (productName.includes('pedestal') || productName.includes('system')) {
            sqftPerItem = 8
          } else if (productName.includes('wood') || productName.includes('lumber') || productName.includes('ipe')) {
            sqftPerItem = 15
          } else if (productName.includes('turf') || productName.includes('grass') || productName.includes('synthetic')) {
            sqftPerItem = 20
          } else if (productName.includes('roof') || productName.includes('green')) {
            sqftPerItem = 12
          }
        }
        
        const quantity = parseInt(item.quantity) || 1
        return total + (sqftPerItem * quantity)
      }, 0)

      const response = await axios.post('/api/calculate-shipping.php', {
        state: state,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          weight_lbs: item.weight_lbs || null,
          category_name: item.category_name || item.category || null
        })),
        total_sqft: totalSqft
      })

      if (response.data && response.data.success !== false) {
        // Handle both 'shipping_cost' and 'shippingCost' from API response
        const cost = parseFloat(response.data.shipping_cost || response.data.shippingCost || 0) || 0
        if (cost > 0) {
          setShippingCost(cost)
          if (onShippingCalculated) {
            onShippingCalculated(cost)
          }
        } else {
          setShippingCost(null)
          setError('Unable to calculate shipping cost. Please contact us for a quote.')
        }
      } else {
        const errorMsg = response.data?.error || 'Failed to calculate shipping'
        setError(errorMsg)
        setShippingCost(null)
        if (onShippingCalculated) {
          onShippingCalculated(null)
        }
        console.error('Shipping calculation error:', response.data)
      }
    } catch (err) {
      console.error('Error calculating shipping:', err)
      // More detailed error message
      if (err.response) {
        setError(err.response.data?.error || 'Server error calculating shipping')
      } else if (err.request) {
        setError('Unable to connect to server. Please check your connection.')
      } else {
        setError('Unable to calculate shipping cost. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    const message = `Hello, I need a shipping quote for my order. State: ${state || 'Not selected'}`
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handlePhone = () => {
    window.location.href = `tel:+${phoneNumber}`
  }

  if (!state) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-4">
        <p className="text-sm text-blue-800">
          <strong>Select a state</strong> to see estimated shipping cost
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-700 font-semibold">Estimated Shipping:</span>
        {loading ? (
          <span className="text-gray-500 text-sm">Calculating...</span>
        ) : shippingCost !== null && shippingCost !== undefined ? (
          <span className="text-primary font-bold text-lg">${(parseFloat(shippingCost) || 0).toFixed(2)}</span>
        ) : (
          <span className="text-gray-500 text-sm">—</span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-2 rounded mt-2">
          <p className="text-red-700 text-xs">{error}</p>
          <button
            onClick={calculateShipping}
            className="text-red-600 hover:text-red-800 text-xs font-semibold mt-1 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {shippingCost !== null && (
        <>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-3 mt-3">
            <p className="text-xs text-yellow-800">
              <strong>⚠️ Estimated Shipping Cost:</strong> This is an AI-calculated estimate based on industry-standard freight rates, 
              product weight (if provided), square footage, and delivery state. Final shipping cost may vary based on actual package 
              dimensions, special handling requirements, and current carrier rates. <strong>For accurate shipping quotes and to ensure 
              the best rates, please contact us via WhatsApp or phone.</strong>
            </p>
          </div>

          {showContactButtons && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </button>
              <button
                onClick={handlePhone}
                className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ShippingCalculator

