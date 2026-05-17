import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useWhatsApp } from '../hooks/useWhatsApp'
import {
  SITE_ORIGIN,
  SITE_NAME,
  SITE_AUTHOR,
  SITE_PUBLISHER,
  DEFAULT_ROBOTS,
  GENERIC_KEYWORDS,
  GENERIC_DESCRIPTION,
} from '../config/siteSeo'
import { applyDocumentSeo } from '../utils/documentSeo'
import {
  getVariationOptionKey,
  getVariationOptionLabel,
  resolveVariationOptionEntry,
} from '../utils/variationOption'
import { PLACEHOLDER_IMAGE, productImageSrc } from '../utils/mediaUrl'
import ImageComparison from '../components/ImageComparison'
import ProductCard from '../components/ProductCard'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

// Custom Arrow Components for Related Products
const NextArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-2 md:p-3 shadow-lg border border-gray-200 transition-all hover:scale-110"
    aria-label="Next"
  >
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
)

const PrevArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-2 md:p-3 shadow-lg border border-gray-200 transition-all hover:scale-110"
    aria-label="Previous"
  >
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
)

const stripHtmlToPlain = (html) =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [showComparison, setShowComparison] = useState(true)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [variations, setVariations] = useState([])
  const [selectedVariations, setSelectedVariations] = useState({})
  const [variationPrices, setVariationPrices] = useState({})
  const [sqft, setSqft] = useState('')
  const [length, setLength] = useState(null)
  const [lengthInput, setLengthInput] = useState('')
  const [productDetailPromo, setProductDetailPromo] = useState(null)
  const [categoryPDFs, setCategoryPDFs] = useState({ datasheet_pdf: null, brochure_pdf: null })
  const { addToCart, addToCartSilently } = useCart()
  const { openWhatsApp } = useWhatsApp()

  useEffect(() => {
    fetchProduct()
    fetchProductDetailPromo()
  }, [slug])

  useEffect(() => {
    if (!product || loading) return
    const slugOrId =
      product.slug && String(product.slug).trim() !== ''
        ? product.slug
        : product.id
    const pathSegment = encodeURIComponent(String(slugOrId))
    const origin = SITE_ORIGIN.replace(/\/$/, '')
    const canonicalUrl = `${origin}/product/${pathSegment}`
    const title =
      (product.meta_title && String(product.meta_title).trim()) ||
      `${product.name} | ${SITE_NAME}`
    let description =
      (product.meta_description && String(product.meta_description).trim()) ||
      stripHtmlToPlain(product.description)
    if (description.length > 165) {
      description = `${description.slice(0, 162)}...`
    }
    if (!description) description = GENERIC_DESCRIPTION
    const keywords =
      (product.meta_keywords && String(product.meta_keywords).trim()) ||
      GENERIC_KEYWORDS
    applyDocumentSeo({
      title,
      description,
      keywords,
      canonicalUrl,
      robots: DEFAULT_ROBOTS,
      author: SITE_AUTHOR,
      publisher: SITE_PUBLISHER,
    })
  }, [product, loading])

  const fetchProductDetailPromo = async () => {
    try {
      // Fetch all settings at once
      const response = await axios.get('/api/admin/settings.php')
      const settings = response.data || {}
      
      const content = settings.product_detail_promo_content || ''
      const status = settings.product_detail_promo_status || 'inactive'
      const isActive = status === 'active' || status === '1'
      
      if (isActive && content) {
        setProductDetailPromo(content)
      } else {
        setProductDetailPromo(null)
      }
    } catch (error) {
      // If settings don't exist, just don't show the promo
      setProductDetailPromo(null)
    }
  }

  const fetchProduct = async () => {
    if (!slug) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Try to fetch by slug first, fallback to id if slug is numeric
      const isNumeric = /^\d+$/.test(slug)
      // Decode slug if it's encoded (React Router may have already decoded it)
      let decodedSlug = slug
      try {
        decodedSlug = decodeURIComponent(slug)
      } catch (e) {
        // If already decoded, use as is
        decodedSlug = slug
      }
      const apiUrl = isNumeric 
        ? `/api/products.php?id=${slug}`
        : `/api/products.php?slug=${encodeURIComponent(decodedSlug)}`
      
      const response = await axios.get(apiUrl)
      let productData = response.data
      
      // Handle case where API returns array instead of single object
      if (Array.isArray(productData) && productData.length > 0) {
        productData = productData[0]
      }
      
      // Check if product was found
      if (!productData || productData === null || (typeof productData === 'object' && Object.keys(productData).length === 0)) {
        console.error('Product not found', { apiUrl, productData })
        setLoading(false)
        navigate('/products', { replace: true })
        return
      }
      
      console.log('Product loaded:', productData)
      
      // Debug: Check package pricing info
      if (productData) {
        console.log('📦 Package Pricing Info:', {
          is_packaged: productData.is_packaged,
          pack_size: productData.pack_size,
          show_unit_price: productData.show_unit_price,
          pcs_per_box: productData.pcs_per_box,
          price: productData.price,
          'is_packaged type': typeof productData.is_packaged,
          'pack_size type': typeof productData.pack_size
        })
      }
      
      // Redirect to slug URL if we got product by id and it has a slug
      if (productData && isNumeric && productData.slug && productData.slug.trim() !== '') {
        const newUrl = `/product/${encodeURIComponent(productData.slug)}`
        if (window.location.pathname !== newUrl) {
          window.history.replaceState({}, '', newUrl)
        }
      }
      setProduct(productData)
      // Reset length and sqft inputs when product changes
      setLength(null)
      setLengthInput('')
      setSqft('')
      
      // Fetch category PDFs if product has category
      if (productData.category_id) {
        try {
          const categoryResponse = await axios.get(`/api/categories.php`)
          const categories = Array.isArray(categoryResponse.data) ? categoryResponse.data : []
          const category = categories.find(cat => cat.id == productData.category_id || cat.id === parseInt(productData.category_id))
          if (category) {
            setCategoryPDFs({
              datasheet_pdf: category.datasheet_pdf || null,
              brochure_pdf: category.brochure_pdf || null
            })
          } else {
            setCategoryPDFs({ datasheet_pdf: null, brochure_pdf: null })
          }
        } catch (error) {
          console.error('Error fetching category PDFs:', error)
          setCategoryPDFs({ datasheet_pdf: null, brochure_pdf: null })
        }
      } else {
        setCategoryPDFs({ datasheet_pdf: null, brochure_pdf: null })
      }
      
      // Parse variations
      if (productData.variations) {
        try {
          const variationsData = typeof productData.variations === 'string' 
            ? JSON.parse(productData.variations) 
            : productData.variations
          
          if (variationsData && Object.keys(variationsData).length > 0) {
            // Fetch variation details
            const variationIds = Object.keys(variationsData).map(id => parseInt(id))
            const variationPromises = variationIds.map(variationId => 
              axios.get(`/api/admin/variations.php?id=${variationId}`).catch(() => null)
            )
            const variationResults = await Promise.all(variationPromises)
            const allVariations = variationResults
              .filter(result => result && result.data)
              .map(result => result.data)
            
            // Filter variations: only show variations that have at least one option with price set
            const validVariations = allVariations.filter(variation => {
              const variationId = variation.id
              const variationOptions = variationsData[variationId] || {}
              
              // Check if at least one option has a price set
              const hasPriceSetOption = Object.keys(variationOptions).some(option => {
                const optionData = variationOptions[option]
                return optionData && optionData.price !== null && optionData.price !== undefined && optionData.price !== ''
              })
              
              return hasPriceSetOption
            })
            
            setVariations(validVariations)
            
            // Initialize with empty selections - user must select variations manually
            setSelectedVariations({})
            setVariationPrices({})
          }
        } catch (e) {
          console.error('Error parsing variations:', e)
          setVariations([])
        }
      }
      
      // Parse gallery images
      if (productData.gallery_images) {
        try {
          const gallery = typeof productData.gallery_images === 'string' 
            ? JSON.parse(productData.gallery_images) 
            : productData.gallery_images
          setGalleryImages(Array.isArray(gallery) ? gallery : [])
        } catch (e) {
          setGalleryImages([])
        }
      } else {
        setGalleryImages([])
      }
      
      // Set initial selected image
      setSelectedImage(productData.image || '/slider.webp')
      
      // Fetch related products
      if (productData.related_products) {
        try {
          const relatedIds = typeof productData.related_products === 'string' 
            ? JSON.parse(productData.related_products) 
            : productData.related_products
          
          if (Array.isArray(relatedIds) && relatedIds.length > 0) {
            const relatedPromises = relatedIds.map(relatedId => 
              axios.get(`/api/products.php?id=${relatedId}`).catch(() => null)
            )
            const relatedResults = await Promise.all(relatedPromises)
            const validProducts = relatedResults
              .filter(result => result && result.data)
              .map(result => result.data)
            setRelatedProducts(validProducts)
          }
        } catch (e) {
          console.error('Error parsing related products:', e)
          setRelatedProducts([])
        }
      }
      
      // Set loading to false after all data is loaded
      setLoading(false)
    } catch (error) {
      console.error('Error fetching product:', error)
      setLoading(false)
      // If product not found or error, redirect to products page
      if (error.response && (error.response.status === 404 || error.response.status === 400)) {
        navigate('/products', { replace: true })
      } else {
        // For other errors, still set loading to false
        setProduct(null)
        setLoading(false)
      }
    }
  }

  const calculateFinalPrice = () => {
    // If variations are selected, use only variation prices (don't add base price)
    const hasSelectedVariations = Object.keys(selectedVariations).length > 0
    
    if (hasSelectedVariations) {
      // Use variation prices only, not base price
      let totalVariationPrice = 0
      Object.keys(selectedVariations).forEach(variationId => {
        const price = variationPrices[variationId]
        if (price) {
          totalVariationPrice += parseFloat(price)
        }
      })
      // If we have variation prices, use them; otherwise use base price as fallback
      return totalVariationPrice > 0 ? totalVariationPrice : (parseFloat(product?.price) || 0)
    }
    
    // No variations selected, use base price
    return parseFloat(product?.price) || 0
  }

  const isVariationSelectionComplete = () => {
    if (variations.length === 0) return true // No variations required
    
    // Check if at least one variation has a selection
    return Object.keys(selectedVariations).length > 0 && 
           variations.some(variation => selectedVariations[variation.id])
  }

  const handleAddToCart = () => {
    if (!isVariationSelectionComplete()) {
      alert('Please select at least one variation before adding to cart.')
      return
    }
    
    // Check if sqft or length is enabled (handle both boolean and integer 0/1 from database)
    const isSqftEnabled = product.sqft_enabled == 1 || product.sqft_enabled === true
    const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true
    
    // Validate sqft or length if enabled
    if (isSqftEnabled && (sqft === '' || sqft === null || isNaN(sqft) || sqft <= 0)) {
      alert('Please enter a valid square feet value.')
      return
    }
    
    if (isLengthEnabled && (!length || length === null || length === '' || length <= 0)) {
      alert('Please enter a valid length value.')
      return
    }
    
    let finalPrice = calculateFinalPrice()
    
    // Calculate price based on sqft if enabled
    if (isSqftEnabled && sqft !== '' && !isNaN(sqft) && sqft > 0) {
      // If variation is selected, use variation price; otherwise use base sqft_price
      const hasSelectedVariations = Object.keys(selectedVariations).length > 0
      let pricePerSqft = parseFloat(product.sqft_price) || 0
      
      if (hasSelectedVariations && Object.keys(variationPrices).length > 0) {
        // Use variation price as price per sqft
        // Sum all variation prices (in case multiple variations selected)
        let totalVariationPrice = 0
        Object.keys(selectedVariations).forEach(variationId => {
          const price = variationPrices[variationId]
          if (price) {
            totalVariationPrice += parseFloat(price)
          }
        })
        if (totalVariationPrice > 0) {
          pricePerSqft = totalVariationPrice
        }
      }
      
      finalPrice = parseFloat(sqft) * pricePerSqft
    }
    
    // Calculate price based on length if enabled
    // Formula: base_price + ((length - 1) * increment_price)
    // 1 length = base_price, 2 length = base_price + increment, etc.
    if (isLengthEnabled && product.length_base_price && product.length_increment_price) {
      finalPrice = parseFloat(product.length_base_price) + ((length - 1) * parseFloat(product.length_increment_price))
    }
    
    // For packaged products: use package price directly from database
    // Don't use variation prices - just use the package price as is
    const isPackaged = product.is_packaged == 1 || product.is_packaged === true
    let priceForCart = finalPrice
    
    // For packaged products, always use package price (product.price) directly
    // This is the package price stored in database (admin panel "Price" field)
    if (isPackaged) {
      priceForCart = parseFloat(product.price) || 0
    }
    
    const productWithVariations = {
      ...product,
      price: priceForCart,
      selectedVariations: selectedVariations,
      variationPrices: variationPrices,
      sqft: isSqftEnabled ? sqft : null,
      length: isLengthEnabled ? length : null,
      quantity: isSqftEnabled || isLengthEnabled ? 1 : quantity
    }
    
    // If sqft or length enabled, add once with the calculated values
    // Otherwise, add multiple times based on quantity
    if (isSqftEnabled || isLengthEnabled) {
      addToCart(productWithVariations)
    } else {
      for (let i = 0; i < quantity; i++) {
        addToCart(productWithVariations)
      }
    }
  }

  const handleWhatsApp = () => {
    const message = `Hello, I'm interested in ${product?.name}. Product ID: ${product?.id}`
    openWhatsApp(message)
  }

  const handleQuickOrder = () => {
    // Add to cart without opening the sidebar
    if (!isVariationSelectionComplete()) {
      alert('Please select at least one variation before proceeding to checkout.')
      return
    }
    
    // Validate sqft or length if enabled
    const isSqftEnabled = product.sqft_enabled == 1 || product.sqft_enabled === true
    const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true
    
    if (isSqftEnabled && (sqft === '' || sqft === null || isNaN(sqft) || sqft <= 0)) {
      alert('Please enter a valid square feet value.')
      return
    }
    
    if (isLengthEnabled && (!length || length === null || length === '' || length <= 0)) {
      alert('Please enter a valid length value.')
      return
    }
    
    let finalPrice = calculateFinalPrice()
    
    // Calculate price based on sqft if enabled
    if (isSqftEnabled && sqft !== '' && !isNaN(sqft) && sqft > 0) {
      // If variation is selected, use variation price; otherwise use base sqft_price
      const hasSelectedVariations = Object.keys(selectedVariations).length > 0
      let pricePerSqft = parseFloat(product.sqft_price) || 0
      
      if (hasSelectedVariations && Object.keys(variationPrices).length > 0) {
        // Use variation price as price per sqft
        // Sum all variation prices (in case multiple variations selected)
        let totalVariationPrice = 0
        Object.keys(selectedVariations).forEach(variationId => {
          const price = variationPrices[variationId]
          if (price) {
            totalVariationPrice += parseFloat(price)
          }
        })
        if (totalVariationPrice > 0) {
          pricePerSqft = totalVariationPrice
        }
      }
      
      finalPrice = parseFloat(sqft) * pricePerSqft
    }
    
    // Calculate price based on length if enabled
    // Formula: base_price + ((length - 1) * increment_price)
    // 1 length = base_price, 2 length = base_price + increment, etc.
    if (isLengthEnabled && product.length_base_price && product.length_increment_price) {
      finalPrice = parseFloat(product.length_base_price) + ((length - 1) * parseFloat(product.length_increment_price))
    }
    
    // For packaged products: use package price directly from database
    // Don't use variation prices - just use the package price as is
    const isPackaged = product.is_packaged == 1 || product.is_packaged === true
    let priceForCart = finalPrice
    
    // For packaged products, always use package price (product.price) directly
    // This is the package price stored in database (admin panel "Price" field)
    if (isPackaged) {
      priceForCart = parseFloat(product.price) || 0
    }
    
    const productWithVariations = {
      ...product,
      price: priceForCart,
      selectedVariations: selectedVariations,
      variationPrices: variationPrices,
      sqft: isSqftEnabled ? sqft : null,
      length: isLengthEnabled ? length : null,
      quantity: isSqftEnabled || isLengthEnabled ? 1 : quantity
    }
    
    // Add to cart silently (without opening sidebar)
    if (isSqftEnabled || isLengthEnabled) {
      // Use a custom add function that doesn't open cart
      const { addToCartSilently } = useCart()
      if (addToCartSilently) {
        addToCartSilently(productWithVariations)
      } else {
        addToCart(productWithVariations)
      }
    } else {
      for (let i = 0; i < quantity; i++) {
        const { addToCartSilently } = useCart()
        if (addToCartSilently) {
          addToCartSilently(productWithVariations)
        } else {
          addToCart(productWithVariations)
        }
      }
    }
    
    // Navigate to checkout without opening cart sidebar
    navigate('/checkout')
  }

  const handleDownloadDatasheet = () => {
    // Priority: product PDF > category PDF
    const pdfUrl = product?.datasheet_pdf || categoryPDFs.datasheet_pdf
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    } else {
      alert('Technical datasheet not available for this product.')
    }
  }

  const handleDownloadBrochure = () => {
    // Priority: product PDF > category PDF
    const pdfUrl = product?.brochure_pdf || categoryPDFs.brochure_pdf
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    } else {
      alert('Product brochure not available for this product.')
    }
  }

  const handleWhatsAppShare = () => {
    const productUrl = product?.slug ? `/product/${product.slug}` : `/product/${product?.id}`
    const message = `Check out this product: ${product?.name} - ${window.location.origin}${productUrl}`
    openWhatsApp(message)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if PDFs are available (product or category) - must be after loading check
  const hasDatasheet = product?.datasheet_pdf || categoryPDFs.datasheet_pdf
  const hasBrochure = product?.brochure_pdf || categoryPDFs.brochure_pdf

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 text-lg">Product not found.</p>
        <Link to="/products" className="text-primary hover:underline mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          {/* Main Image or Comparison */}
          {product.comparison_before && product.comparison_after && showComparison ? (
            <div className="mb-6">
              <div className="relative">
                <ImageComparison 
                  beforeImage={product.comparison_before} 
                  afterImage={product.comparison_after}
                  alt={product.name}
                />
                <button
                  onClick={() => setShowComparison(false)}
                  className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-colors z-10"
                >
                  View Gallery
                </button>
              </div>
              {/* Product Detail Promo Banner - Mobile Only */}
              {productDetailPromo && (
                <div className="lg:hidden mt-0 bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 py-3 px-4">
                  <div 
                    className="text-sm font-semibold text-gray-800 text-center"
                    dangerouslySetInnerHTML={{ __html: productDetailPromo }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <img
                src={productImageSrc(selectedImage || product.image)}
                alt={product.name}
                className="w-full h-auto rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMAGE
                }}
              />
              {/* Product Detail Promo Banner - Mobile Only */}
              {productDetailPromo && (
                <div className="lg:hidden mt-0 bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 py-3 px-4">
                  <div 
                    className="text-sm font-semibold text-gray-800 text-center"
                    dangerouslySetInnerHTML={{ __html: productDetailPromo }}
                  />
                </div>
              )}
              {product.comparison_before && product.comparison_after && (
                <button
                  onClick={() => setShowComparison(true)}
                  className="mt-2 w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  View Before/After Comparison
                </button>
              )}
            </div>
          )}

          {/* Gallery Images */}
          {(galleryImages.length > 0 || product.image) && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Gallery</h3>
              <div className="grid grid-cols-4 gap-2">
                {product.image && (
                  <button
                    onClick={() => {
                      setSelectedImage(product.image)
                      setShowComparison(false)
                    }}
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === product.image && !showComparison ? 'border-primary ring-2 ring-primary' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                )}
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(img)
                      setShowComparison(false)
                    }}
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === img && !showComparison ? 'border-primary ring-2 ring-primary' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - Gallery ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>
          {!(product.call_for_pricing == 1 || product.call_for_pricing === true) && (
            <p className="text-3xl font-bold text-primary mb-6">
              {(() => {
                const isPackaged = product.is_packaged == 1 || product.is_packaged === true
                const isSqftEnabled = product.sqft_enabled == 1 || product.sqft_enabled === true
                const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true
                const finalPrice = calculateFinalPrice()
                const hasVariations = Object.keys(selectedVariations).length > 0
                
                // Sqft pricing display
                if (isSqftEnabled && product.sqft_price) {
                let pricePerSqft = parseFloat(product.sqft_price) || 0
                
                if (hasVariations && Object.keys(variationPrices).length > 0) {
                  let totalVariationPrice = 0
                  Object.keys(selectedVariations).forEach(variationId => {
                    const price = variationPrices[variationId]
                    if (price) {
                      totalVariationPrice += parseFloat(price)
                    }
                  })
                  if (totalVariationPrice > 0) {
                    pricePerSqft = totalVariationPrice
                  }
                }
                
                return (
                  <>
                    ${pricePerSqft.toFixed(2)}
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      /per sqft
                    </span>
                  </>
                )
              }
              
              // Length pricing display
              if (isLengthEnabled && product.length_base_price) {
                let pricePerLength = parseFloat(product.length_base_price) || 0
                
                // If variation is selected, use variation price as base price
                if (hasVariations && Object.keys(variationPrices).length > 0) {
                  let totalVariationPrice = 0
                  Object.keys(selectedVariations).forEach(variationId => {
                    const price = variationPrices[variationId]
                    if (price) {
                      totalVariationPrice += parseFloat(price)
                    }
                  })
                  if (totalVariationPrice > 0) {
                    pricePerLength = totalVariationPrice
                  }
                }
                
                return (
                  <>
                    ${pricePerLength.toFixed(2)}
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      /length
                    </span>
                  </>
                )
              }
              
              // Package pricing display
              if (isPackaged && product.pack_size) {
                const showUnitPrice = product.show_unit_price == 1 || product.show_unit_price === true
                
                // Use package price from database directly (admin panel "Price" field)
                // Don't use variation prices for display
                const packagePrice = parseFloat(product.price) || 0
                
                // Priority: pcs_per_box > pack_size > 1
                // pcs_per_box = kutudaki adet sayısı (doğru değer, öncelikli)
                // pack_size = paket içindeki birim sayısı (fallback)
                let piecesInBox
                if (product.pcs_per_box != null && product.pcs_per_box !== '' && product.pcs_per_box !== 0) {
                  piecesInBox = parseFloat(product.pcs_per_box)
                } else if (product.pack_size != null && product.pack_size !== '' && product.pack_size !== 0) {
                  piecesInBox = parseFloat(product.pack_size)
                } else {
                  piecesInBox = 1
                }
                
                // Calculate unit price: package price / pieces in box
                const unitPrice = packagePrice / piecesInBox
                
                // Debug: Check values
                if (showUnitPrice) {
                  console.log('📦 Product Detail - Package Pricing:', product.name, {
                    packagePrice,
                    piecesInBox,
                    unitPrice: unitPrice.toFixed(2),
                    pcs_per_box: product.pcs_per_box,
                    pack_size: product.pack_size,
                    'Calculation': `${packagePrice} / ${piecesInBox} = ${unitPrice.toFixed(2)}`
                  })
                }
                
                // If show_unit_price is true, show unit price "$X.XX/pcs Sold per box (X pcs per box)" format
                if (showUnitPrice) {
                  const pcsPerBox = (product.pcs_per_box != null && product.pcs_per_box !== '' && product.pcs_per_box !== 0) ? ` (${product.pcs_per_box} pcs per box)` : ''
                  return (
                    <>
                      ${unitPrice.toFixed(2)}
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        /pcs Sold per box{pcsPerBox}
                      </span>
                    </>
                  )
                }
                
                // Otherwise show package price
                return <>${packagePrice.toFixed(2)}</>
              }
              
              // Per piece (adet) pricing display - if show_unit_price is true but not packaged
              const showUnitPriceForPiece = product.show_unit_price == 1 || product.show_unit_price === true
              if (!isPackaged && showUnitPriceForPiece) {
                return (
                  <>
                    ${finalPrice.toFixed(2)}
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      /pcs
                    </span>
                  </>
                )
              }
              
              // Regular price display
              return <>${finalPrice.toFixed(2)}</>
            })()}
            </p>
          )}
          
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              {product.description || 'Premium quality product designed for durability and performance.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            {hasDatasheet && (
              <button
                onClick={handleDownloadDatasheet}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Technical Datasheet</span>
                {!product?.datasheet_pdf && categoryPDFs.datasheet_pdf && (
                  <span className="text-xs text-gray-500">(Category)</span>
                )}
              </button>
            )}
            
            {hasBrochure && (
              <button
                onClick={handleDownloadBrochure}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Product Brochure</span>
                {!product?.brochure_pdf && categoryPDFs.brochure_pdf && (
                  <span className="text-xs text-gray-500">(Category)</span>
                )}
              </button>
            )}
            
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-semibold transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>Share on WhatsApp</span>
            </button>
          </div>

          {/* Variations */}
          {variations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Select Variations *</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {variations.map((variation) => {
                  const variationId = variation.id
                  const selectedOption = selectedVariations[variationId]
                  const productVariations = product.variations ? (typeof product.variations === 'string' ? JSON.parse(product.variations) : product.variations) : {}
                  const variationOptions = productVariations[variationId] || {}
                  
                  const selectedPrice = variationPrices[variationId] || 0
                  
                  return (
                    <div key={variation.id} className={`border-2 rounded-lg p-3 transition-colors ${
                      selectedOption ? 'border-primary bg-primary/5' : 'border-red-300 bg-red-50'
                    }`}>
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-gray-700 font-semibold text-sm">
                            {variation.name} <span className="text-red-500">*</span>
                          </label>
                          {selectedOption && selectedPrice > 0 ? (
                            <span className="text-xs font-semibold text-primary">
                              +${selectedPrice.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-500 font-medium">
                              Required
                            </span>
                          )}
                        </div>
                        {variation.type && (
                          <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px]">
                            {variation.type}
                          </span>
                        )}
                      </div>
                      {/* Filter options: only show options that have price set */}
                      {(() => {
                        const availableOptions = Array.isArray(variation.options)
                          ? variation.options
                              .map((option) => resolveVariationOptionEntry(variationOptions, option))
                              .filter(
                                ({ data }) =>
                                  data &&
                                  data.price !== null &&
                                  data.price !== undefined &&
                                  data.price !== ''
                              )
                          : []
                        
                        // Show selectbox if more than 7 options, otherwise show buttons
                        return availableOptions.length > 7 ? (
                        <select
                          value={selectedOption || ''}
                          onChange={(e) => {
                            const option = e.target.value
                            // If empty option is selected, deselect the variation
                            if (!option || option === '') {
                              const newVariations = { ...selectedVariations }
                              delete newVariations[variationId]
                              setSelectedVariations(newVariations)
                              
                              const newPrices = { ...variationPrices }
                              delete newPrices[variationId]
                              setVariationPrices(newPrices)
                            } else {
                              // Select this option (only one option per variation type)
                              setSelectedVariations({
                                ...selectedVariations,
                                [variationId]: option
                              })
                              const optionData = variationOptions[option] || {}
                              const optionPrice = optionData.price || 0
                              if (optionPrice) {
                                setVariationPrices({
                                  ...variationPrices,
                                  [variationId]: optionPrice
                                })
                              } else {
                                const newPrices = { ...variationPrices }
                                delete newPrices[variationId]
                                setVariationPrices(newPrices)
                              }
                            }
                          }}
                          className={`w-full border-2 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 ${
                            selectedOption 
                              ? 'border-primary focus:border-primary focus:ring-primary text-gray-800' 
                              : 'border-red-300 focus:border-red-500 focus:ring-red-500 text-gray-800'
                          }`}
                        >
                          <option value="">Select {variation.name}</option>
                          {availableOptions.map(({ key, label, data }, idx) => {
                            const optionPrice = data.price || 0
                            return (
                              <option key={idx} value={key}>
                                {data.value || label}{' '}
                                {optionPrice > 0 ? `(+$${parseFloat(optionPrice).toFixed(2)})` : ''}
                              </option>
                            )
                          })}
                        </select>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableOptions.map(({ key, label, data }, idx) => {
                            const optionPrice = data.price || 0
                            const isSelected = selectedOption === key
                            
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  // Toggle: If same option is selected, deselect it
                                  if (isSelected) {
                                    const newVariations = { ...selectedVariations }
                                    delete newVariations[variationId]
                                    setSelectedVariations(newVariations)
                                    
                                    const newPrices = { ...variationPrices }
                                    delete newPrices[variationId]
                                    setVariationPrices(newPrices)
                                  } else {
                                    // Select this option (only one option per variation type)
                                    setSelectedVariations({
                                      ...selectedVariations,
                                      [variationId]: key
                                    })
                                    if (optionPrice) {
                                      setVariationPrices({
                                        ...variationPrices,
                                        [variationId]: optionPrice
                                      })
                                    } else {
                                      const newPrices = { ...variationPrices }
                                      delete newPrices[variationId]
                                      setVariationPrices(newPrices)
                                    }
                                  }
                                }}
                                className={`px-2 py-1.5 rounded-lg border-2 transition-all text-xs font-medium text-center ${
                                  isSelected
                                    ? 'border-primary bg-primary text-white shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex flex-col items-center">
                                  <span className="leading-tight">{data.value || label}</span>
                                  {optionPrice > 0 && (
                                    <span className="text-[10px] opacity-90 mt-0.5">
                                      (+${parseFloat(optionPrice).toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )
                      })()}
                      {selectedOption && (
                        <p className="text-[10px] text-gray-500 mt-1.5">
                          Selected: <span className="font-semibold text-gray-800">{selectedOption}</span>
                          {selectedPrice > 0 && (
                            <span className="ml-1 text-primary font-semibold">+${selectedPrice.toFixed(2)}</span>
                          )}
                        </p>
                      )}
                      {!selectedOption && (
                        <p className="text-[10px] text-red-600 mt-1.5">Please select</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sqft Input - Only show if sqft_enabled */}
          {(product.sqft_enabled == 1 || product.sqft_enabled === true) && (
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Square Feet (Sqft) *
              </label>
              <input
                type="number"
                value={sqft}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                  setSqft(value === '' || isNaN(value) ? '' : (value > 0 ? value : ''));
                }}
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 font-semibold"
                placeholder="Enter sqft"
              />
              {product.sqft_price && sqft !== '' && !isNaN(sqft) && sqft > 0 && (() => {
                const hasSelectedVariations = Object.keys(selectedVariations).length > 0
                let pricePerSqft = parseFloat(product.sqft_price) || 0
                
                if (hasSelectedVariations && Object.keys(variationPrices).length > 0) {
                  // Use variation price as price per sqft
                  let totalVariationPrice = 0
                  Object.keys(selectedVariations).forEach(variationId => {
                    const price = variationPrices[variationId]
                    if (price) {
                      totalVariationPrice += parseFloat(price)
                    }
                  })
                  if (totalVariationPrice > 0) {
                    pricePerSqft = totalVariationPrice
                  }
                }
                
                const totalPrice = parseFloat(sqft) * pricePerSqft
                
                return (
                  <p className="text-sm text-gray-600 mt-1">
                    Price per sqft: ${pricePerSqft.toFixed(2)} | Total: ${totalPrice.toFixed(2)}
                  </p>
                )
              })()}
            </div>
          )}

          {/* Length Input - Only show if length_enabled */}
          {(product.length_enabled == 1 || product.length_enabled === true) && (
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Length *
              </label>
              <input
                type="number"
                value={lengthInput}
                onChange={(e) => {
                  const value = e.target.value
                  setLengthInput(value)
                  // Update length state only if valid number
                  const numValue = parseInt(value)
                  if (value !== '' && !isNaN(numValue) && numValue >= 1) {
                    setLength(numValue)
                  } else {
                    setLength(null)
                  }
                }}
                onBlur={(e) => {
                  // If empty or invalid on blur, keep it empty (don't set default)
                  const numValue = parseInt(e.target.value)
                  if (e.target.value === '' || isNaN(numValue) || numValue < 1) {
                    setLengthInput('')
                    setLength(null)
                  } else {
                    setLengthInput(e.target.value)
                    setLength(numValue)
                  }
                }}
                min="1"
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 font-semibold"
                placeholder="Enter length"
              />
              {product.length_base_price && product.length_increment_price && length && (
                <p className="text-sm text-gray-600 mt-1">
                  Base: ${parseFloat(product.length_base_price).toFixed(2)} | Increment: ${parseFloat(product.length_increment_price).toFixed(2)} per unit | Total: ${(parseFloat(product.length_base_price) + ((length - 1) * parseFloat(product.length_increment_price))).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Quantity - Only show if neither sqft nor length is enabled */}
          {!(product.sqft_enabled == 1 || product.sqft_enabled === true) && !(product.length_enabled == 1 || product.length_enabled === true) && (
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Quantity:</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center border border-gray-300 rounded-lg px-4 py-2 font-semibold"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {product.call_for_pricing == 1 || product.call_for_pricing === true ? (
              <button
                onClick={handleWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Call For Pricing</span>
              </button>
            ) : product.catalog_mode === 'yes' ? (
              <button
                onClick={() => navigate('/request-quote', { state: { product } })}
                className="w-full bg-primary hover:bg-primary-dark text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Request Quote
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={!isVariationSelectionComplete()}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 transform ${
                  isVariationSelectionComplete()
                    ? 'bg-primary hover:bg-primary-dark text-white hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isVariationSelectionComplete() ? 'Add to Cart' : 'Please Select at Least One Variation'}
              </button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>WhatsApp Support</span>
              </button>

              <button
                onClick={handleQuickOrder}
                disabled={!isVariationSelectionComplete()}
                className={`py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isVariationSelectionComplete()
                    ? 'bg-primary-dark hover:bg-gray-900 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Quick Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Complementary Products</h2>
          {relatedProducts.length > 4 ? (
            <div className="relative px-10 md:px-12">
              <Slider
                dots={false}
                arrows={true}
                infinite={true}
                speed={500}
                slidesToShow={4}
                slidesToScroll={1}
                autoplay={true}
                autoplaySpeed={3000}
                nextArrow={<NextArrow />}
                prevArrow={<PrevArrow />}
                swipeToSlide={true}
                touchThreshold={10}
                preventDefaultTouchmoveEvent={false}
                responsive={[
                  {
                    breakpoint: 1024,
                    settings: {
                      slidesToShow: 3,
                      slidesToScroll: 1,
                      arrows: true,
                      swipeToSlide: true,
                      touchThreshold: 10,
                      preventDefaultTouchmoveEvent: false,
                    }
                  },
                  {
                    breakpoint: 768,
                    settings: {
                      slidesToShow: 2,
                      slidesToScroll: 1,
                      arrows: true,
                      swipeToSlide: true,
                      touchThreshold: 10,
                      preventDefaultTouchmoveEvent: false,
                    }
                  },
                  {
                    breakpoint: 640,
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      arrows: true,
                      swipeToSlide: true,
                      touchThreshold: 10,
                      preventDefaultTouchmoveEvent: false,
                    }
                  }
                ]}
              >
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="px-2" onClick={(e) => e.stopPropagation()}>
                    <ProductCard product={relatedProduct} />
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductDetail
