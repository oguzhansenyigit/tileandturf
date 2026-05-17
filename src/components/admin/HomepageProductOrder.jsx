import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const isVisibleOnHomepage = (product) => {
  const hidden = product.is_hidden == 1 || product.is_hidden === true
  const active = product.status === 'active' || product.status == null
  return active && !hidden
}

const HomepageProductOrder = ({ allProducts, onOrderSaved }) => {
  const homepageProducts = useMemo(
    () =>
      [...allProducts]
        .filter(isVisibleOnHomepage)
        .sort((a, b) => {
          const ao = a.order_index ?? 999999
          const bo = b.order_index ?? 999999
          if (ao !== bo) return ao - bo
          return (a.id || 0) - (b.id || 0)
        }),
    [allProducts]
  )

  const [orderedProducts, setOrderedProducts] = useState([])
  const [dragIndex, setDragIndex] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setOrderedProducts(homepageProducts)
  }, [homepageProducts])

  const saveOrder = async (nextList) => {
    setSaving(true)
    try {
      const payload = {
        products: nextList.map((product, index) => ({
          id: product.id,
          order_index: index,
        })),
      }
      const response = await axios.post('/api/admin/update-product-order.php', payload)
      if (response.data?.success) {
        onOrderSaved?.()
      } else {
        alert(response.data?.error || 'Could not save product order')
        setOrderedProducts(homepageProducts)
      }
    } catch (error) {
      console.error('Error saving homepage product order:', error)
      alert('Error saving product order')
      setOrderedProducts(homepageProducts)
    } finally {
      setSaving(false)
    }
  }

  const handleDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      return
    }
    const next = [...orderedProducts]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(dropIndex, 0, moved)
    setOrderedProducts(next)
    setDragIndex(null)
    saveOrder(next)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-primary/20">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Homepage – Our Products Order</h3>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Drag products to set the order on the homepage &quot;Our Products&quot; section. Only
            active, visible products are listed here. Use &quot;Hide Product&quot; on a product to
            remove it from the homepage.
          </p>
        </div>
        {saving && (
          <span className="text-sm font-semibold text-primary animate-pulse">Saving order…</span>
        )}
      </div>

      {orderedProducts.length === 0 ? (
        <p className="text-gray-500 text-sm">No active products to show on the homepage.</p>
      ) : (
        <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {orderedProducts.map((product, index) => (
            <li
              key={product.id}
              draggable={!saving}
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className={`flex items-center gap-3 p-3 rounded-lg border bg-gray-50 cursor-grab active:cursor-grabbing transition-shadow ${
                dragIndex === index ? 'border-primary shadow-md opacity-80' : 'border-gray-200'
              } ${saving ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <span className="text-gray-400 select-none" aria-hidden="true">
                ⋮⋮
              </span>
              <span className="text-xs font-mono text-gray-500 w-8">{index + 1}</span>
              {product.image ? (
                <img
                  src={product.image}
                  alt=""
                  className="w-12 h-12 object-cover rounded border border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-gray-200 border border-gray-300" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{product.name}</p>
                {product.category_name && (
                  <p className="text-xs text-gray-500 truncate">{product.category_name}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default HomepageProductOrder
