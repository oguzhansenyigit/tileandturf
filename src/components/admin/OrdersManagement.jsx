import React, { useState, useEffect, useCallback } from 'react'
import adminHttp from '../../utils/adminHttp'
import { productImageSrc } from '../../utils/mediaUrl'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusBadge = (status) => {
  const map = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

const money = (v) => `$${(parseFloat(v) || 0).toFixed(2)}`

const OrdersManagement = () => {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [insights, setInsights] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const showMsg = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
    if (text) setTimeout(() => setMessage(''), 4000)
  }

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, insightsRes] = await Promise.all([
        adminHttp.get('/api/admin/orders.php?action=stats'),
        adminHttp.get('/api/admin/orders.php?action=insights'),
      ])
      if (statsRes.data?.success) setStats(statsRes.data.stats)
      if (insightsRes.data?.success) setInsights(insightsRes.data)
    } catch {
      /* ignore */
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      })
      if (search.trim()) params.set('search', search.trim())
      if (status) params.set('status', status)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      const res = await adminHttp.get(`/api/admin/orders.php?${params}`)
      if (res.data?.success) {
        setOrders(res.data.orders || [])
        setPagination(res.data.pagination || { page: 1, limit: 25, total: 0, pages: 1 })
        setSelectedIds([])
      } else if (Array.isArray(res.data)) {
        // Backward-compatible flat array
        setOrders(res.data)
        setSelectedIds([])
      } else {
        setOrders([])
        setSelectedIds([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
      showMsg('Could not load orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, status, dateFrom, dateTo])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const applyFilters = (e) => {
    e?.preventDefault()
    setPage(1)
    // fetchOrders runs via page/search deps after setState — force refetch on same page
    setTimeout(() => fetchOrders(), 0)
  }

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await adminHttp.get(`/api/admin/order-details.php?id=${orderId}`)
      setSelectedOrder(response.data)
      setEditing(false)
      setEditForm(null)
    } catch (error) {
      console.error('Error fetching order details:', error)
      showMsg('Could not load order details', 'error')
    }
  }

  useEffect(() => {
    const onNew = () => {
      fetchOrders()
      fetchStats()
    }
    const onView = (e) => {
      const id = e.detail?.orderId
      if (id) fetchOrderDetails(id)
      fetchOrders()
      fetchStats()
    }
    window.addEventListener('tt-new-orders', onNew)
    window.addEventListener('tt-view-order', onView)
    return () => {
      window.removeEventListener('tt-new-orders', onNew)
      window.removeEventListener('tt-view-order', onView)
    }
  }, [fetchOrders, fetchStats])

  const startEdit = () => {
    if (!selectedOrder) return
    setEditForm({
      first_name: selectedOrder.first_name || '',
      last_name: selectedOrder.last_name || '',
      email: selectedOrder.email || '',
      phone: selectedOrder.phone || '',
      address: selectedOrder.address || '',
      city: selectedOrder.city || '',
      state: selectedOrder.state || '',
      zip_code: selectedOrder.zip_code || '',
      country: selectedOrder.country || 'United States',
      status: selectedOrder.status || 'pending',
      payment_method: selectedOrder.payment_method || '',
      items: (selectedOrder.items || []).map((item) => ({
        id: item.id,
        product_name: item.name || item.product_name || '',
        product_price: parseFloat(item.price ?? item.product_price) || 0,
        quantity: parseInt(item.quantity, 10) || 1,
        selected_size: item.selected_size || '',
        subtotal:
          parseFloat(item.subtotal) ||
          (parseFloat(item.price ?? item.product_price) || 0) * (parseInt(item.quantity, 10) || 1),
      })),
    })
    setEditing(true)
  }

  const updateEditItem = (index, field, value) => {
    setEditForm((prev) => {
      const items = [...prev.items]
      const item = { ...items[index], [field]: value }
      const price = parseFloat(item.product_price) || 0
      const qty = parseInt(item.quantity, 10) || 0
      const isSqft = String(item.selected_size || '').toLowerCase().includes('sqft')
      // For sqft lines, price is $/sqft and selected_size holds measure; subtotal editable or price×1
      if (isSqft) {
        const match = String(item.selected_size).match(/([\d.]+)/)
        const sqft = match ? parseFloat(match[1]) : 1
        item.subtotal = Math.round(price * sqft * 100) / 100
      } else {
        item.subtotal = Math.round(price * Math.max(0, qty) * 100) / 100
      }
      items[index] = item
      return { ...prev, items }
    })
  }

  const saveEdit = async () => {
    if (!selectedOrder || !editForm) return
    setSaving(true)
    try {
      const payload = {
        action: 'update',
        orderId: selectedOrder.id,
        ...editForm,
        items: editForm.items,
      }
      const res = await adminHttp.post('/api/admin/orders.php', payload)
      if (res.data?.success) {
        showMsg('Order updated')
        setEditing(false)
        await fetchOrderDetails(selectedOrder.id)
        fetchOrders()
        fetchStats()
      } else {
        showMsg(res.data?.error || 'Update failed', 'error')
      }
    } catch (e) {
      showMsg(e.response?.data?.error || 'Update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await adminHttp.post('/api/admin/orders.php', {
        action: 'update',
        orderId,
        status: newStatus,
      })
      if (res.data?.success) {
        showMsg('Status updated')
        fetchOrders()
        fetchStats()
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
          if (editForm) setEditForm({ ...editForm, status: newStatus })
        }
      } else {
        showMsg(res.data?.error || 'Status update failed', 'error')
      }
    } catch {
      showMsg('Status update failed', 'error')
    }
  }

  const deleteOrder = async (orderId) => {
    const label =
      selectedOrder?.order_number ||
      orders.find((o) => o.id === orderId)?.order_number ||
      `ORD-${orderId}`
    if (!window.confirm(`Delete order ${label}? This cannot be undone.`)) return
    try {
      const res = await adminHttp.post('/api/admin/orders.php', {
        action: 'delete',
        orderId,
      })
      if (res.data?.success) {
        showMsg('Order deleted')
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null)
          setEditing(false)
        }
        setSelectedIds((prev) => prev.filter((id) => id !== orderId))
        fetchOrders()
        fetchStats()
      } else {
        showMsg(res.data?.error || 'Delete failed', 'error')
      }
    } catch {
      showMsg('Delete failed', 'error')
    }
  }

  const toggleSelect = (orderId) => {
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    )
  }

  const allOnPageSelected =
    orders.length > 0 && orders.every((o) => selectedIds.includes(o.id))

  const toggleSelectAllOnPage = () => {
    if (allOnPageSelected) {
      const pageIds = new Set(orders.map((o) => o.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        orders.forEach((o) => next.add(o.id))
        return [...next]
      })
    }
  }

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return
    if (
      !window.confirm(
        `Delete ${selectedIds.length} selected order${selectedIds.length === 1 ? '' : 's'}? This cannot be undone.`
      )
    ) {
      return
    }
    setBulkDeleting(true)
    try {
      const res = await adminHttp.post('/api/admin/orders.php', {
        action: 'delete_bulk',
        orderIds: selectedIds,
      })
      if (res.data?.success) {
        showMsg(res.data.message || 'Orders deleted')
        if (selectedOrder && selectedIds.includes(selectedOrder.id)) {
          setSelectedOrder(null)
          setEditing(false)
        }
        setSelectedIds([])
        fetchOrders()
        fetchStats()
      } else {
        showMsg(res.data?.error || 'Bulk delete failed', 'error')
      }
    } catch {
      showMsg('Bulk delete failed', 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  const getItemName = (item) => item?.name || item?.product_name || 'Unknown product'
  const getItemQuantity = (item) => parseInt(item?.quantity, 10) || 0
  const getItemUnitPrice = (item) => {
    const price = parseFloat(item?.price ?? item?.product_price)
    if (!Number.isNaN(price) && price > 0) return price
    const qty = getItemQuantity(item)
    const subtotal = parseFloat(item?.subtotal)
    if (qty > 0 && !Number.isNaN(subtotal)) return subtotal / qty
    return 0
  }
  const getItemLineTotal = (item) => {
    const subtotal = parseFloat(item?.subtotal)
    if (!Number.isNaN(subtotal)) return subtotal
    return getItemUnitPrice(item) * getItemQuantity(item)
  }
  const getItemImage = (item) => productImageSrc(item?.image || item?.product_image)

  const editTotal =
    editForm?.items?.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
          <p className="text-sm text-gray-500 mt-1">
            Search, filter, edit or delete orders. Sales and product demand overview.
          </p>
        </div>
        <button
          onClick={() => {
            fetchOrders()
            fetchStats()
          }}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg font-semibold"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-lg border text-sm ${
            messageType === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {message}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {[
            { label: 'Total orders', value: stats.total_orders },
            { label: 'Revenue', value: money(stats.total_revenue) },
            { label: 'Avg order', value: money(stats.avg_order) },
            { label: 'Pending', value: stats.pending },
            { label: 'This week', value: `${stats.week_orders} / ${money(stats.week_revenue)}` },
            { label: '30 days', value: `${stats.month_orders} / ${money(stats.month_revenue)}` },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-800 mb-3">Top selling products</h3>
            {(insights.top_products || []).length === 0 ? (
              <p className="text-sm text-gray-500">No sales data yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {insights.top_products.map((p, i) => (
                  <div key={`${p.product_id}-${i}`} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-gray-400 font-semibold">{i + 1}</span>
                    <img
                      src={productImageSrc(p.image)}
                      alt=""
                      className="w-10 h-10 rounded object-cover bg-gray-50 border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.order_count} orders · {p.units_sold} units
                      </p>
                    </div>
                    <span className="font-semibold text-gray-800">{money(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-800 mb-3">Most viewed products</h3>
            {(insights.most_viewed || []).length === 0 ? (
              <p className="text-sm text-gray-500">No view tracking data yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {insights.most_viewed.map((p, i) => (
                  <div key={`${p.product_id}-${i}`} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-gray-400 font-semibold">{i + 1}</span>
                    <img
                      src={productImageSrc(p.image)}
                      alt=""
                      className="w-10 h-10 rounded object-cover bg-gray-50 border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.views.toLocaleString()} views</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={applyFilters}
        className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-5 gap-3"
      >
        <input
          type="search"
          placeholder="Search order #, name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold shrink-0"
          >
            Filter
          </button>
        </div>
      </form>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <p className="text-sm text-red-800 font-medium">
            {selectedIds.length} order{selectedIds.length === 1 ? '' : 's'} selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700"
            >
              Clear selection
            </button>
            <button
              type="button"
              disabled={bulkDeleting}
              onClick={deleteSelected}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white font-semibold disabled:opacity-50"
            >
              {bulkDeleting ? 'Deleting…' : `Delete selected (${selectedIds.length})`}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-3 text-left w-10">
                          <input
                            type="checkbox"
                            checked={allOnPageSelected}
                            onChange={toggleSelectAllOnPage}
                            aria-label="Select all orders on this page"
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Order #</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className={`hover:bg-gray-50 ${
                            selectedOrder?.id === order.id ? 'bg-primary/5' : ''
                          } ${selectedIds.includes(order.id) ? 'bg-red-50/50' : ''}`}
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(order.id)}
                              onChange={() => toggleSelect(order.id)}
                              aria-label={`Select order ${order.order_number || order.id}`}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            {order.order_number || `ORD-${order.id}`}
                            {order.item_count != null && (
                              <span className="block text-xs font-normal text-gray-400">
                                {order.item_count} item{order.item_count === 1 ? '' : 's'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="font-medium text-gray-800">
                              {order.customerName || `${order.first_name} ${order.last_name}`}
                            </span>
                            <span className="block text-xs text-gray-500 truncate max-w-[160px]">
                              {order.email}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">{money(order.total)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {new Date(order.created_at || order.orderDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <button
                              onClick={() => fetchOrderDetails(order.id)}
                              className="text-primary hover:underline font-semibold mr-3"
                            >
                              View
                            </button>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="text-red-600 hover:underline font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {orders.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No orders match your filters.</div>
                )}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
                    <span className="text-gray-500">
                      Page {pagination.page} of {pagination.pages} · {pagination.total} orders
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 border rounded disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <button
                        disabled={page >= pagination.pages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detail / Edit panel */}
        <div className="xl:col-span-1">
          {!selectedOrder ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500 sticky top-24">
              Select an order to view or edit details.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-5 sticky top-24 max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedOrder.order_number || `ORD-${selectedOrder.id}`}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedOrder.created_at || selectedOrder.orderDate).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!editing ? (
                    <button
                      onClick={startEdit}
                      className="px-3 py-1.5 text-sm font-semibold bg-primary text-white rounded-lg"
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditing(false)
                          setEditForm(null)
                        }}
                        className="px-3 py-1.5 text-sm font-semibold border rounded-lg"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="px-3 py-1.5 text-sm font-semibold bg-green-600 text-white rounded-lg disabled:opacity-60"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {!editing ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">Customer</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Name:</strong>{' '}
                        {selectedOrder.customerName ||
                          `${selectedOrder.first_name} ${selectedOrder.last_name}`}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedOrder.email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {selectedOrder.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">Shipping</h4>
                    <div className="text-sm text-gray-600">
                      <p>{selectedOrder.address}</p>
                      <p>
                        {selectedOrder.city}, {selectedOrder.state} {selectedOrder.zip_code}
                      </p>
                      <p>{selectedOrder.country || 'United States'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">Items</h4>
                    <div className="space-y-3">
                      {(selectedOrder.items || []).length === 0 ? (
                        <p className="text-sm text-gray-500">No line items.</p>
                      ) : (
                        (selectedOrder.items || []).map((item, index) => (
                          <div
                            key={item.id || `${item.product_id}-${index}`}
                            className="flex gap-3 border-b border-gray-100 pb-3 last:border-b-0"
                          >
                            <img
                              src={getItemImage(item)}
                              alt={getItemName(item)}
                              className="w-14 h-14 rounded-lg object-cover border bg-gray-50 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm">{getItemName(item)}</p>
                              {item.selected_size && (
                                <p className="text-xs text-gray-500 mt-0.5">{item.selected_size}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {item.selected_size &&
                                String(item.selected_size).toLowerCase().includes('sqft')
                                  ? `${item.selected_size} × $${getItemUnitPrice(item).toFixed(2)}/sqft`
                                  : `Qty: ${getItemQuantity(item)} × $${getItemUnitPrice(item).toFixed(2)}`}
                              </p>
                            </div>
                            <div className="text-sm font-semibold shrink-0">
                              ${getItemLineTotal(item).toFixed(2)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{money(selectedOrder.total)}</span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">Status</h4>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold"
                    >
                      {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedOrder.payment_method && (
                    <p className="text-xs text-gray-500">Payment: {selectedOrder.payment_method}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['first_name', 'First name'],
                      ['last_name', 'Last name'],
                      ['email', 'Email'],
                      ['phone', 'Phone'],
                      ['city', 'City'],
                      ['state', 'State'],
                      ['zip_code', 'ZIP'],
                      ['country', 'Country'],
                      ['payment_method', 'Payment'],
                    ].map(([key, label]) => (
                      <label key={key} className="block">
                        <span className="text-xs text-gray-500">{label}</span>
                        <input
                          value={editForm[key] || ''}
                          onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                          className="w-full border rounded-lg px-2 py-1.5 mt-0.5"
                        />
                      </label>
                    ))}
                  </div>
                  <label className="block">
                    <span className="text-xs text-gray-500">Address</span>
                    <textarea
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full border rounded-lg px-2 py-1.5 mt-0.5"
                      rows={2}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500">Status</span>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full border rounded-lg px-2 py-1.5 mt-0.5 font-semibold"
                    >
                      {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="border-t pt-3 space-y-3">
                    <h4 className="font-semibold text-gray-700">Line items</h4>
                    {editForm.items.map((item, index) => (
                      <div key={item.id || index} className="border rounded-lg p-2 space-y-2 bg-gray-50">
                        <input
                          value={item.product_name}
                          onChange={(e) => updateEditItem(index, 'product_name', e.target.value)}
                          className="w-full border rounded px-2 py-1 font-medium"
                          placeholder="Product name"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <label className="block">
                            <span className="text-xs text-gray-500">Price</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.product_price}
                              onChange={(e) =>
                                updateEditItem(index, 'product_price', e.target.value)
                              }
                              className="w-full border rounded px-2 py-1"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs text-gray-500">Qty</span>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => updateEditItem(index, 'quantity', e.target.value)}
                              className="w-full border rounded px-2 py-1"
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs text-gray-500">Sqft / size</span>
                            <input
                              value={item.selected_size}
                              onChange={(e) =>
                                updateEditItem(index, 'selected_size', e.target.value)
                              }
                              className="w-full border rounded px-2 py-1"
                              placeholder="e.g. 5 sqft"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          Line: {money(item.subtotal)} (set qty to 0 to remove)
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between font-bold text-base border-t pt-3">
                    <span>Total</span>
                    <span>{money(editTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrdersManagement
