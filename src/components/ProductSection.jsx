import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import ProductCard from './ProductCard'

const ProductSection = ({ category: categoryFilter }) => {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all')
  const [loading, setLoading] = useState(true)
  const searchTerm = searchParams.get('search')

  // Update selectedCategory when categoryFilter changes (from URL)
  useEffect(() => {
    if (categoryFilter) {
      setSelectedCategory(categoryFilter)
    }
  }, [categoryFilter])

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [selectedCategory, searchTerm])

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories.php')
      // Add "All Products" option at the beginning
      const allProductsOption = { id: 0, name: 'All Products', slug: 'all' }
      setCategories([allProductsOption, ...(Array.isArray(response.data) ? response.data : [])])
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Mock data for development
      setCategories([
        { id: 0, name: 'All Products', slug: 'all' },
        { id: 1, name: 'Adjustable Pedestal', slug: 'adjustable-pedestal' },
        { id: 2, name: 'Green Roof Systems', slug: 'green-roof-systems' },
        { id: 3, name: 'IPE Tile Systems', slug: 'ipe-tile-systems' },
        { id: 4, name: 'Synthetic Turf', slug: 'synthetic-systems' },
        { id: 5, name: 'Concrete Pavers', slug: 'concrete-pavers-system' },
      ])
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let url = '/api/products.php'
      if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`
      } else if (selectedCategory !== 'all') {
        url += `?category=${selectedCategory}`
      }
      const response = await axios.get(url)
      setProducts(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching products:', error)
      // Mock data for development
      setProducts([
        {
          id: 1,
          name: 'Premium Adjustable Pedestal',
          price: 29.99,
          image: '/adjustable-pedestal-mainpage.webp',
          category: 'adjustable-pedestal',
          description: 'Professional pedestal systems for elevated surfaces'
        },
        {
          id: 2,
          name: 'IPE Wood Deck Tile',
          price: 89.99,
          image: '/slider5.webp',
          category: 'ipe-tile-systems',
          description: 'Premium IPE wood tile systems'
        },
        {
          id: 3,
          name: 'Green Roof System Kit',
          price: 199.99,
          image: '/greenroof-mainpage.webp',
          category: 'green-roof-systems',
          description: 'Sustainable green roof solutions'
        },
        {
          id: 4,
          name: 'Synthetic Turf Premium',
          price: 79.99,
          image: '/slider3.webp',
          category: 'synthetic-systems',
          description: 'High-quality synthetic turf solutions'
        },
        {
          id: 5,
          name: 'Concrete Paver Set',
          price: 149.99,
          image: '/slider.webp',
          category: 'concrete-pavers-system',
          description: 'Premium concrete pavers for outdoor spaces'
        },
        {
          id: 6,
          name: 'Porcelain Paver Tiles',
          price: 119.99,
          image: '/slider.webp',
          category: 'concrete-pavers-system',
          description: 'Elegant porcelain paver tiles'
        },
        {
          id: 7,
          name: 'IPE Lumber Boards',
          price: 99.99,
          image: '/slider5.webp',
          category: 'ipe-tile-systems',
          description: 'High-quality IPE lumber boards'
        },
        {
          id: 8,
          name: 'Adjustable Pedestal Base',
          price: 19.99,
          image: '/adjustable-pedestal-mainpage.webp',
          category: 'adjustable-pedestal',
          description: 'Foundation base for adjustable pedestal systems'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0">
            {searchTerm ? `Search Results` : 'Our Products - Shop Now'}
          </h2>
          {!searchTerm && (
            <>
              {/* Mobile: Selectbox */}
              <div className="lg:hidden w-full">
                <label className="block text-gray-700 font-semibold mb-2">Filter by Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories.map((category) => (
                    <option key={category.id || category.slug} value={category.slug === 'all' ? 'all' : category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Desktop: Buttons */}
              <div className="hidden lg:flex flex-wrap gap-2">
                <span className="text-gray-700 font-semibold mr-2">Filter by Category:</span>
                {categories.map((category) => (
                  <button
                    key={category.id || category.slug}
                    onClick={() => setSelectedCategory(category.slug === 'all' ? 'all' : category.slug)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === (category.slug === 'all' ? 'all' : category.slug)
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {searchTerm && (
            <div className="text-center w-full">
              <p className="text-lg text-gray-700">
                Search results for: <span className="font-semibold text-primary">"{searchTerm}"</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Found {products.length} product(s)
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductSection

