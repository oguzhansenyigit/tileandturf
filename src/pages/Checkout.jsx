import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useSettings } from '../context/SettingsContext'
import ShippingCalculator from '../components/ShippingCalculator'

const Checkout = () => {
  const navigate = useNavigate()
  const { cart, getCartTotal, clearCart } = useCart()
  const { phoneNumber } = useSettings()
  const orderPlacedRef = useRef(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    paymentMethod: 'credit_card'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [shippingCost, setShippingCost] = useState(null)

  useEffect(() => {
    // Only redirect if cart is empty AND we haven't just placed an order
    if (cart.length === 0 && !orderPlacedRef.current && !loading && window.location.pathname === '/checkout') {
      navigate('/cart', { replace: true })
    }
  }, [cart, navigate, loading])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required'
    else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) newErrors.zipCode = 'Invalid ZIP code'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const orderData = {
        ...formData,
        items: cart,
        total: getCartTotal(),
        status: 'pending'
      }

      const response = await axios.post('/api/orders.php', orderData)
      
      if (response.data.success) {
        const orderId = response.data.orderId
        const orderNumber = response.data.orderNumber
        
        // Set ref to prevent redirect to /cart BEFORE navigation
        orderPlacedRef.current = true
        
        // Store order info in sessionStorage so OrderConfirmation can clear cart
        sessionStorage.setItem('orderPlaced', 'true')
        sessionStorage.setItem('orderId', orderId.toString())
        sessionStorage.setItem('orderNumber', orderNumber || `ORD-${orderId}`)
        
        // Navigate immediately - don't wait for anything
        // Use window.location for immediate navigation to prevent any interference
        window.location.href = `/order-confirmation/${orderId}`
      } else {
        alert('Error placing order: ' + (response.data.error || 'Please try again.'))
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Error placing order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">Checkout</h1>
      
      {/* Call for Shipping Notice */}
      <div className="bg-primary text-white p-4 mb-8 rounded-lg text-center max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-2">Call for Shipping</h2>
        <p className="text-white/95">
          Price reflected on order will not include shipping cost. For shipping rates call us <a href={`tel:+${phoneNumber}`} className="font-semibold underline hover:text-white">(516) 774-1808</a>
        </p>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <p className="text-yellow-800">
          <strong>Note:</strong> We currently serve customers in the United States only.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Shipping Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  State *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    errors.zipCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.zipCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Method</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-gray-700 text-base leading-relaxed">
                After submitting the order form, our customer representative will contact you to complete the order and arrange shipping.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {cart.map((item) => {
                let unitPrice = parseFloat(item.price) || 0
                let totalPrice = 0
                
                // For sqft products, calculate total: sqft × sqft_price (no quantity multiplication)
                if (item.sqft && item.sqft_price) {
                  totalPrice = parseFloat(item.sqft) * parseFloat(item.sqft_price)
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
                        unitPrice = parseFloat(lengthPrices[item.length.toString()])
                      } else if (item.length_base_price && item.length_increment_price) {
                        // Fallback to length formula if length not in length_prices
                        unitPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                      }
                    } catch (e) {
                      console.error('Error parsing length_prices in checkout:', e)
                      // Fallback to length formula
                      if (item.length_base_price && item.length_increment_price) {
                        unitPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                      }
                    }
                  } else if (item.length_base_price && item.length_increment_price) {
                    // Use length formula: base_price + ((length - 1) * increment_price)
                    unitPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                  }
                  totalPrice = unitPrice * (parseInt(item.quantity) || 1)
                } else {
                  // For regular products
                  totalPrice = unitPrice * (parseInt(item.quantity) || 1)
                }
                
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name}
                      {!item.sqft && ` x${item.quantity}`}
                      {item.length && ` (length: ${item.length})`}
                      {item.sqft && ` (${item.sqft} sqft)`}
                    </span>
                    <span className="font-semibold">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                )
              })}
              
              {/* Shipping Calculator */}
              <ShippingCalculator 
                cart={cart} 
                state={formData.state}
                onShippingCalculated={setShippingCost}
                showContactButtons={true}
              />
              
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3 rounded">
                  <p className="text-red-800 font-bold text-sm mb-1">
                    TBD (To Be Determined)
                  </p>
                  <p className="text-red-700 text-xs">
                    Your payment can be verified and accepted after our customer representative's approval.
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">${getCartTotal().toFixed(2)}</span>
                </div>
                {shippingCost !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Shipping:</span>
                    <span className="font-semibold">${shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-primary">
                    ${(getCartTotal() + (shippingCost || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Checkout

