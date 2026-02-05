import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [activeVisitors, setActiveVisitors] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
    fetchActiveVisitors()
    const interval = setInterval(() => {
      fetchActiveVisitors()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const fetchActiveVisitors = async () => {
    try {
      const response = await axios.get('/api/track-visitor.php')
      if (response.data.success) {
        setActiveVisitors(response.data.active_visitors || 0)
      }
    } catch (error) {
      console.error('Error fetching active visitors:', error)
    }
  }

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard.php')
      const data = response.data
      // Ensure topProducts and recentOrders are arrays
      if (data && typeof data === 'object') {
        if (data.topProducts && !Array.isArray(data.topProducts)) {
          data.topProducts = []
        }
        if (data.recentOrders && !Array.isArray(data.recentOrders)) {
          data.recentOrders = []
        }
        if (data.last7Days && !Array.isArray(data.last7Days)) {
          data.last7Days = []
        }
      }
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Active Visitors</h3>
          <p className="text-3xl font-bold text-orange-600">{activeVisitors}</p>
          <p className="text-xs text-gray-500 mt-1">Last 5 minutes</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Today's Views</h3>
          <p className="text-3xl font-bold text-primary">{stats.today?.page_views || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Today's Visitors</h3>
          <p className="text-3xl font-bold text-green-600">{stats.today?.unique_visitors || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totals?.orders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-purple-600">${(parseFloat(stats.totals?.revenue) || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Top Viewed Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.topProducts?.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-2 text-sm">{product.name}</td>
                  <td className="px-4 py-2 text-sm font-semibold">{product.total_views || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Order #</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Customer</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Total</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.recentOrders?.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-2 text-sm">{order.order_number || `ORD-${order.id}`}</td>
                  <td className="px-4 py-2 text-sm">{order.first_name} {order.last_name}</td>
                  <td className="px-4 py-2 text-sm font-semibold">${(parseFloat(order.total) || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

