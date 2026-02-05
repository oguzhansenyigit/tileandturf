import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductUrl } from '../utils/slug'
import axios from 'axios'

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!orderNumber.trim()) {
      setError('Please enter an order number')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const response = await axios.get(`/api/track-order.php?order_number=${encodeURIComponent(orderNumber.trim())}`)
      
      if (response.data.success) {
        setOrder(response.data.order)
      } else {
        setError(response.data.error || 'Order not found')
      }
    } catch (err) {
      console.error('Track order error:', err)
      setError(err.response?.data?.error || 'Order not found. Please check your order number.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const statusTexts = {
      'pending': 'Pending',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    }
    return statusTexts[status] || status
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Track Your Order</h1>
        <p className="text-gray-600 mb-8 text-center">
          Enter your order number to track the status of your order
        </p>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Order Number *
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., ORD-20241201-0001"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-300 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Track Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Order #{order.order_number}</h2>
                  <p className="text-gray-600 mt-1">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    {item.product_id && (
                      <Link to={`/product/${item.product_id}`} className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Image</span>
                        </div>
                      </Link>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">${parseFloat(item.subtotal).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">${parseFloat(item.product_price).toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 font-semibold">{order.first_name} {order.last_name}</p>
                  <p className="text-gray-600">{order.address}</p>
                  <p className="text-gray-600">{order.city}, {order.state} {order.zip_code}</p>
                  <p className="text-gray-600">{order.country}</p>
                  {order.phone && (
                    <p className="text-gray-600 mt-2">Phone: {order.phone}</p>
                  )}
                  <p className="text-gray-600">Email: {order.email}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${parseFloat(order.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Payment Method:</span>
                    <span className="font-semibold capitalize">{order.payment_method?.replace('_', ' ') || 'N/A'}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-800">
                      <span>Total:</span>
                      <span className="text-primary">${parseFloat(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Order Status Timeline</h3>
              <div className="space-y-4">
                {order.status === 'pending' && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-800">Order Received</p>
                      <p className="text-sm text-gray-600">Your order has been received and is waiting to be processed.</p>
                    </div>
                  </div>
                )}
                {order.status === 'processing' && (
                  <>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Order Received</p>
                        <p className="text-sm text-gray-600">Order received on {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Processing</p>
                        <p className="text-sm text-gray-600">Your order is being prepared for shipment.</p>
                      </div>
                    </div>
                  </>
                )}
                {order.status === 'shipped' && (
                  <>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Order Received</p>
                        <p className="text-sm text-gray-600">Order received on {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Processing</p>
                        <p className="text-sm text-gray-600">Order processed successfully.</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Shipped</p>
                        <p className="text-sm text-gray-600">Your order has been shipped and is on its way.</p>
                      </div>
                    </div>
                  </>
                )}
                {order.status === 'completed' && (
                  <>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Order Received</p>
                        <p className="text-sm text-gray-600">Order received on {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Processing</p>
                        <p className="text-sm text-gray-600">Order processed successfully.</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Shipped</p>
                        <p className="text-sm text-gray-600">Order shipped successfully.</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Delivered</p>
                        <p className="text-sm text-gray-600">Your order has been delivered successfully.</p>
                      </div>
                    </div>
                  </>
                )}
                {order.status === 'cancelled' && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-800">Order Cancelled</p>
                      <p className="text-sm text-gray-600">This order has been cancelled.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                to="/products"
                className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!order && (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">
              Can't find your order number? Check your email confirmation or contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/1234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Contact Support</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackOrder

