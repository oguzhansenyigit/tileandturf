import React, { useState, useEffect } from 'react'
import axios from 'axios'

const parseParentId = (value) => {
  if (value === null || value === undefined || value === '' || value === '0') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

const isOurProductsItem = (item) =>
  !parseParentId(item?.parent_id) &&
  (item?.slug === 'our-products' ||
    item?.slug === 'products' ||
    String(item?.name || '').toUpperCase() === 'OUR PRODUCTS')

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [addAsSubmenu, setAddAsSubmenu] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    link: '',
    order_index: 0,
    parent_id: null,
    status: 'active'
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
    const ourProducts = menuItems.find(isOurProductsItem)
    const payload = {
      ...formData,
      parent_id: addAsSubmenu && ourProducts ? ourProducts.id : formData.parent_id
    }

    if (addAsSubmenu && !ourProducts) {
      alert('OUR PRODUCTS ana menüsü bulunamadı. Önce ana menüde OUR PRODUCTS oluşturun.')
      return
    }

    try {
      let response
      if (editingItem) {
        response = await axios.put('/api/admin/menu.php', { ...payload, id: editingItem.id })
      } else {
        response = await axios.post('/api/admin/menu.php', payload)
      }

      if (response.data?.success === false) {
        alert(response.data.error || 'Menü kaydedilemedi')
        return
      }

      alert(editingItem ? 'Alt menü güncellendi!' : 'Menü öğesi eklendi!')
      setEditingItem(null)
      setAddAsSubmenu(false)
      resetForm()
      fetchMenuItems()
    } catch (error) {
      console.error('Error saving menu item:', error)
      alert(error.response?.data?.error || 'Menü kaydedilirken hata oluştu')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      link: '',
      order_index: menuItems.length,
      parent_id: null,
      status: 'active'
    })
  }

  const handleEdit = (item, asSubmenu = false) => {
    const parentId = parseParentId(item.parent_id)
    setEditingItem(item)
    setAddAsSubmenu(asSubmenu || Boolean(parentId))
    setFormData({
      name: item.name || '',
      slug: item.slug || '',
      link: item.link || '',
      order_index: item.order_index ?? 0,
      parent_id: parentId,
      status: item.status || 'active'
    })
  }

  const startAddSubmenu = () => {
    const ourProducts = menuItems.find(isOurProductsItem)
    if (!ourProducts) {
      alert('Önce ana menüde OUR PRODUCTS öğesinin olduğundan emin olun.')
      return
    }
    setEditingItem(null)
    setAddAsSubmenu(true)
    setFormData({
      name: '',
      slug: '',
      link: '/products/',
      order_index: menuItems.filter((i) => parseParentId(i.parent_id) === ourProducts.id).length,
      parent_id: ourProducts.id,
      status: 'active'
    })
  }

  const getParentName = (parentId) => {
    const id = parseParentId(parentId)
    if (!id) return '-'
    const parent = menuItems.find((p) => Number(p.id) === id)
    return parent?.name || `ID ${id}`
  }

  const importDefaultSubmenu = async () => {
    if (
      !confirm(
        'Sitede görünen varsayılan OUR PRODUCTS alt menüsü veritabanına aktarılsın mı? (Mevcut aynı slug kayıtları OUR PRODUCTS altına bağlanır.)'
      )
    ) {
      return
    }
    try {
      const response = await axios.post('/api/seed_products_submenu.php')
      if (response.data?.success === false) {
        alert(response.data.error || response.data.message || 'İçe aktarma başarısız')
        return
      }
      alert(response.data?.message || 'Alt menüler aktarıldı.')
      fetchMenuItems()
    } catch (error) {
      console.error('Import default submenu error:', error)
      alert('İçe aktarma sırasında hata oluştu.')
    }
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show all menu items, including OUR PRODUCTS
  const ourProductsMenu = menuItems.find(isOurProductsItem)
  const mainMenuItems = menuItems.filter((item) => !parseParentId(item.parent_id))
  const subMenuItems = ourProductsMenu
    ? menuItems
        .filter((item) => parseParentId(item.parent_id) === Number(ourProductsMenu.id))
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    : menuItems.filter((item) => parseParentId(item.parent_id))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startAddSubmenu}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            + Alt Menü Ekle
          </button>
          {subMenuItems.length === 0 && (
            <button
              type="button"
              onClick={importDefaultSubmenu}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
            >
              Sitedeki varsayılan alt menüyü içe aktar
            </button>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 space-y-2">
        <p className="font-semibold">Neden sitede alt menü var ama admin boş?</p>
        <p>
          Ön yüzde veritabanında OUR PRODUCTS alt kaydı yokken kod içindeki sabit liste gösterilir
          (IPE Tile, Concrete Pavers vb.). Admin yalnızca veritabanındaki kayıtları listeler.
        </p>
        <p>
          Düzenlemek için &quot;Sitedeki varsayılan alt menüyü içe aktar&quot; butonuna tıklayın.
        </p>
        {!ourProductsMenu && (
          <p className="text-amber-800 font-semibold">
            Uyarı: Veritabanında OUR PRODUCTS ana menüsü yok. Önce içe aktarın.
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {editingItem
            ? addAsSubmenu
              ? 'Alt Menü Düzenle'
              : 'Menü Düzenle'
            : addAsSubmenu
              ? 'Alt Menü Ekle'
              : 'Ana Menü Ekle'}
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
              <label className="block text-gray-700 font-semibold mb-2">Parent Menu</label>
              {addAsSubmenu && ourProductsMenu ? (
                <input
                  type="text"
                  readOnly
                  value="OUR PRODUCTS (alt menü)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                />
              ) : (
                <select
                  value={formData.parent_id ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parent_id: e.target.value ? Number(e.target.value) : null
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">None (Ana Menü)</option>
                  {mainMenuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="active">Active (sitede görünür)</option>
                <option value="inactive">Inactive (gizli)</option>
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
                  setAddAsSubmenu(false)
                  resetForm()
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
        <h3 className="text-xl font-bold text-gray-800 p-6 border-b">
          OUR PRODUCTS Alt Menüleri ({subMenuItems.length})
        </h3>
        <table className="w-full">
          <thead className="bg-emerald-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Label</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Link</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subMenuItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{item.order_index}</td>
                <td className="px-6 py-4 text-sm font-semibold">{item.name}</td>
                <td className="px-6 py-4 text-sm">{item.link}</td>
                <td className="px-6 py-4 text-sm">{item.status || 'active'}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item, true)}
                      className="text-primary hover:text-primary-dark font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
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
        {subMenuItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Henüz alt menü yok. &quot;+ Alt Menü Ekle&quot; ile ekleyin veya Parent Menu olarak OUR PRODUCTS seçin.
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h3 className="text-xl font-bold text-gray-800 p-6 border-b">Ana Menü Öğeleri</h3>
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
            {mainMenuItems.sort((a, b) => a.order_index - b.order_index).map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{item.order_index}</td>
                <td className="px-6 py-4 text-sm font-semibold">{item.name}</td>
                <td className="px-6 py-4 text-sm">{item.link}</td>
                <td className="px-6 py-4 text-sm">{getParentName(item.parent_id)}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item, false)}
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

