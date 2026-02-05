import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const MyAccount = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile') // 'profile' or 'orders'

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (!userData) {
      navigate('/login')
      return
    }

    const userObj = JSON.parse(userData)
    setUser(userObj)

    // Fetch orders
    fetchOrders(userObj.email)
  }, [navigate])

  const fetchOrders = async (email) => {
    try {
      const response = await axios.get(`/api/my-orders.php?email=${encodeURIComponent(email)}`)
      if (response.data.success) {
        setOrders(response.data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    // Trigger custom event so Header can update
    window.dispatchEvent(new Event('userChanged'))
    navigate('/login')
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your profile and view order history</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-4 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'orders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Order History ({orders.length})
              </button>
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">First Name</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                        {user.first_name || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Last Name</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                        {user.last_name || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Email</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                        {user.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Phone</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                        {user.phone || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="p-6">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't placed any orders yet.</p>
                  <div className="mt-6">
                    <Link
                      to="/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                    >
                      Start Shopping
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Order Header */}
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center space-x-4">
                              <h3 className="text-lg font-bold text-gray-800">
                                Order #{order.order_number || `ORD-${order.id}`}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Placed on {new Date(order.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="mt-2 md:mt-0 text-right">
                            <p className="text-2xl font-bold text-primary">
                              ${(parseFloat(order.total) || 0).toFixed(2)}
                            </p>
                            <Link
                              to={`/order-confirmation/${order.id}`}
                              className="text-sm text-primary hover:underline mt-1 inline-block"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="p-6">
                        <div className="space-y-4">
                          {order.items && order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                              {item.image ? (
                                <Link to={item.product_id ? `/product/${item.product_id}` : '#'} className="flex-shrink-0">
                                  <img
                                    src={item.image}
                                    alt={item.product_name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                  />
                                </Link>
                              ) : (
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-gray-400 text-xs">No Image</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <Link
                                  to={item.product_id ? `/product/${item.product_id}` : '#'}
                                  className="font-semibold text-gray-800 hover:text-primary transition-colors"
                                >
                                  {item.product_name}
                                </Link>
                                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                                  <span>Quantity: {item.quantity}</span>
                                  <span>Price: ${parseFloat(item.product_price || 0).toFixed(2)}</span>
                                  {item.sqft && (
                                    <span className="text-primary">({item.sqft} sqft)</span>
                                  )}
                                  {item.length && (
                                    <span className="text-primary">(Length: {item.length})</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary text-lg">
                                  ${parseFloat(item.subtotal || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyAccount
