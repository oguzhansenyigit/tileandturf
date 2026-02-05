import React, { useState, useEffect } from 'react'
import axios from 'axios'

const OrdersManagement = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/orders.php')
      setOrders(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`/api/admin/order-details.php?id=${orderId}`)
      setSelectedOrder(response.data)
    } catch (error) {
      console.error('Error fetching order details:', error)
      const order = orders.find(o => o.id === orderId)
      setSelectedOrder(order)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.post('/api/admin/update-order.php', {
        orderId,
        status: newStatus
      })
      alert('Order status updated successfully!')
      fetchOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error updating order status')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Orders Management</h2>
        <button
          onClick={fetchOrders}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold">
                      {order.order_number || `ORD-${order.id}`}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {order.customerName || `${order.first_name} ${order.last_name}`}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">${(parseFloat(order.total) || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? 'Pending' :
                         order.status === 'processing' ? 'Processing' :
                         order.status === 'shipped' ? 'Shipped' :
                         order.status === 'completed' ? 'Completed' :
                         order.status === 'cancelled' ? 'Cancelled' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(order.created_at || order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => fetchOrderDetails(order.id)}
                        className="text-primary hover:text-primary-dark font-semibold"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No orders found.
              </div>
            )}
          </div>
        </div>

        {selectedOrder && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Order Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Customer Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {selectedOrder.customerName || `${selectedOrder.first_name} ${selectedOrder.last_name}`}</p>
                    <p><strong>Email:</strong> {selectedOrder.email}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Shipping Address</h4>
                  <div className="text-sm text-gray-600">
                    <p>{selectedOrder.address}</p>
                    <p>{selectedOrder.city}, {selectedOrder.state} {selectedOrder.zip_code}</p>
                    <p>{selectedOrder.country || 'United States'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm border-b pb-2">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-gray-500">Qty: {item.quantity} × ${(parseFloat(item.price) || 0).toFixed(2)}</p>
                        </div>
                        <span className="font-semibold">${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${(parseFloat(selectedOrder.total) || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Update Order Status</h4>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 font-semibold"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Status changes will be visible to customers in the Track Order page.
                  </p>
                </div>

                <div className="text-xs text-gray-500">
                  <p>Order Date: {new Date(selectedOrder.created_at || selectedOrder.orderDate).toLocaleString()}</p>
                  {selectedOrder.payment_method && (
                    <p>Payment: {selectedOrder.payment_method}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersManagement

