import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProductUrl } from '../utils/slug'
import { useCart } from '../context/CartContext'
import axios from 'axios'
import ShippingCalculator from './ShippingCalculator'

const CartSidebar = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, addToCart } = useCart()
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [shippingState, setShippingState] = useState('')
  const [shippingCost, setShippingCost] = useState(null)
  const navigate = useNavigate()

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]

  useEffect(() => {
    if (isOpen) {
      fetchRecommendedProducts()
    }
  }, [isOpen, cart])

  // Auto-slide recommended products every 3 seconds
  useEffect(() => {
    if (!isOpen || recommendedProducts.length <= 3) {
      setCurrentSlide(0)
      return
    }

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => {
        const maxSlides = Math.ceil(recommendedProducts.length / 3) - 1
        return prev >= maxSlides ? 0 : prev + 1
      })
    }, 3000) // 3 seconds

    return () => clearInterval(slideInterval)
  }, [isOpen, recommendedProducts.length])

  const fetchRecommendedProducts = async () => {
    try {
      const response = await axios.get('/api/products.php?limit=8')
      // Exclude products already in cart
      const cartProductIds = cart.map(item => item.id)
      const filtered = response.data.filter(product => !cartProductIds.includes(product.id))
      setRecommendedProducts(filtered.slice(0, 6))
    } catch (error) {
      console.error('Error fetching recommended products:', error)
      // Mock recommended products for development
      const mockProducts = [
        { id: 3, name: 'Green Roof System Kit', price: 199.99, image: '/greenroof-mainpage.webp' },
        { id: 4, name: 'Synthetic Turf Premium', price: 79.99, image: '/slider3.webp' },
        { id: 5, name: 'Concrete Paver Set', price: 149.99, image: '/slider.webp' },
        { id: 6, name: 'Porcelain Paver Tiles', price: 119.99, image: '/slider.webp' },
        { id: 7, name: 'IPE Lumber Boards', price: 99.99, image: '/slider5.webp' },
        { id: 8, name: 'Adjustable Pedestal Base', price: 19.99, image: '/adjustable-pedestal-mainpage.webp' }
      ]
      const cartProductIds = cart.map(item => item.id)
      const filtered = mockProducts.filter(product => !cartProductIds.includes(product.id))
      setRecommendedProducts(filtered.slice(0, 6))
    }
  }

  const handleCheckout = () => {
    onClose()
    navigate('/checkout')
  }

  const handleAddRecommendedToCart = (product) => {
    addToCart(product)
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-1000 ease-in-out ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        style={{
          display: isOpen ? 'block' : 'none'
        }}
      />
      
      {/* Sidebar */}
      <div 
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 1000ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header - Compact */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary text-white flex-shrink-0">
          <h2 className="text-lg font-bold">Cart ({cart.length})</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Cart Items - Compact */}
          {!cart || cart.length === 0 ? (
            <div className="text-center py-12 px-4">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-600 mb-4">Your cart is empty</p>
              <Link
                to="/products"
                onClick={onClose}
                className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-100">
                  <Link to={getProductUrl(item)} onClick={onClose} className="flex-shrink-0">
                    <img
                      src={item.image || '/slider.webp'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={getProductUrl(item)} onClick={onClose}>
                      <h3 className="font-semibold text-sm text-gray-800 hover:text-primary transition-colors mb-1 line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-primary font-bold text-base mb-2">
                      {(() => {
                        let displayPrice = parseFloat(item.price) || 0
                        
                        // For sqft products, calculate total price (sqft × sqft_price, no quantity)
                        if (item.sqft && item.sqft_price) {
                          displayPrice = parseFloat(item.sqft) * parseFloat(item.sqft_price)
                        }
                        // For length products, calculate unit price
                        else if (item.length) {
                          // First, try to use length_prices JSON if available
                          if (item.length_prices) {
                            try {
                              const lengthPrices = typeof item.length_prices === 'string' 
                                ? JSON.parse(item.length_prices) 
                                : item.length_prices
                              
                              // Check if price exists for this length
                              if (lengthPrices && lengthPrices[item.length.toString()] !== undefined) {
                                displayPrice = parseFloat(lengthPrices[item.length.toString()])
                              } else if (item.length_base_price && item.length_increment_price) {
                                // Fallback to length formula if length not in length_prices
                                displayPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                              }
                            } catch (e) {
                              console.error('Error parsing length_prices in cart sidebar:', e)
                              // Fallback to length formula
                              if (item.length_base_price && item.length_increment_price) {
                                displayPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                              }
                            }
                          } else if (item.length_base_price && item.length_increment_price) {
                            // Use length formula: base_price + ((length - 1) * increment_price)
                            displayPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                          }
                        }
                        // For packaged products, show package price directly (item.price is already package price)
                        else if (item.is_packaged && item.pack_size) {
                          displayPrice = parseFloat(item.price) || 0
                        }
                        
                        // Multiply by quantity for display (except sqft products - they don't use quantity)
                        const totalPrice = (item.sqft && item.sqft_price) 
                          ? displayPrice // Sqft products: already calculated as sqft × sqft_price
                          : displayPrice * (parseInt(item.quantity) || 1) // Other products: multiply by quantity
                        
                        return (
                          <>
                            ${totalPrice.toFixed(2)}
                            {!item.sqft && item.quantity > 1 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({item.quantity} × ${displayPrice.toFixed(2)})
                              </span>
                            )}
                            {item.is_packaged && item.pack_size && (
                              <span className="text-xs text-gray-500 ml-1">
                                (per unit {item.pack_size})
                              </span>
                            )}
                            {item.sqft && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({item.sqft} sqft)
                              </span>
                            )}
                            {item.length && (
                              <span className="text-xs text-gray-500 ml-1">
                                (length: {item.length})
                              </span>
                            )}
                          </>
                        )
                      })()}
                    </p>
                    <div className="flex items-center justify-between">
                      {/* Don't show quantity controls for sqft products - sqft value itself is the quantity */}
                      {!item.sqft && (
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item)}
                            className="w-6 h-6 border border-gray-300 rounded text-xs flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">
                            {(() => {
                              // Debug: Log quantity and length to ensure they're not mixed up
                              if (item.length && parseInt(item.quantity) === parseInt(item.length)) {
                                console.warn('⚠️ Quantity matches length - possible bug:', {
                                  itemId: item.id,
                                  quantity: item.quantity,
                                  length: item.length
                                })
                              }
                              return item.quantity
                            })()}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item)}
                            className="w-6 h-6 border border-gray-300 rounded text-xs flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommended Products - Prominent */}
          {recommendedProducts.length > 0 && (
            <div className={`px-4 pb-4 ${cart.length > 0 ? 'border-t border-gray-200 bg-gray-50' : ''} pt-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Complete Your Project</h3>
                <span className="text-xs text-gray-500">Compatible Products</span>
              </div>
              <div className="relative overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${currentSlide * 100}%)`
                  }}
                >
                  {Array.from({ length: Math.ceil(recommendedProducts.length / 3) }).map((_, slideIndex) => {
                    const productsInSlide = recommendedProducts.slice(slideIndex * 3, slideIndex * 3 + 3)
                    return (
                      <div key={slideIndex} className="flex-shrink-0 w-full flex space-x-3">
                        {productsInSlide.map((product) => (
                          <div key={product.id} className="flex-shrink-0 w-[calc(33.333%-0.5rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
                            <Link to={getProductUrl(product)} onClick={onClose} className="block">
                              <div className="relative h-24 mb-1.5 overflow-hidden">
                                <img
                                  src={product.image || '/slider.webp'}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <div className="p-2">
                                <h4 className="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors mb-1 line-clamp-2 min-h-[2.5rem]">
                                  {product.name}
                                </h4>
                                <p className="text-primary font-bold text-xs mb-2">${(parseFloat(product.price) || 0).toFixed(2)}</p>
                              </div>
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                handleAddRecommendedToCart(product)
                              }}
                              className="w-full bg-primary hover:bg-primary-dark text-white text-xs font-semibold py-1.5 px-2 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                        {/* Fill empty spaces if less than 3 products in last slide */}
                        {productsInSlide.length < 3 && Array.from({ length: 3 - productsInSlide.length }).map((_, i) => (
                          <div key={`empty-${i}`} className="flex-shrink-0 w-[calc(33.333%-0.5rem)]" />
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
              {/* Slide Indicators */}
              {recommendedProducts.length > 3 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {Array.from({ length: Math.ceil(recommendedProducts.length / 3) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentSlide === index ? 'bg-primary w-6' : 'bg-gray-300 w-1.5'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Sticky */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
            {/* Shipping Calculator */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Estimate Shipping:
              </label>
              <select
                value={shippingState}
                onChange={(e) => setShippingState(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <ShippingCalculator 
                cart={cart} 
                state={shippingState}
                onShippingCalculated={setShippingCost}
                showContactButtons={true}
              />
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-gray-700">Subtotal:</span>
                <span className="text-xl font-bold text-primary">${getCartTotal().toFixed(2)}</span>
              </div>
              {shippingCost !== null && shippingCost !== undefined && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Estimated Shipping:</span>
                  <span className="text-gray-700 font-semibold">${(parseFloat(shippingCost) || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    ${(getCartTotal() + (parseFloat(shippingCost) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg font-semibold transition-colors mb-2"
            >
              Checkout
            </button>
            <Link
              to="/cart"
              onClick={onClose}
              className="block w-full text-center text-gray-600 hover:text-primary text-sm font-medium py-1 transition-colors"
            >
              View Full Cart →
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

export default CartSidebar
