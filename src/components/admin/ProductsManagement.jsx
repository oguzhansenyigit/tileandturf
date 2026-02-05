import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { createSlug } from '../../utils/slug'

const ProductsManagement = () => {
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([]) // Store all products for filtering
  const [categories, setCategories] = useState([])
  const [variations, setVariations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [uploadingPdf, setUploadingPdf] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: ''
  })
  const [editingCategory, setEditingCategory] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    image: '',
    category_id: '',
    stock: '',
    weight_lbs: '',
    variations: '',
    selectedVariations: [],
    productVariations: [],
    productVariationSearch: '',
    gallery_images: [],
    comparison_before: '',
    comparison_after: '',
    related_products: [],
    datasheet_pdf: '',
    brochure_pdf: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    catalog_mode: 'no',
    call_for_pricing: false,
    sqft_enabled: false,
    sqft_price: '',
    length_enabled: false,
    length_base_price: '',
    length_increment_price: '',
    is_packaged: false,
    pack_size: 1,
    pcs_per_box: '',
    show_unit_price: false,
    show_price_unit_kit: false,
    gift_product_id: '',
    is_hidden: false,
    order_index: 0
  })
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadingComparison, setUploadingComparison] = useState(null)
  const [giftProductSearch, setGiftProductSearch] = useState('')
  const [giftProductSearchResults, setGiftProductSearchResults] = useState([])
  const [showGiftProductResults, setShowGiftProductResults] = useState(false)
  const [showSorting, setShowSorting] = useState(false)
  const [sortingCategory, setSortingCategory] = useState('all')
  const [sortingProducts, setSortingProducts] = useState([])
  const [draggedItem, setDraggedItem] = useState(null)
  const datasheetPdfInputRef = useRef(null)
  const brochurePdfInputRef = useRef(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchVariations()
  }, [])

  // Close gift product search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showGiftProductResults && !event.target.closest('.relative')) {
        setShowGiftProductResults(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showGiftProductResults])

  // Filter products based on search term and category
  useEffect(() => {
    let filtered = [...allProducts]

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category_id == selectedCategory || 
        product.category_id === parseInt(selectedCategory)
      )
    }

    // Filter by search term (name, SKU, or ID)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(searchLower)
        const skuMatch = product.sku?.toLowerCase().includes(searchLower)
        const idMatch = product.id?.toString().includes(searchLower)
        return nameMatch || skuMatch || idMatch
      })
    }

    setProducts(filtered)
  }, [searchTerm, selectedCategory, allProducts])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // For admin, get all products including inactive and hidden
      const response = await axios.get('/api/products.php?admin=true')
        const productsData = Array.isArray(response.data) ? response.data : []
        setAllProducts(productsData)
        setProducts(productsData)
    } catch (error) {
      console.error('Error fetching products:', error)
      // Fallback: get all products
      try {
        const response = await axios.get('/api/products.php?admin=true')
        const productsData = Array.isArray(response.data) ? response.data : []
        setAllProducts(productsData)
        setProducts(productsData)
      } catch (e) {
        const productsData = []
        setAllProducts(productsData)
        setProducts(productsData)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories.php')
      setCategories(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  const fetchVariations = async () => {
    try {
      const response = await axios.get('/api/admin/variations.php')
      setVariations(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching variations:', error)
      setVariations([])
    }
  }

  const handlePdfUpload = async (file, type, inputRef) => {
    if (!file) {
      alert('Please select a PDF file to upload')
      return
    }
    
    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file')
      return
    }
    
    setUploadingPdf(type)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      console.log('📤 Uploading PDF:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        type: type
      })

      const response = await axios.post('/api/upload-pdf.php', formData, {
        // Don't set Content-Type manually - axios will set it automatically with boundary
        timeout: 300000, // 5 minutes timeout for large files
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'Accept': 'application/json'
        }
      })
      
      console.log('📥 PDF upload response:', response.data)
      
      if (response.data && response.data.success) {
        const pdfUrl = response.data.url
        // Ensure URL starts with / for absolute path
        const finalUrl = pdfUrl.startsWith('/') ? pdfUrl : '/' + pdfUrl
        
        // Use functional update to ensure we have the latest state
        setProductForm(prevForm => ({
          ...prevForm,
          [type]: finalUrl
        }))
        
        // Clear file input
        if (inputRef && inputRef.current) {
          inputRef.current.value = ''
        }
        
        console.log('✅ PDF uploaded successfully:', finalUrl)
        alert('PDF uploaded successfully!')
      } else {
        const errorMsg = response.data?.error || 'Unknown error occurred'
        const debugInfo = response.data?.debug || {}
        console.error('❌ PDF upload error:', {
          error: errorMsg,
          debug: debugInfo,
          fullResponse: response.data
        })
        alert('Error uploading PDF: ' + errorMsg + (debugInfo ? '\n\nDebug: ' + JSON.stringify(debugInfo) : ''))
      }
    } catch (error) {
      console.error('❌ PDF upload exception:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: error.config
      })
      
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message || 
                      'Failed to upload PDF. Please try again.'
      
      const debugInfo = error.response?.data?.debug
      const fullErrorMsg = debugInfo 
        ? `${errorMsg}\n\nDebug Info:\n${JSON.stringify(debugInfo, null, 2)}`
        : errorMsg
        
      alert('Error uploading PDF: ' + fullErrorMsg)
    } finally {
      setUploadingPdf(null)
    }
  }

  const handleImageUpload = async (file) => {
    setUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await axios.post('/api/upload-image.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data.success) {
        setProductForm({ ...productForm, image: response.data.url })
        alert('Image uploaded successfully!')
      } else {
        alert('Error uploading image: ' + response.data.error)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleGalleryUpload = async (file) => {
    setUploadingGallery(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await axios.post('/api/upload-image.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data.success) {
        const newGallery = [...(productForm.gallery_images || []), response.data.url]
        setProductForm({ ...productForm, gallery_images: newGallery })
        alert('Image added to gallery!')
      } else {
        alert('Error uploading image: ' + response.data.error)
      }
    } catch (error) {
      console.error('Error uploading gallery image:', error)
      alert('Error uploading image')
    } finally {
      setUploadingGallery(false)
    }
  }

  const handleMultipleGalleryUpload = async (files) => {
    if (files.length === 0) return
    
    setUploadingGallery(true)
    const uploadedUrls = []
    let successCount = 0
    let errorCount = 0
    
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        
        try {
          const response = await axios.post('/api/upload-image.php', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          if (response.data.success) {
            uploadedUrls.push(response.data.url)
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error('Error uploading image:', error)
          errorCount++
        }
      }
      
      if (uploadedUrls.length > 0) {
        const newGallery = [...(productForm.gallery_images || []), ...uploadedUrls]
        setProductForm({ ...productForm, gallery_images: newGallery })
        alert(`${successCount} image(s) added to gallery${errorCount > 0 ? `, ${errorCount} failed` : ''}!`)
      } else {
        alert('Failed to upload images. Please try again.')
      }
    } finally {
      setUploadingGallery(false)
    }
  }

  const handleComparisonUpload = async (file, type) => {
    setUploadingComparison(type)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await axios.post('/api/upload-image.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data.success) {
        setProductForm(prevForm => ({
          ...prevForm,
          [type]: response.data.url
        }))
        alert('Comparison image uploaded successfully!')
      } else {
        alert('Error uploading image: ' + response.data.error)
      }
    } catch (error) {
      console.error('Error uploading comparison image:', error)
      alert('Error uploading image')
    } finally {
      setUploadingComparison(null)
    }
  }

  const removeGalleryImage = (index) => {
    const newGallery = productForm.gallery_images.filter((_, i) => i !== index)
    setProductForm({ ...productForm, gallery_images: newGallery })
  }

  const removeComparisonImage = (type) => {
    setProductForm({ ...productForm, [type]: '' })
  }

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    try {
      const categoryData = {
        ...categoryForm,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-')
      }

      if (editingCategory) {
        // Update category using PUT
        await axios.put('/api/categories.php', { ...categoryData, id: editingCategory.id })
        alert('Category updated successfully!')
      } else {
        // Add new category using POST
        await axios.post('/api/categories.php', categoryData)
        alert('Category added successfully!')
      }
      
      setShowCategoryForm(false)
      setEditingCategory(null)
      setCategoryForm({
        name: '',
        slug: '',
        description: ''
      })
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error saving category'
      alert('Error saving category: ' + errorMessage)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? Products in this category will lose their category assignment.')) return
    try {
      await axios.delete(`/api/categories.php?id=${id}`)
      alert('Category deleted successfully!')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
    }
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      // Merge product variations into variations JSON
      let variationsData = {}
      if (productForm.variations && productForm.variations !== '' && productForm.variations !== '{}') {
        try {
          const parsed = typeof productForm.variations === 'string' 
            ? JSON.parse(productForm.variations) 
            : productForm.variations
          // Only use parsed data if it's an object
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            variationsData = parsed
          }
        } catch (e) {
          console.error('Error parsing variations:', e)
          variationsData = {}
        }
      }
      
      // Add product variations
      if (productForm.productVariations && productForm.productVariations.length > 0) {
        variationsData.product_variations = productForm.productVariations.map(pv => ({
          product_id: pv.product_id,
          price_adjustment: pv.price_adjustment || 0
        }))
        console.log('Adding product variations:', variationsData.product_variations)
      } else {
        // Remove product_variations if empty
        if (variationsData.product_variations) {
          delete variationsData.product_variations
        }
      }
      
      console.log('Final variations data:', variationsData)

      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        weight_lbs: productForm.weight_lbs ? parseFloat(productForm.weight_lbs) : null,
        category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
        slug: productForm.slug || productForm.name.toLowerCase().replace(/\s+/g, '-'),
        gallery_images: Array.isArray(productForm.gallery_images) ? JSON.stringify(productForm.gallery_images) : productForm.gallery_images,
        related_products: Array.isArray(productForm.related_products) ? JSON.stringify(productForm.related_products) : productForm.related_products,
        variations: JSON.stringify(variationsData),
        sqft_enabled: productForm.sqft_enabled ? 1 : 0,
        sqft_price: productForm.sqft_price ? parseFloat(productForm.sqft_price) : null,
        length_enabled: productForm.length_enabled ? 1 : 0,
        length_base_price: productForm.length_base_price ? parseFloat(productForm.length_base_price) : null,
        length_increment_price: productForm.length_increment_price ? parseFloat(productForm.length_increment_price) : null,
        is_packaged: productForm.is_packaged ? 1 : 0,
        pack_size: productForm.is_packaged ? parseFloat(productForm.pack_size) || 1 : null,
        pcs_per_box: productForm.is_packaged && (productForm.pcs_per_box !== '' && productForm.pcs_per_box != null) ? (isNaN(parseInt(productForm.pcs_per_box)) ? null : parseInt(productForm.pcs_per_box)) : null,
        show_unit_price: productForm.show_unit_price ? 1 : 0,
        show_price_unit_kit: productForm.show_price_unit_kit ? 1 : 0,
        call_for_pricing: productForm.call_for_pricing ? 1 : 0,
        gift_product_id: productForm.gift_product_id ? parseInt(productForm.gift_product_id) : null,
        is_hidden: productForm.is_hidden ? 1 : 0,
        order_index: productForm.order_index !== undefined && productForm.order_index !== '' ? parseInt(productForm.order_index) || 0 : 0
      }
      
      // Remove productVariations from productData (not needed in API)
      delete productData.productVariations
      delete productData.productVariationSearch

      // Debug log
      console.log('Submitting product data:', {
        is_packaged: productData.is_packaged,
        pcs_per_box_form: productForm.pcs_per_box,
        pcs_per_box_data: productData.pcs_per_box,
        variations: productData.variations,
        productVariations: productForm.productVariations
      })

      let savedProduct
      if (editingProduct) {
        const response = await axios.put('/api/products.php', { ...productData, id: editingProduct.id })
        savedProduct = response.data
        alert('Product updated successfully!')
      } else {
        const response = await axios.post('/api/products.php', productData)
        savedProduct = response.data
        alert('Product added successfully!')
      }
      
      // Debug: Check if pcs_per_box was saved
      console.log('Product saved, response:', savedProduct)
      
      setShowProductForm(false)
      setEditingProduct(null)
      setProductForm({
        name: '',
        slug: '',
        description: '',
        price: '',
        image: '',
        category_id: '',
        stock: '',
        weight_lbs: '',
        variations: '',
        selectedVariations: [],
        productVariations: [],
        productVariationSearch: '',
        gallery_images: [],
        comparison_before: '',
        comparison_after: '',
        related_products: [],
        datasheet_pdf: '',
        brochure_pdf: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        catalog_mode: 'no',
        call_for_pricing: false,
        sqft_enabled: false,
        sqft_price: '',
        length_enabled: false,
        length_base_price: '',
        length_increment_price: '',
        is_packaged: false,
        pack_size: 1,
        pcs_per_box: '',
        show_unit_price: false,
        gift_product_id: '',
        is_hidden: false,
        order_index: 0
      })
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error saving product'
      const sqlQuery = error.response?.data?.sql ? `\n\nSQL: ${error.response.data.sql}` : ''
      alert('Error saving product: ' + errorMessage + sqlQuery)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    let variationsData = {}
    if (product.variations && product.variations !== '' && product.variations !== '{}') {
      try {
        const parsed = typeof product.variations === 'string' 
          ? JSON.parse(product.variations) 
          : product.variations
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          variationsData = parsed
        }
      } catch (e) {
        console.error('Error parsing variations in handleEditProduct:', e)
        variationsData = {}
      }
    }
    
    const selectedVariations = Object.keys(variationsData)
      .filter(id => id !== 'product_variations' && !isNaN(parseInt(id)))
      .map(id => parseInt(id))
    
    // Extract product variations
    const productVariations = variationsData.product_variations || []
    const productVariationsWithDetails = productVariations.map(pv => {
      const fullProduct = allProducts.find(p => p.id == pv.product_id)
      return {
        product_id: pv.product_id,
        product_name: fullProduct?.name || `Product #${pv.product_id}`,
        product_image: fullProduct?.image || '',
        price_adjustment: pv.price_adjustment || 0
      }
    })
    
    console.log('Loading product for edit:', {
      productId: product.id,
      variationsRaw: product.variations,
      variationsParsed: variationsData,
      productVariations: productVariationsWithDetails
    })
    
    setProductForm({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      price: product.price || '',
      image: product.image || '',
      category_id: product.category_id || '',
      stock: product.stock || '',
      weight_lbs: product.weight_lbs || '',
      variations: product.variations || '',
      selectedVariations: selectedVariations,
      gallery_images: product.gallery_images ? (typeof product.gallery_images === 'string' ? JSON.parse(product.gallery_images) : product.gallery_images) : [],
      comparison_before: product.comparison_before || '',
      comparison_after: product.comparison_after || '',
      related_products: product.related_products ? (typeof product.related_products === 'string' ? (JSON.parse(product.related_products) || []).map(id => typeof id === 'number' ? id : parseInt(id)) : (Array.isArray(product.related_products) ? product.related_products.map(id => typeof id === 'number' ? id : parseInt(id)) : [])) : [],
      datasheet_pdf: product.datasheet_pdf || '',
      brochure_pdf: product.brochure_pdf || '',
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      sqft_enabled: product.sqft_enabled == 1 || product.sqft_enabled === true,
      sqft_price: product.sqft_price || '',
      length_enabled: product.length_enabled == 1 || product.length_enabled === true,
      length_base_price: product.length_base_price || '',
      length_increment_price: product.length_increment_price || '',
      is_packaged: product.is_packaged == 1 || product.is_packaged === true,
      pack_size: product.pack_size || 1,
      pcs_per_box: (product.pcs_per_box != null && product.pcs_per_box !== '') ? product.pcs_per_box : '',
      show_unit_price: product.show_unit_price == 1 || product.show_unit_price === true,
      show_price_unit_kit: product.show_price_unit_kit == 1 || product.show_price_unit_kit === true,
      meta_keywords: product.meta_keywords || '',
      catalog_mode: product.catalog_mode || 'no',
      call_for_pricing: product.call_for_pricing == 1 || product.call_for_pricing === true,
      gift_product_id: product.gift_product_id || '',
      is_hidden: product.is_hidden == 1 || product.is_hidden === true,
      order_index: product.order_index !== undefined && product.order_index !== null ? product.order_index : 0
    })
    setShowProductForm(true)
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await axios.delete(`/api/products.php?id=${id}`)
      alert('Product deleted successfully!')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  // Product Sorting Functions
  const handleOpenSorting = (categoryId = 'all') => {
    setSortingCategory(categoryId)
    let productsToSort = [...allProducts]
    
    if (categoryId !== 'all') {
      productsToSort = productsToSort.filter(product => 
        product.category_id == categoryId || product.category_id === parseInt(categoryId)
      )
    }
    
    // Sort by order_index
    productsToSort.sort((a, b) => {
      const aIndex = a.order_index !== undefined && a.order_index !== null ? a.order_index : 999999
      const bIndex = b.order_index !== undefined && b.order_index !== null ? b.order_index : 999999
      return aIndex - bIndex
    })
    
    setSortingProducts(productsToSort)
    setShowSorting(true)
  }

  const handleDragStart = (e, index) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedItem === null) return

    const newProducts = [...sortingProducts]
    const draggedProduct = newProducts[draggedItem]
    
    newProducts.splice(draggedItem, 1)
    newProducts.splice(dropIndex, 0, draggedProduct)
    
    setSortingProducts(newProducts)
    setDraggedItem(null)
  }

  const handleSaveSorting = async () => {
    try {
      const productsToUpdate = sortingProducts.map((product, index) => ({
        id: product.id,
        order_index: index
      }))

      await axios.post('/api/admin/update-product-order.php', {
        products: productsToUpdate
      })

      alert('Product order updated successfully!')
      setShowSorting(false)
      fetchProducts()
    } catch (error) {
      console.error('Error saving product order:', error)
      alert('Error saving product order')
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
        <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenSorting('all')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Sort Products
          </button>
          <button
            onClick={() => {
              setShowProductForm(true)
              setEditingProduct(null)
              setProductForm({
                name: '',
                slug: '',
                description: '',
                price: '',
                image: '',
                category_id: '',
                stock: '',
                weight_lbs: '',
                variations: '',
                selectedVariations: [],
                gallery_images: [],
                comparison_before: '',
                comparison_after: '',
                related_products: [],
                datasheet_pdf: '',
                brochure_pdf: '',
                meta_title: '',
                meta_description: '',
                meta_keywords: '',
                catalog_mode: 'no',
                call_for_pricing: false,
                sqft_enabled: false,
                sqft_price: '',
                length_enabled: false,
                length_base_price: '',
                length_increment_price: '',
                is_packaged: false,
                pack_size: 1,
                order_index: 0
              })
            }}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Search Products</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, SKU, or ID..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="w-full bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-800">{products.length}</span> of{' '}
                <span className="font-semibold text-gray-800">{allProducts.length}</span> products
              </p>
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || selectedCategory !== 'all') && (
          <div className="mt-3">
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
              className="text-sm text-primary hover:text-primary-dark font-semibold flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {showProductForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            {editingProduct && (
              <button
                type="submit"
                form="product-form"
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Update Product
              </button>
            )}
          </div>
          <form id="product-form" onSubmit={handleProductSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => {
                    const newName = e.target.value
                    const newSlug = productForm.slug || createSlug(newName)
                    setProductForm({ ...productForm, name: newName, slug: newSlug })
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Slug</label>
                <input
                  type="text"
                  value={productForm.slug}
                  onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Category</label>
                <div className="flex gap-2">
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(true)
                      setEditingCategory(null)
                      setCategoryForm({ name: '', slug: '', description: '' })
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
                  >
                    + Add Category
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Stock</label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Display Order (Order Index)</label>
                <input
                  type="number"
                  value={productForm.order_index || 0}
                  onChange={(e) => setProductForm({ ...productForm, order_index: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first. Use this to control the order products appear in category listings.
                </p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Package Weight (LBS)
                  <span className="text-gray-500 font-normal text-sm ml-2">(Optional - for accurate shipping calculation)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.weight_lbs}
                  onChange={(e) => setProductForm({ ...productForm, weight_lbs: e.target.value })}
                  placeholder="Enter package weight in pounds (e.g., 25.5)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If provided, shipping cost will be calculated based on actual weight. Otherwise, fixed $90 shipping will be applied.
                </p>
              </div>
              
              {/* Sqft Pricing Section */}
              <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={productForm.sqft_enabled}
                    onChange={(e) => setProductForm({ ...productForm, sqft_enabled: e.target.checked })}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-gray-700 font-semibold">Enable Sqft Pricing</span>
                </label>
                {productForm.sqft_enabled && (
                  <div className="ml-7">
                    <label className="block text-gray-700 font-semibold mb-2">Price per Sqft ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.sqft_price}
                      onChange={(e) => setProductForm({ ...productForm, sqft_price: e.target.value })}
                      placeholder="e.g., 10.00"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Customer will enter sqft quantity, and price will be calculated as: sqft × price per sqft
                    </p>
                  </div>
                )}
              </div>

              {/* Length Pricing Section */}
              <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={productForm.length_enabled}
                    onChange={(e) => setProductForm({ ...productForm, length_enabled: e.target.checked })}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-gray-700 font-semibold">Enable Length Pricing</span>
                </label>
                {productForm.length_enabled && (
                  <div className="ml-7 space-y-3">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Base Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.length_base_price}
                        onChange={(e) => setProductForm({ ...productForm, length_base_price: e.target.value })}
                        placeholder="e.g., 10.36"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Price Increment per Length Unit ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.length_increment_price}
                        onChange={(e) => setProductForm({ ...productForm, length_increment_price: e.target.value })}
                        placeholder="e.g., 3.46"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Price calculation: Base Price + (Length × Increment Price). Example: $10.36 + (3 × $3.46) = $20.74
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Package Pricing Section */}
              <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={productForm.is_packaged}
                    onChange={(e) => setProductForm({ ...productForm, is_packaged: e.target.checked })}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-gray-700 font-semibold">This product is sold in packages</span>
                </label>
                {productForm.is_packaged && (
                  <div className="ml-7 space-y-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Pack Size (units per package)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={productForm.pack_size}
                        onChange={(e) => setProductForm({ ...productForm, pack_size: parseFloat(e.target.value) || 0.01 })}
                        placeholder="e.g., 10 or 0.75"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Per box?</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={productForm.pcs_per_box !== '' && productForm.pcs_per_box != null ? productForm.pcs_per_box : ''}
                        onChange={(e) => {
                          const value = e.target.value.trim()
                          setProductForm({ ...productForm, pcs_per_box: value === '' ? '' : value })
                        }}
                        placeholder="e.g., 10"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This value will appear in the format: "$X.XX/pcs Sold per box (X pcs per box)"
                      </p>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.show_unit_price}
                        onChange={(e) => setProductForm({ ...productForm, show_unit_price: e.target.checked })}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-gray-700 font-semibold">Show unit price on frontend</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.show_price_unit_kit}
                        onChange={(e) => setProductForm({ ...productForm, show_price_unit_kit: e.target.checked })}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-gray-700 font-semibold">Show /kit after unit price</span>
                    </label>
                    <p className="text-xs text-gray-500">
                      When checked, unit price will display as "$X.XX/kit" (e.g., $1.50/kit)
                    </p>
                    <p className="text-xs text-gray-500">
                      {productForm.is_packaged ? (
                        <>
                          The frontend will display: <strong>"$X.XX/pcs Sold per box (X pcs per box)"</strong> format.
                          <br />
                          Example: Package price $25.00, Pack size 10 → Frontend shows "$2.50/pcs Sold per box (10 pcs per box)"
                          <br />
                          The displayed price is calculated as: Package Price ÷ Pack Size = Unit Price
                          <br />
                          When customers add to cart, the <strong>package price</strong> will be used.
                        </>
                      ) : (
                        <>
                          The frontend will display: <strong>"$X.XX/pcs"</strong> format (sold per piece).
                          <br />
                          Example: Price $2.50 → Frontend shows "$2.50/pcs"
                          <br />
                          This indicates the product is sold individually, not in packages.
                        </>
                      )}
                    </p>
                  </div>
                )}
                {!productForm.is_packaged && (
                  <div className="ml-7 space-y-4 mt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.show_unit_price}
                        onChange={(e) => setProductForm({ ...productForm, show_unit_price: e.target.checked })}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-gray-700 font-semibold">Show unit price (/pcs) on frontend</span>
                    </label>
                    <p className="text-xs text-gray-500">
                      Enable this to display the price as <strong>"$X.XX/pcs"</strong> format, indicating the product is sold per piece (adet).
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Product Image</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleImageUpload(e.target.files[0])
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <p className="text-sm text-gray-500">Uploading...</p>
                  )}
                  <input
                    type="text"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    placeholder="Or enter image URL"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                  {productForm.image && (
                    <div className="mt-2">
                      <img 
                        src={productForm.image} 
                        alt="Preview" 
                        className="max-w-xs h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Description</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows="4"
              />
            </div>

            {/* Product-Based Variations */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Product Variations (Show Other Products as Options)</label>
              <p className="text-xs text-gray-500 mb-3">Add other products as variation options. These will be displayed as product cards with image and title.</p>
              
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Add Product as Variation</label>
                  <div className="flex gap-2">
                    <select
                      value={productForm.productVariationSearch || ''}
                      onChange={(e) => {
                        const selectedProductId = e.target.value
                        if (selectedProductId) {
                          const selectedProduct = allProducts.find(p => p.id == selectedProductId)
                          if (selectedProduct) {
                            const currentVariations = productForm.productVariations || []
                            // Check if product already added
                            if (!currentVariations.some(v => v.product_id == selectedProductId)) {
                              setProductForm({
                                ...productForm,
                                productVariations: [...currentVariations, {
                                  product_id: parseInt(selectedProductId),
                                  product_name: selectedProduct.name,
                                  product_image: selectedProduct.image,
                                  price_adjustment: 0
                                }],
                                productVariationSearch: ''
                              })
                            } else {
                              alert('This product is already added as a variation')
                              setProductForm({ ...productForm, productVariationSearch: '' })
                            }
                          }
                        }
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    >
                      <option value="">Select a product to add as variation...</option>
                      {allProducts
                        .filter(p => !editingProduct || p.id !== editingProduct.id)
                        .map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${(parseFloat(product.price) || 0).toFixed(2)}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {productForm.productVariations && productForm.productVariations.length > 0 && (
                  <div className="space-y-3">
                    {productForm.productVariations.map((pv, idx) => {
                      const product = allProducts.find(p => p.id == pv.product_id)
                      return (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <img
                            src={pv.product_image || product?.image || '/placeholder.jpg'}
                            alt={pv.product_name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => { e.target.src = '/placeholder.jpg' }}
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{pv.product_name}</div>
                            <div className="text-sm text-gray-500">Product ID: {pv.product_id}</div>
                          </div>
                          <div className="w-32">
                            <label className="block text-xs text-gray-600 mb-1">Price Adjustment</label>
                            <input
                              type="number"
                              step="0.01"
                              value={pv.price_adjustment || 0}
                              onChange={(e) => {
                                const newProductVariations = [...productForm.productVariations]
                                newProductVariations[idx].price_adjustment = parseFloat(e.target.value) || 0
                                setProductForm({
                                  ...productForm,
                                  productVariations: newProductVariations
                                })
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newProductVariations = productForm.productVariations.filter((_, i) => i !== idx)
                              setProductForm({
                                ...productForm,
                                productVariations: newProductVariations
                              })
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Standard Variations */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Standard Variations</label>
              <p className="text-xs text-gray-500 mb-3">Select variations from the variation library</p>
              <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                {variations && variations.length > 0 ? (
                  variations.map((variation) => {
                    const variationId = variation.id
                    const isSelected = productForm.selectedVariations?.includes(variationId) || false
                    const variationData = productForm.variations ? (typeof productForm.variations === 'string' ? JSON.parse(productForm.variations) : productForm.variations) : {}
                    const variationOptions = variationData[variationId] || {}
                    const availableOptions = Array.isArray(variation.options) ? variation.options : []
                    
                    return (
                      <div key={variation.id} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center space-x-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const selected = productForm.selectedVariations || []
                              let newSelected = []
                              let newVariationsData = { ...variationData }
                              
                              if (e.target.checked) {
                                newSelected = [...selected, variationId]
                                if (!newVariationsData[variationId]) {
                                  newVariationsData[variationId] = {}
                                }
                              } else {
                                newSelected = selected.filter(id => id !== variationId)
                                delete newVariationsData[variationId]
                              }
                              
                              setProductForm({
                                ...productForm,
                                selectedVariations: newSelected,
                                variations: JSON.stringify(newVariationsData)
                              })
                            }}
                              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                            <div>
                              <span className="text-base font-semibold text-gray-700">{variation.name}</span>
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {variation.type}
                            </span>
                            </div>
                          </label>
                          {isSelected && availableOptions.length > 0 && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newVariationsData = { ...variationData }
                                  if (!newVariationsData[variationId]) {
                                    newVariationsData[variationId] = {}
                                  }
                                  // Select all options
                                  availableOptions.forEach(option => {
                                    if (!newVariationsData[variationId][option]) {
                                      newVariationsData[variationId][option] = {
                                        value: option,
                                        price: null
                                      }
                                    }
                                  })
                                  setProductForm({
                                    ...productForm,
                                    variations: JSON.stringify(newVariationsData)
                                  })
                                }}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newVariationsData = { ...variationData }
                                  delete newVariationsData[variationId]
                                  setProductForm({
                                    ...productForm,
                                    variations: JSON.stringify(newVariationsData)
                                  })
                                }}
                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              >
                                Clear All
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {isSelected && availableOptions.length > 0 && (
                          <div className="mt-3 bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700 w-12">
                                      <input
                                        type="checkbox"
                                        checked={availableOptions.every(option => variationOptions[option] !== undefined)}
                                        onChange={(e) => {
                                          const newVariationsData = { ...variationData }
                                          if (!newVariationsData[variationId]) {
                                            newVariationsData[variationId] = {}
                                          }
                                          
                                          if (e.target.checked) {
                                            availableOptions.forEach(option => {
                                              if (!newVariationsData[variationId][option]) {
                                                newVariationsData[variationId][option] = {
                                                  value: option,
                                                  price: null
                                                }
                                              }
                                            })
                                          } else {
                                            availableOptions.forEach(option => {
                                              delete newVariationsData[variationId][option]
                                            })
                                          }
                                          
                                          setProductForm({
                                            ...productForm,
                                            variations: JSON.stringify(newVariationsData)
                                          })
                                        }}
                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                      />
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Option</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Display Value</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Price</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {availableOptions.map((option, idx) => {
                                    const isOptionSelected = variationOptions[option] !== undefined
                                    const optionPrice = variationOptions[option]?.price ?? ''
                                    const optionValue = variationOptions[option]?.value || option
                                  
                                  return (
                                      <tr key={idx} className={`hover:bg-gray-50 ${isOptionSelected ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-3 py-2">
                                        <input
                                          type="checkbox"
                                          checked={isOptionSelected}
                                          onChange={(e) => {
                                            const newVariationsData = { ...variationData }
                                            if (!newVariationsData[variationId]) {
                                              newVariationsData[variationId] = {}
                                            }
                                            
                                            if (e.target.checked) {
                                              newVariationsData[variationId][option] = {
                                                value: option,
                                                price: null
                                              }
                                            } else {
                                              delete newVariationsData[variationId][option]
                                            }
                                            
                                            setProductForm({
                                              ...productForm,
                                              variations: JSON.stringify(newVariationsData)
                                            })
                                          }}
                                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                        />
                                        </td>
                                        <td className="px-3 py-2 font-medium text-gray-700">{option}</td>
                                        <td className="px-3 py-2">
                                          {isOptionSelected ? (
                                            <input
                                              type="text"
                                              value={optionValue}
                                              onChange={(e) => {
                                                const newVariationsData = { ...variationData }
                                                if (!newVariationsData[variationId]) {
                                                  newVariationsData[variationId] = {}
                                                }
                                                if (!newVariationsData[variationId][option]) {
                                                  newVariationsData[variationId][option] = {}
                                                }
                                                newVariationsData[variationId][option].value = e.target.value || option
                                                setProductForm({
                                                  ...productForm,
                                                  variations: JSON.stringify(newVariationsData)
                                                })
                                              }}
                                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                              placeholder={option}
                                            />
                                          ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2">
                                          {isOptionSelected ? (
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={optionPrice}
                                              onChange={(e) => {
                                                const newVariationsData = { ...variationData }
                                                if (!newVariationsData[variationId]) {
                                                  newVariationsData[variationId] = {}
                                                }
                                                if (!newVariationsData[variationId][option]) {
                                                  newVariationsData[variationId][option] = {}
                                                }
                                                newVariationsData[variationId][option].price = e.target.value ? parseFloat(e.target.value) : null
                                                setProductForm({
                                                  ...productForm,
                                                  variations: JSON.stringify(newVariationsData)
                                                })
                                              }}
                                              className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                                              placeholder="0.00"
                                            />
                                          ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                                          </div>
                            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                              <strong>Tip:</strong> Check the box to enable an option, then enter display value (optional) and price adjustment (optional).
                                        </div>
                                    </div>
                                )}
                        {isSelected && (!Array.isArray(variation.options) || variation.options.length === 0) && (
                          <p className="text-xs text-gray-500 italic mt-2">No options available for this variation</p>
                            )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No variations available. <a href="#variations" className="text-primary hover:underline">Create variations first</a>
                  </p>
                )}
              </div>
              {productForm.selectedVariations && productForm.selectedVariations.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {productForm.selectedVariations.length} variation(s) selected
                </p>
              )}
            </div>

            {/* Gallery Images */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Gallery Images</label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.currentTarget.classList.add('border-primary', 'bg-primary/5')
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.currentTarget.classList.remove('border-primary', 'bg-primary/5')
                  
                  const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
                  if (files.length > 0) {
                    handleMultipleGalleryUpload(files)
                  }
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const files = Array.from(e.target.files)
                      handleMultipleGalleryUpload(files)
                    }
                  }}
                  className="hidden"
                  id="gallery-upload"
                  disabled={uploadingGallery}
                />
                <label htmlFor="gallery-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Multiple images supported</p>
                </label>
              </div>
              {uploadingGallery && (
                <p className="text-sm text-gray-500 mt-2">Uploading...</p>
              )}
              {productForm.gallery_images && productForm.gallery_images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {productForm.gallery_images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Image Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Comparison - Before Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleComparisonUpload(e.target.files[0], 'comparison_before')
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  disabled={uploadingComparison === 'comparison_before'}
                />
                {uploadingComparison === 'comparison_before' && (
                  <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                )}
                <input
                  type="text"
                  value={productForm.comparison_before}
                  onChange={(e) => setProductForm({ ...productForm, comparison_before: e.target.value })}
                  placeholder="Or enter image URL"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-2"
                />
                {productForm.comparison_before && (
                  <div className="mt-2 relative inline-block">
                    <img 
                      src={productForm.comparison_before} 
                      alt="Before Preview" 
                      className="max-w-xs h-32 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeComparisonImage('comparison_before')}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Comparison - After Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleComparisonUpload(e.target.files[0], 'comparison_after')
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  disabled={uploadingComparison === 'comparison_after'}
                />
                {uploadingComparison === 'comparison_after' && (
                  <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                )}
                <input
                  type="text"
                  value={productForm.comparison_after}
                  onChange={(e) => setProductForm({ ...productForm, comparison_after: e.target.value })}
                  placeholder="Or enter image URL"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mt-2"
                />
                {productForm.comparison_after && (
                  <div className="mt-2 relative inline-block">
                    <img 
                      src={productForm.comparison_after} 
                      alt="After Preview" 
                      className="max-w-xs h-32 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeComparisonImage('comparison_after')}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Related Products */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Complementary Products (Recommended)</label>
              <p className="text-xs text-gray-500 mb-3">Select products that complement this product</p>
              
              {/* Category-based bulk selection */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select by Category (Bulk Selection)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const categoryProducts = allProducts.filter(p => {
                      const currentId = editingProduct?.id ? Number(editingProduct.id) : null
                      const prodId = Number(p.id)
                      return currentId !== prodId && 
                        (Number(p.category_id) === Number(cat.id))
                    })
                    
                    const relatedProducts = Array.isArray(productForm.related_products) ? productForm.related_products : []
                    
                    const allSelected = categoryProducts.length > 0 && 
                      categoryProducts.every(prod => {
                        const prodId = Number(prod.id)
                        return relatedProducts.some(rid => Number(rid) === prodId)
                      })
                    const someSelected = categoryProducts.some(prod => {
                      const prodId = Number(prod.id)
                      return relatedProducts.some(rid => Number(rid) === prodId)
                    })
                    
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          
                          if (categoryProducts.length === 0) return
                          
                          const categoryProductIds = categoryProducts.map(p => Number(p.id))
                          let newRelatedProducts = [...relatedProducts]
                          
                          if (allSelected) {
                            // Deselect all products in this category
                            newRelatedProducts = newRelatedProducts.filter(id => {
                              const numId = Number(id)
                              return !categoryProductIds.includes(numId)
                            })
                          } else {
                            // Select all products in this category
                            categoryProductIds.forEach(prodId => {
                              const exists = newRelatedProducts.some(rid => Number(rid) === prodId)
                              if (!exists) {
                                newRelatedProducts.push(prodId)
                              }
                            })
                          }
                          
                          setProductForm({
                            ...productForm,
                            related_products: newRelatedProducts
                          })
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          allSelected
                            ? 'bg-primary text-white'
                            : someSelected
                            ? 'bg-primary/50 text-primary border-2 border-primary'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                        title={`${categoryProducts.length} product(s) in this category`}
                      >
                        {cat.name} {categoryProducts.length > 0 && `(${categoryProducts.length})`}
                        {someSelected && !allSelected && ' *'}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click a category to select/deselect all products in that category
                </p>
              </div>
              
              {/* Individual product selection */}
              <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                {allProducts.filter(p => {
                  const currentId = editingProduct?.id ? Number(editingProduct.id) : null
                  const prodId = Number(p.id)
                  return currentId !== prodId
                }).map((prod) => {
                  const prodId = Number(prod.id)
                  const isSelected = productForm.related_products.some(rid => Number(rid) === prodId)
                  return (
                  <label key={prod.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                        checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProductForm({
                            ...productForm,
                              related_products: [...productForm.related_products, prodId]
                          })
                        } else {
                          setProductForm({
                            ...productForm,
                              related_products: productForm.related_products.filter(id => Number(id) !== prodId)
                          })
                        }
                      }}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">
                      {prod.name} - ${(parseFloat(prod.price) || 0).toFixed(2)}
                      {prod.category_name && (
                        <span className="text-xs text-gray-500 ml-2">({prod.category_name})</span>
                      )}
                    </span>
                  </label>
                  )
                })}
                {allProducts.filter(p => {
                  const currentId = editingProduct?.id ? Number(editingProduct.id) : null
                  const prodId = Number(p.id)
                  return currentId !== prodId
                }).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No other products available</p>
                )}
              </div>
              {productForm.related_products && productForm.related_products.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {productForm.related_products.length} product(s) selected
                </p>
              )}
            </div>

            {/* Gift Product */}
            <div className="relative">
              <label className="block text-gray-700 font-semibold mb-2">Gift Product (Hediye Ürün)</label>
              <p className="text-xs text-gray-500 mb-3">
                When this product is added to cart, the selected gift product will be automatically added for free.
              </p>
              
              {/* Selected Gift Product Display */}
              {productForm.gift_product_id && (() => {
                const selectedGiftProduct = allProducts.find(p => p.id == productForm.gift_product_id)
                return selectedGiftProduct ? (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{selectedGiftProduct.name}</p>
                      <p className="text-xs text-gray-600">
                        ${(parseFloat(selectedGiftProduct.price) || 0).toFixed(2)}
                        {selectedGiftProduct.category_name && ` • ${selectedGiftProduct.category_name}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProductForm({ ...productForm, gift_product_id: '' })
                        setGiftProductSearch('')
                        setShowGiftProductResults(false)
                      }}
                      className="ml-3 text-red-600 hover:text-red-800 transition-colors"
                      title="Remove gift product"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : null
              })()}
              
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={giftProductSearch}
                  onChange={(e) => {
                    const searchValue = e.target.value
                    setGiftProductSearch(searchValue)
                    
                    if (searchValue.trim()) {
                      const filtered = allProducts.filter(p => 
                        p.id !== editingProduct?.id &&
                        (p.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
                         p.sku?.toLowerCase().includes(searchValue.toLowerCase()) ||
                         p.id?.toString().includes(searchValue))
                      )
                      setGiftProductSearchResults(filtered.slice(0, 10)) // Limit to 10 results
                      setShowGiftProductResults(true)
                    } else {
                      setGiftProductSearchResults([])
                      setShowGiftProductResults(false)
                    }
                  }}
                  onFocus={() => {
                    if (giftProductSearch.trim() && giftProductSearchResults.length > 0) {
                      setShowGiftProductResults(true)
                    }
                  }}
                  placeholder={productForm.gift_product_id ? "Search to change gift product..." : "Search for gift product (name, SKU, or ID)..."}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <svg 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                
                {/* Search Results Dropdown */}
                {showGiftProductResults && giftProductSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {giftProductSearchResults.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          setProductForm({ ...productForm, gift_product_id: prod.id.toString() })
                          setGiftProductSearch('')
                          setShowGiftProductResults(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <p className="text-sm font-semibold text-gray-800">{prod.name}</p>
                        <p className="text-xs text-gray-600">
                          ${(parseFloat(prod.price) || 0).toFixed(2)}
                          {prod.category_name && ` • ${prod.category_name}`}
                          {prod.sku && ` • SKU: ${prod.sku}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                
                {showGiftProductResults && giftProductSearch.trim() && giftProductSearchResults.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                    No products found
                  </div>
                )}
              </div>
              
              {productForm.gift_product_id && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Gift product selected. It will be added automatically when this product is added to cart (price: $0.00)
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Technical Datasheet PDF</label>
                <div className="space-y-2">
                <input
                    ref={datasheetPdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                        handlePdfUpload(e.target.files[0], 'datasheet_pdf', datasheetPdfInputRef)
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  disabled={uploadingPdf === 'datasheet_pdf'}
                />
                  {uploadingPdf === 'datasheet_pdf' && (
                    <p className="text-sm text-blue-600 font-medium">Uploading PDF...</p>
                  )}
                  <input
                    type="text"
                    value={productForm.datasheet_pdf}
                    onChange={(e) => setProductForm({ ...productForm, datasheet_pdf: e.target.value })}
                    placeholder="Or enter PDF URL"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                {productForm.datasheet_pdf && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                      <a 
                        href={productForm.datasheet_pdf} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline text-sm font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      View Current PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove this PDF?')) {
                          setProductForm({ ...productForm, datasheet_pdf: '' })
                        }
                      }}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full p-1 transition-colors"
                      title="Remove PDF"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Product Brochure PDF</label>
                <div className="space-y-2">
                <input
                    ref={brochurePdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                        handlePdfUpload(e.target.files[0], 'brochure_pdf', brochurePdfInputRef)
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  disabled={uploadingPdf === 'brochure_pdf'}
                />
                  {uploadingPdf === 'brochure_pdf' && (
                    <p className="text-sm text-blue-600 font-medium">Uploading PDF...</p>
                  )}
                  <input
                    type="text"
                    value={productForm.brochure_pdf}
                    onChange={(e) => setProductForm({ ...productForm, brochure_pdf: e.target.value })}
                    placeholder="Or enter PDF URL"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                {productForm.brochure_pdf && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                      <a 
                        href={productForm.brochure_pdf} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline text-sm font-medium flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      View Current PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove this PDF?')) {
                          setProductForm({ ...productForm, brochure_pdf: '' })
                        }
                      }}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full p-1 transition-colors"
                      title="Remove PDF"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Catalog Mode */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Catalog Mode</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={productForm.catalog_mode === 'yes'}
                      onChange={(e) => setProductForm({ ...productForm, catalog_mode: e.target.checked ? 'yes' : 'no' })}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-gray-700 font-semibold">Enable Catalog Mode</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2 ml-8">
                    When enabled, customers will see a "Request Quote" button instead of "Add to Cart". 
                    All quote requests will be sent to info@tileandturf.com
                  </p>
                </div>
                <div className="mt-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={productForm.call_for_pricing}
                      onChange={(e) => setProductForm({ ...productForm, call_for_pricing: e.target.checked })}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-gray-700 font-semibold">Call For Pricing</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2 ml-8">
                    When enabled, customers will see "Call For Pricing" button instead of "Add to Cart". 
                    This is useful for products where pricing needs to be discussed over the phone.
                  </p>
                </div>
                <div className="mt-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={productForm.is_hidden}
                      onChange={(e) => setProductForm({ ...productForm, is_hidden: e.target.checked })}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-gray-700 font-semibold">Hide Product (Ürünü Gizle)</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2 ml-8">
                    When enabled, this product will be hidden from the store and frontend. 
                    It will not appear in product listings, categories, or search results.
                  </p>
                </div>
              </div>
            </div>

            {/* SEO Fields */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Meta Title
                    <span className="text-xs text-gray-500 ml-2">(Recommended: 50-60 characters)</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.meta_title}
                    onChange={(e) => setProductForm({ ...productForm, meta_title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="SEO optimized title for search engines"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(productForm.meta_title || '').length}/60 characters
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Meta Description
                    <span className="text-xs text-gray-500 ml-2">(Recommended: 150-160 characters)</span>
                  </label>
                  <textarea
                    value={productForm.meta_description}
                    onChange={(e) => setProductForm({ ...productForm, meta_description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    rows="3"
                    placeholder="Brief description for search engine results"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(productForm.meta_description || '').length}/160 characters
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Meta Keywords
                    <span className="text-xs text-gray-500 ml-2">(Comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.meta_keywords}
                    onChange={(e) => setProductForm({ ...productForm, meta_keywords: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate keywords with commas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProductForm(false)
                  setEditingProduct(null)
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product Sorting Modal */}
      {showSorting && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Product Sorting</h3>
            <button
              onClick={() => setShowSorting(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Sort Products For</label>
            <select
              value={sortingCategory}
              onChange={(e) => handleOpenSorting(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Products (Homepage / All Products Filter)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop products to reorder them. The order will be saved when you click "Save Order".
            </p>
            <p className="text-xs text-gray-500">
              Showing {sortingProducts.length} products for {sortingCategory === 'all' ? 'All Products' : categories.find(c => c.id == sortingCategory)?.name || 'Selected Category'}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            {sortingProducts.map((product, index) => (
              <div
                key={product.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center gap-4 p-4 border-b border-gray-200 cursor-move hover:bg-gray-50 ${
                  draggedItem === index ? 'opacity-50' : ''
                }`}
              >
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    {product.category_name ? `${product.category_name} • ` : ''}
                    ${(parseFloat(product.price) || 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Position: {index + 1}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSaveSorting}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Save Order
            </button>
            <button
              onClick={() => setShowSorting(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">SKU</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Price</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">PDFs</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{product.id}</td>
                <td className="px-6 py-4 text-sm">
                  {product.sku ? (
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{product.sku}</span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">No SKU</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-semibold">{product.name}</td>
                <td className="px-6 py-4 text-sm">
                  {product.category_name ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{product.category_name}</span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">No category</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">${(parseFloat(product.price) || 0).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">{product.stock || 0}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    {product.datasheet_pdf && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Datasheet</span>
                    )}
                    {product.brochure_pdf && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Brochure</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-primary hover:text-primary-dark font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
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
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No products found. Add your first product!
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Category Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Slug</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {editingCategory ? 'Update' : 'Add'} Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false)
                    setEditingCategory(null)
                    setCategoryForm({ name: '', slug: '', description: '' })
                  }}
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Categories</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{cat.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{cat.name}</td>
                  <td className="px-6 py-4 text-sm">{cat.slug}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat)
                          setCategoryForm({
                            name: cat.name || '',
                            slug: cat.slug || '',
                            description: cat.description || ''
                          })
                          setShowCategoryForm(true)
                        }}
                        className="text-primary hover:text-primary-dark font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
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
          {categories.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No categories found. Add your first category!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductsManagement

