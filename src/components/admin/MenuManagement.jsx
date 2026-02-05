import React, { useState, useEffect } from 'react'
import axios from 'axios'

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    link: '',
    order_index: 0,
    parent_id: null
  })

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/menu.php')
      setMenuItems(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setMenuItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await axios.put('/api/admin/menu.php', { ...formData, id: editingItem.id })
        alert('Menu item updated successfully!')
      } else {
        await axios.post('/api/admin/menu.php', formData)
        alert('Menu item added successfully!')
      }
      setEditingItem(null)
      setFormData({
        name: '',
        slug: '',
        link: '',
        order_index: menuItems.length,
        parent_id: null
      })
      fetchMenuItems()
    } catch (error) {
      console.error('Error saving menu item:', error)
      alert('Error saving menu item')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      slug: item.slug || '',
      link: item.link || '',
      order_index: item.order_index || 0,
      parent_id: item.parent_id || null
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    try {
      await axios.delete(`/api/admin/menu.php?id=${id}`)
      alert('Menu item deleted successfully!')
      fetchMenuItems()
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert('Error deleting menu item')
    }
  }

  const handleDragStart = (index) => {
    // Simple reorder functionality
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show all menu items, including OUR PRODUCTS
  const mainMenuItems = menuItems.filter(item => !item.parent_id)
  const subMenuItems = menuItems.filter(item => item.parent_id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Auto-generated"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Link *</label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Order Index</label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Parent Menu (Optional)</label>
              <select
                value={formData.parent_id || ''}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">None (Main Menu)</option>
                {mainMenuItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {editingItem ? 'Update' : 'Add'}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null)
                setFormData({
                  name: '',
                  slug: '',
                  link: '',
                  order_index: menuItems.length,
                  parent_id: null
                })
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h3 className="text-xl font-bold text-gray-800 p-6 border-b">Menu Items</h3>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Label</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Link</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Parent</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {menuItems.sort((a, b) => a.order_index - b.order_index).map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{item.order_index}</td>
                <td className="px-6 py-4 text-sm font-semibold">{item.name}</td>
                <td className="px-6 py-4 text-sm">{item.link}</td>
                <td className="px-6 py-4 text-sm">
                  {item.parent_id ? menuItems.find(p => p.id === item.parent_id)?.name || 'N/A' : '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-primary hover:text-primary-dark font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {menuItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No menu items found.
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuManagement

