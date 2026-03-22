import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useSettings } from '../context/SettingsContext'
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

const getOptionKey = (option) =>
  typeof option === 'string' ? option : (option?.label ?? '')
const getOptionLabel = (option) =>
  typeof option === 'string' ? option : (option?.label ?? '')
const getOptionSizeLabels = (option) =>
  typeof option === 'object' && option !== null && Array.isArray(option.sizes)
    ? option.sizes.filter((s) => typeof s === 'string' && s.trim() !== '')
    : []

/** Only one color for the product: clear every color-type slot, then set primary → key */
const applySingleColorChoice = (prev, key, colorVariationIds, primaryId) => {
  const next = { ...prev }
  for (const cid of colorVariationIds) {
    delete next[cid]
  }
  next[primaryId] = key
  return next
}

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
  /** Dimension for selected color when 2+ sizes (e.g. 24x24, 24x48) */
  const [selectedSize, setSelectedSize] = useState('')
  const [productVariations, setProductVariations] = useState([])
  const [selectedProductVariation, setSelectedProductVariation] = useState(null)
  const [sqft, setSqft] = useState('')
  const [length, setLength] = useState(null)
  const [lengthInput, setLengthInput] = useState('')
  const [productDetailPromo, setProductDetailPromo] = useState(null)
  const [categoryPDFs, setCategoryPDFs] = useState({ datasheet_pdf: null, brochure_pdf: null })
  const [variationLibraryLoading, setVariationLibraryLoading] = useState(false)
  const productFetchGen = useRef(0)
  const { addToCart, addToCartSilently } = useCart()
  const { catalogMode, whatsappNumber, phoneNumber } = useSettings()

  useEffect(() => {
    fetchProduct()
    fetchProductDetailPromo()
  }, [slug])

  const selectedColorRoomScene = useMemo(() => {
    if (!product || !variations.length) return null
    const cv = variations.find((v) => v.type === 'color')
    if (!cv) return null
    const key = selectedVariations[cv.id]
    if (!key) return null
    const opts = Array.isArray(cv.options) ? cv.options : []
    const opt = opts.find((o) => String(getOptionKey(o)) === String(key))
    if (opt && typeof opt === 'object' && opt.roomScene) return opt.roomScene
    return null
  }, [product, variations, selectedVariations])

  useEffect(() => {
    if (!product) return
    const cv = variations.find((v) => v.type === 'color')
    if (!cv) return
    const key = selectedVariations[cv.id]
    if (!key) {
      setSelectedImage(product.image || '/slider.webp')
      return
    }
    const opts = Array.isArray(cv.options) ? cv.options : []
    const opt = opts.find((o) => String(getOptionKey(o)) === String(key))
    const room = opt && typeof opt === 'object' && opt.roomScene
    if (room) {
      setSelectedImage(room)
      setShowComparison(false)
    } else {
      setSelectedImage(product.image || '/slider.webp')
    }
  }, [selectedVariations, variations, product])

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
      setVariationLibraryLoading(false)
      return
    }
    
    setLoading(true)
    const fetchGen = ++productFetchGen.current
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
        setLoading(false)
        setVariationLibraryLoading(false)
        navigate('/products', { replace: true })
        return
      }
      
      
      // Redirect to slug URL if we got product by id and it has a slug
      if (productData && isNumeric && productData.slug && productData.slug.trim() !== '') {
        const newUrl = `/product/${encodeURIComponent(productData.slug)}`
        if (window.location.pathname !== newUrl) {
          window.history.replaceState({}, '', newUrl)
        }
      }
      setProduct(productData)
      setLength(null)
      setLengthInput('')
      setSqft('')
      setSelectedVariations({})
      setVariationPrices({})
      setSelectedProductVariation(null)
      setVariations([])
      setProductVariations([])
      setRelatedProducts([])

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

      setSelectedImage(productData.image || '/slider.webp')
      setLoading(false)

      let variationsData = null
      try {
        if (productData.variations) {
          variationsData =
            typeof productData.variations === 'string'
              ? JSON.parse(productData.variations)
              : productData.variations
        }
      } catch (e) {
        variationsData = null
      }

      const variationIds =
        variationsData && typeof variationsData === 'object'
          ? Object.keys(variationsData)
              .filter((id) => id !== 'product_variations')
              .map((id) => parseInt(id, 10))
              .filter((id) => !isNaN(id))
          : []

      if (variationIds.length > 0) {
        setVariationLibraryLoading(true)
      } else {
        setVariationLibraryLoading(false)
      }

      const parallel = []

      if (productData.category_id) {
        parallel.push(
          axios
            .get(`/api/categories.php`)
            .then((categoryResponse) => {
              if (fetchGen !== productFetchGen.current) return
              const categories = Array.isArray(categoryResponse.data) ? categoryResponse.data : []
              const category = categories.find(
                (cat) =>
                  cat.id == productData.category_id ||
                  cat.id === parseInt(productData.category_id, 10)
              )
              if (category) {
                setCategoryPDFs({
                  datasheet_pdf: category.datasheet_pdf || null,
                  brochure_pdf: category.brochure_pdf || null,
                })
              } else {
                setCategoryPDFs({ datasheet_pdf: null, brochure_pdf: null })
              }
            })
            .catch(() => {
              if (fetchGen !== productFetchGen.current) return
              setCategoryPDFs({ datasheet_pdf: null, brochure_pdf: null })
            })
        )
      } else {
        setCategoryPDFs({ datasheet_pdf: null, brochure_pdf: null })
      }

      const productVariationsList =
        variationsData && Array.isArray(variationsData.product_variations)
          ? variationsData.product_variations
          : []

      if (productVariationsList.length > 0) {
        parallel.push(
          Promise.all(
            productVariationsList.map((pv) =>
              axios.get(`/api/products.php?id=${pv.product_id}`).catch(() => null)
            )
          )
            .then((results) => {
              if (fetchGen !== productFetchGen.current) return
              const productVariationProducts = results
                .filter((result) => result && result.data && !Array.isArray(result.data))
                .map((result) => result.data)
              setProductVariations(productVariationProducts)
            })
            .catch(() => {
              if (fetchGen !== productFetchGen.current) return
              setProductVariations([])
            })
        )
      }

      if (variationIds.length > 0) {
        parallel.push(
          axios
            .get('/api/admin/variations.php')
            .then((res) => {
              if (fetchGen !== productFetchGen.current) return
              const allList = Array.isArray(res.data) ? res.data : []
              const byId = new Map(allList.map((v) => [Number(v.id), v]))
              const allVariations = variationIds.map((id) => byId.get(id)).filter(Boolean)
              const validVariations = allVariations.filter((variation) => {
                const vid = variation.id
                const opts = variationsData[vid] ?? variationsData[String(vid)] ?? {}
                return Object.keys(opts).length > 0
              })
              setVariations(validVariations)
            })
            .catch(() => {
              if (fetchGen !== productFetchGen.current) return
              setVariations([])
            })
            .finally(() => {
              if (fetchGen !== productFetchGen.current) return
              setVariationLibraryLoading(false)
            })
        )
      }

      if (productData.related_products) {
        try {
          const relatedIds =
            typeof productData.related_products === 'string'
              ? JSON.parse(productData.related_products)
              : productData.related_products
          if (Array.isArray(relatedIds) && relatedIds.length > 0) {
            parallel.push(
              Promise.all(
                relatedIds.map((relatedId) =>
                  axios.get(`/api/products.php?id=${relatedId}`).catch(() => null)
                )
              )
                .then((relatedResults) => {
                  if (fetchGen !== productFetchGen.current) return
                  const validProducts = relatedResults
                    .filter((result) => result && result.data)
                    .map((result) => result.data)
                  setRelatedProducts(validProducts)
                })
                .catch(() => {
                  if (fetchGen !== productFetchGen.current) return
                  setRelatedProducts([])
                })
            )
          }
        } catch (e) {
          setRelatedProducts([])
        }
      }

      await Promise.all(parallel)
    } catch (error) {
      setLoading(false)
      setVariationLibraryLoading(false)
      if (error.response && (error.response.status === 404 || error.response.status === 400)) {
        navigate('/products', { replace: true })
      } else {
        setProduct(null)
        setLoading(false)
      }
    }
  }

  const calculateFinalPrice = () => {
    // If product variation is selected, use ONLY that product's price (no addition to main product)
    if (selectedProductVariation) {
      return parseFloat(selectedProductVariation.price) || 0
    }
    
    // If standard variations are selected, use only variation prices (don't add base price)
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
    if (productVariations.length > 0) {
      return selectedProductVariation !== null
    }

    if (variations.length === 0) return true

    const primaryColor = variations.find((v) => v.type === 'color')
    const primaryColorId = primaryColor?.id

    const allVariationsSelected = variations.every((v) => {
      if (v.type === 'color') {
        return primaryColorId != null && Boolean(selectedVariations[primaryColorId])
      }
      return Boolean(selectedVariations[v.id])
    })
    if (!allVariationsSelected) return false

    const key = selectedVariations[primaryColorId]
    const selOpt = primaryColor?.options?.find((o) => String(getOptionKey(o)) === String(key))
    const sizeOptions = getOptionSizeLabels(selOpt || {})
    if (sizeOptions.length >= 2 && !selectedSize) return false

    return true
  }

  const handleAddToCart = () => {
    
    if (!isVariationSelectionComplete()) {
      if (productVariations.length > 0) {
        alert('Please select a product option before adding to cart.')
      } else {
        alert('Please select all required options before adding to cart.')
      }
      return
    }
    
    // If product variation is selected, add that product to cart instead
    if (selectedProductVariation) {
      // Check if sqft or length is enabled for the selected product variation
      const isSqftEnabledForVariation = selectedProductVariation.sqft_enabled == 1 || selectedProductVariation.sqft_enabled === true
      const isLengthEnabledForVariation = selectedProductVariation.length_enabled == 1 || selectedProductVariation.length_enabled === true || selectedProductVariation.length_enabled === "1"
      
      // Parse sqft value for variation
      let sqftValueForVariation = null
      if (isSqftEnabledForVariation && sqft != null && sqft !== '') {
        const parsedSqft = typeof sqft === 'string' ? parseFloat(sqft) : Number(sqft)
        if (!isNaN(parsedSqft) && parsedSqft > 0) {
          sqftValueForVariation = parsedSqft
        }
      }
      
      const cartItem = {
        ...selectedProductVariation,
        price: calculateFinalPrice(),
        quantity: isSqftEnabledForVariation ? 1 : (parseInt(quantity) || 1),
        sqft: sqftValueForVariation,
        sqft_price: isSqftEnabledForVariation ? (parseFloat(selectedProductVariation.sqft_price) || 0) : null,
        length: isLengthEnabledForVariation ? length : null
      }
      
      
      addToCart(cartItem)
      return
    }
    
    // Check if sqft or length is enabled (handle both boolean and integer 0/1 from database)
    // Also handle string "0" and "1" values from database
    const isSqftEnabled = product.sqft_enabled == 1 || product.sqft_enabled === true || product.sqft_enabled === "1"
    const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true || product.length_enabled === "1" || product.length_enabled === "1"
    
    
    // Validate sqft or length if enabled
    // For string sqft values, convert to number for validation
    const sqftNum = typeof sqft === 'string' ? parseFloat(sqft) : sqft
    if (isSqftEnabled && (sqft === '' || sqft === null || sqft === undefined || isNaN(sqftNum) || sqftNum <= 0)) {
      alert('Please enter a valid square feet value.')
      return
    }
    
    // For length products, try to get length from lengthInput if length state is null
    let lengthValue = length
    if (isLengthEnabled && (!length || length === null)) {
      // Try to parse from lengthInput
      if (lengthInput && lengthInput !== '') {
        const parsedLength = parseInt(lengthInput)
        if (!isNaN(parsedLength) && parsedLength >= 1) {
          lengthValue = parsedLength
        }
      }
    }
    
    
    if (isLengthEnabled && (!lengthValue || lengthValue === null || lengthValue === '' || lengthValue <= 0)) {
      alert('Please enter a valid length value.')
      return
    }
    
    let finalPrice = calculateFinalPrice()
    
    // Calculate price based on sqft if enabled
    let sqftPriceForCart = null
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
      
      sqftPriceForCart = pricePerSqft
      finalPrice = parseFloat(sqft) * pricePerSqft
    }
    
    // Calculate price based on length if enabled
    if (isLengthEnabled && lengthValue) {
      // First, try to use length_prices JSON if available
      if (product.length_prices) {
        try {
          const lengthPrices = typeof product.length_prices === 'string' 
            ? JSON.parse(product.length_prices) 
            : product.length_prices
          
          // Check if price exists for this length
          if (lengthPrices && lengthPrices[lengthValue.toString()] !== undefined) {
            finalPrice = parseFloat(lengthPrices[lengthValue.toString()])
          } else if (product.length_base_price && product.length_increment_price) {
            // Fallback to length formula if length not in length_prices
            finalPrice = parseFloat(product.length_base_price) + ((lengthValue - 1) * parseFloat(product.length_increment_price))
          }
        } catch (e) {
          // Error parsing length_prices
          // Fallback to length formula
          if (product.length_base_price && product.length_increment_price) {
            finalPrice = parseFloat(product.length_base_price) + ((lengthValue - 1) * parseFloat(product.length_increment_price))
          }
        }
      } else if (product.length_base_price && product.length_increment_price) {
        // Use length formula: base_price + ((length - 1) * increment_price)
        finalPrice = parseFloat(product.length_base_price) + ((length - 1) * parseFloat(product.length_increment_price))
      }
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
    
    // For length/sqft products, DON'T multiply by quantity here
    // The price should be per unit, and quantity will be multiplied in CartContext
    // This handles cases like: length 10 ($141.48) × quantity 10 = $1414.80
    // But we store unit price ($141.48) and quantity (10) separately
    
    // Parse sqft value properly - handle both string and number
    let sqftValue = null
    
    if (isSqftEnabled) {
      // More lenient check - if sqft exists and is not empty/null/undefined
      // Use != null to check for both null and undefined
      if (sqft != null && sqft !== '') {
        const parsedSqft = typeof sqft === 'string' ? parseFloat(sqft) : Number(sqft)
        if (!isNaN(parsedSqft) && parsedSqft > 0) {
          sqftValue = parsedSqft
        }
      }
    }
    
    // Build product object - explicitly set sqft to avoid undefined from product spread
    const productWithVariations = {
      ...product,
      price: priceForCart, // Unit price (e.g., 25$ for length 10)
      selectedVariations: selectedVariations,
      variationPrices: variationPrices,
      selectedSize: selectedSize || undefined,
      length: isLengthEnabled ? lengthValue : null, // Use lengthValue instead of length
      // For sqft products, quantity is always 1 (sqft value itself is the quantity)
      // For length products, use the selected quantity
      quantity: isSqftEnabled ? 1 : (parseInt(quantity) || 1), // Quantity - ensure it's an integer
      // Make sure length_prices is included in cart item
      length_prices: product.length_prices || null
    }
    
    // Explicitly set sqft and sqft_price AFTER creating the object to ensure they override
    if (isSqftEnabled) {
      productWithVariations.sqft = sqftValue
      productWithVariations.sqft_price = sqftPriceForCart || (parseFloat(product.sqft_price) || 0)
    } else {
      // Explicitly remove sqft if not enabled
      delete productWithVariations.sqft
      delete productWithVariations.sqft_price
    }
    
    // Add product to cart once with the specified quantity
    // The total will be calculated as: unit_price × quantity (e.g., 25$ × 5 = 125$)
    // For sqft products: sqft × sqft_price (quantity is always 1)
    // For length products: length_price × quantity (e.g., 300$ × 5 = 1500$)
    // For standard products: unit_price × quantity (e.g., 29.5$ × 5 = 147.5$)
    addToCart(productWithVariations)
  }

  const handleWhatsApp = () => {
    const message = `Hello, I'm interested in ${product?.name}. Product ID: ${product?.id}`
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleQuickOrder = () => {
    // Add to cart without opening the sidebar
    if (!isVariationSelectionComplete()) {
      if (productVariations.length > 0) {
        alert('Please select a product option before proceeding to checkout.')
      } else {
        alert('Please select all required options before proceeding to checkout.')
      }
      return
    }
    
    // If product variation is selected, add that product to cart instead
    if (selectedProductVariation) {
      // Check if sqft or length is enabled for the selected product variation
      const isSqftEnabled = selectedProductVariation.sqft_enabled == 1 || selectedProductVariation.sqft_enabled === true
      const isLengthEnabled = selectedProductVariation.length_enabled == 1 || selectedProductVariation.length_enabled === true || selectedProductVariation.length_enabled === "1"
      
      // Validate sqft or length if enabled
      if (isSqftEnabled && (sqft === '' || sqft === null || isNaN(sqft) || sqft <= 0)) {
        alert('Please enter a valid square feet value.')
        return
      }
      
      // For length products, try to get length from lengthInput if length state is null
      let lengthValueForVariation = length
      if (isLengthEnabled && (!length || length === null)) {
        // Try to parse from lengthInput
        if (lengthInput && lengthInput !== '') {
          const parsedLength = parseInt(lengthInput)
          if (!isNaN(parsedLength) && parsedLength >= 1) {
            lengthValueForVariation = parsedLength
          }
        }
      }
      
      if (isLengthEnabled && (!lengthValueForVariation || lengthValueForVariation === null || lengthValueForVariation === '' || lengthValueForVariation <= 0)) {
        alert('Please enter a valid length value.')
        return
      }
      
      let finalPrice = calculateFinalPrice()
      
      // Calculate price based on sqft if enabled (use selected product variation's sqft_price)
      let sqftPriceForCart = null
      if (isSqftEnabled && sqft !== '' && !isNaN(sqft) && sqft > 0) {
        const pricePerSqft = parseFloat(selectedProductVariation.sqft_price) || 0
        sqftPriceForCart = pricePerSqft
        finalPrice = parseFloat(sqft) * pricePerSqft
      }
      
      // Calculate price based on length if enabled (use selected product variation's length_prices)
      if (isLengthEnabled && lengthValueForVariation) {
        if (selectedProductVariation.length_prices) {
          try {
            const lengthPrices = typeof selectedProductVariation.length_prices === 'string' 
              ? JSON.parse(selectedProductVariation.length_prices) 
              : selectedProductVariation.length_prices
            
            if (lengthPrices && lengthPrices[lengthValueForVariation.toString()] !== undefined) {
              finalPrice = parseFloat(lengthPrices[lengthValueForVariation.toString()])
            } else if (selectedProductVariation.length_base_price && selectedProductVariation.length_increment_price) {
              finalPrice = parseFloat(selectedProductVariation.length_base_price) + ((lengthValueForVariation - 1) * parseFloat(selectedProductVariation.length_increment_price))
            }
          } catch (e) {
            // Error parsing length_prices
            if (selectedProductVariation.length_base_price && selectedProductVariation.length_increment_price) {
              finalPrice = parseFloat(selectedProductVariation.length_base_price) + ((lengthValueForVariation - 1) * parseFloat(selectedProductVariation.length_increment_price))
            }
          }
        } else if (selectedProductVariation.length_base_price && selectedProductVariation.length_increment_price) {
          finalPrice = parseFloat(selectedProductVariation.length_base_price) + ((lengthValueForVariation - 1) * parseFloat(selectedProductVariation.length_increment_price))
        }
      }
      
      // Parse sqft value properly - handle both string and number
      let sqftValueForVariation = null
      
      if (isSqftEnabled) {
        if (sqft != null && sqft !== '' && sqft !== undefined) {
          const parsedSqft = typeof sqft === 'string' ? parseFloat(sqft) : Number(sqft)
          if (!isNaN(parsedSqft) && parsedSqft > 0) {
            sqftValueForVariation = parsedSqft
          }
        }
      }
      
      const cartItem = {
        ...selectedProductVariation,
        price: finalPrice,
        quantity: isSqftEnabled ? 1 : (parseInt(quantity) || 1),
        length: isLengthEnabled ? lengthValueForVariation : null,
        length_prices: selectedProductVariation.length_prices || null,
        // Put sqft and sqft_price at the end to ensure they override any values from spread
        sqft: sqftValueForVariation,
        sqft_price: sqftPriceForCart || (isSqftEnabled ? parseFloat(selectedProductVariation.sqft_price) || 0 : null) // Store sqft_price for cart calculation
      }
      addToCartSilently(cartItem)
      navigate('/checkout')
      return
    }
    
    // Validate sqft or length if enabled
    const isSqftEnabled = product.sqft_enabled == 1 || product.sqft_enabled === true
    const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true || product.length_enabled === "1"
    
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
    let sqftPriceForCart = null
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
      
      sqftPriceForCart = pricePerSqft
      finalPrice = parseFloat(sqft) * pricePerSqft
    }
    
    // Calculate price based on length if enabled
    if (isLengthEnabled && lengthValue) {
      // First, try to use length_prices JSON if available
      if (product.length_prices) {
        try {
          const lengthPrices = typeof product.length_prices === 'string' 
            ? JSON.parse(product.length_prices) 
            : product.length_prices
          
          // Check if price exists for this length
          if (lengthPrices && lengthPrices[lengthValue.toString()] !== undefined) {
            finalPrice = parseFloat(lengthPrices[lengthValue.toString()])
          } else if (product.length_base_price && product.length_increment_price) {
            // Fallback to length formula if length not in length_prices
            finalPrice = parseFloat(product.length_base_price) + ((lengthValue - 1) * parseFloat(product.length_increment_price))
          }
        } catch (e) {
          // Error parsing length_prices
          // Fallback to length formula
          if (product.length_base_price && product.length_increment_price) {
            finalPrice = parseFloat(product.length_base_price) + ((lengthValue - 1) * parseFloat(product.length_increment_price))
          }
        }
      } else if (product.length_base_price && product.length_increment_price) {
        // Use length formula: base_price + ((length - 1) * increment_price)
        finalPrice = parseFloat(product.length_base_price) + ((length - 1) * parseFloat(product.length_increment_price))
      }
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
    
    // For length/sqft products, DON'T multiply by quantity here
    // The price should be per unit, and quantity will be multiplied in CartContext
    // This handles cases like: length 10 ($141.48) × quantity 10 = $1414.80
    // But we store unit price ($141.48) and quantity (10) separately
    
    // Parse sqft value properly - handle both string and number
    let sqftValueForQuickOrder = null
    
    if (isSqftEnabled) {
      if (sqft != null && sqft !== '' && sqft !== undefined) {
        const parsedSqft = typeof sqft === 'string' ? parseFloat(sqft) : Number(sqft)
        if (!isNaN(parsedSqft) && parsedSqft > 0) {
          sqftValueForQuickOrder = parsedSqft
        }
      }
    }
    
    const productWithVariations = {
      ...product,
      price: priceForCart, // Unit price, not total
      selectedVariations: selectedVariations,
      variationPrices: variationPrices,
      selectedSize: selectedSize || undefined,
      length: isLengthEnabled ? length : null,
      quantity: isSqftEnabled ? 1 : quantity, // For sqft products, quantity is always 1
      // Make sure length_prices is included in cart item
      length_prices: product.length_prices || null,
      // Put sqft and sqft_price at the end to ensure they override any values from spread
      sqft: sqftValueForQuickOrder,
      sqft_price: sqftPriceForCart || (isSqftEnabled ? parseFloat(product.sqft_price) || 0 : null) // Store sqft_price for cart calculation
    }
    
    // Add to cart silently (without opening sidebar)
    // Use addToCartSilently which is already defined at component level
    addToCartSilently(productWithVariations)
    
    // Navigate to checkout without opening cart sidebar
    navigate('/checkout')
  }

  const handleDownloadDatasheet = async () => {
    // Priority: product PDF > category PDF
    let pdfUrl = product?.datasheet_pdf || categoryPDFs.datasheet_pdf
    if (pdfUrl) {
      // Ensure URL is absolute (starts with / or http)
      if (!pdfUrl.startsWith('http') && !pdfUrl.startsWith('/')) {
        pdfUrl = '/' + pdfUrl
      }
      
      // Extract filename from URL BEFORE fetch
      let filename = 'datasheet.pdf'
      try {
        const urlPath = pdfUrl.split('?')[0] // Remove query parameters
        const urlParts = urlPath.split('/')
        const originalFilename = urlParts[urlParts.length - 1]
        if (originalFilename && originalFilename.endsWith('.pdf') && originalFilename.trim() !== '') {
          filename = originalFilename
        }
      } catch (e) {
        // Error extracting filename - using default
      }
      
      
      try {
        // Fetch PDF and download directly
        const response = await fetch(pdfUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch PDF')
        }
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename) // Use setAttribute instead of download property
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        // Clean up after a short delay to ensure download starts
        setTimeout(() => {
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }, 100)
      } catch (error) {
        // Error downloading datasheet - fallback to window.open
        window.open(pdfUrl, '_blank')
      }
    } else {
      alert('Technical datasheet not available for this product.')
    }
  }

  const handleDownloadBrochure = () => {
    // Priority: product PDF > category PDF
    let pdfUrl = product?.brochure_pdf || categoryPDFs.brochure_pdf
    if (pdfUrl) {
      // Ensure URL is absolute (starts with / or http)
      if (!pdfUrl.startsWith('http') && !pdfUrl.startsWith('/')) {
        pdfUrl = '/' + pdfUrl
      }
      // Try to open PDF, if it fails show error
      const newWindow = window.open(pdfUrl, '_blank')
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        alert('Unable to open PDF. Please check if pop-ups are blocked or the file exists.')
      }
    } else {
      alert('Product brochure not available for this product.')
    }
  }

  const handleWhatsAppShare = () => {
    const productUrl = product?.slug ? `/product/${product.slug}` : `/product/${product?.id}`
    const message = `Check out this product: ${product?.name} - ${window.location.origin}${productUrl}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
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
    <>
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
                src={selectedImage || product.image || '/slider.webp'}
                alt={product.name}
                className="w-full h-auto rounded-lg shadow-lg"
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
          {(galleryImages.length > 0 || product.image || selectedColorRoomScene) && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Gallery</h3>
              <div className="grid grid-cols-4 gap-2">
                {selectedColorRoomScene && (
                  <button
                    type="button"
                    title="Room scene (selected color)"
                    onClick={() => {
                      setSelectedImage(selectedColorRoomScene)
                      setShowComparison(false)
                    }}
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === selectedColorRoomScene && !showComparison
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-amber-300 hover:border-amber-400'
                    }`}
                  >
                    <img
                      src={selectedColorRoomScene}
                      alt=""
                      className="w-full h-20 object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[9px] py-0.5 text-center">
                      Room
                    </span>
                  </button>
                )}
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
          {!(product.call_for_pricing == 1 || product.call_for_pricing === true) && !catalogMode && (
            <p className="text-3xl font-bold text-primary mb-6">
              {(() => {
                const isPackaged = product.is_packaged == 1 || product.is_packaged === true
                const isSqftEnabled = product.sqft_enabled == 1 || product.sqft_enabled === true
                const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true || product.length_enabled === "1"
                const finalPrice = calculateFinalPrice()
                const hasVariations = Object.keys(selectedVariations).length > 0
                
                // Sqft pricing display
                if (isSqftEnabled && product.sqft_price) {
                let pricePerSqft = parseFloat(product.sqft_price) || 0
                
                // If product variation is selected, use its sqft_price
                if (selectedProductVariation && selectedProductVariation.sqft_price) {
                  pricePerSqft = parseFloat(selectedProductVariation.sqft_price) || 0
                } else if (hasVariations && Object.keys(variationPrices).length > 0) {
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
              if (isLengthEnabled) {
                // Try to get price from length_prices if available and length is selected
                let pricePerLength = null
                if (product.length_prices && length) {
                  try {
                    const lengthPrices = typeof product.length_prices === 'string' 
                      ? JSON.parse(product.length_prices) 
                      : product.length_prices
                    if (lengthPrices && lengthPrices[length.toString()] !== undefined) {
                      pricePerLength = parseFloat(lengthPrices[length.toString()])
                    }
                  } catch (e) {
                    // Error parsing length_prices
                  }
                }
                
                // Fallback to base price if length_prices not available or length not selected
                if (pricePerLength === null && product.length_base_price) {
                  pricePerLength = parseFloat(product.length_base_price) || 0
                }
                
                if (pricePerLength !== null) {
                  return (
                    <>
                      ${pricePerLength.toFixed(2)}
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        {length ? `/length ${length}` : '/length'}
                      </span>
                    </>
                  )
                }
              }
              
              // Package pricing display
              if (isPackaged && product.pack_size) {
                const showUnitPrice = product.show_unit_price == 1 || product.show_unit_price === true
                
                // Use package price from database directly (admin panel "Price" field)
                // Don't use variation prices for display
                const packagePrice = parseFloat(product.price) || 0
                
                // If show_unit_price is true, show pack_size value directly (no calculation)
                if (showUnitPrice) {
                  const packSizePrice = parseFloat(product.pack_size) || 0
                  const pcsPerBox = (product.pcs_per_box != null && product.pcs_per_box !== '' && product.pcs_per_box !== 0) ? ` (${product.pcs_per_box} pcs per box)` : ''
                  // Check show_price_unit_kit - handle both string and number values
                  // Also check if the field exists (might be undefined if column doesn't exist)
                  const showKit = product.show_price_unit_kit != null && 
                                 (product.show_price_unit_kit == 1 || 
                                  product.show_price_unit_kit === true || 
                                  product.show_price_unit_kit === '1' || 
                                  product.show_price_unit_kit === 1)
                  
                  // If show_price_unit_kit is enabled, show /kit instead of /pc
                  if (showKit) {
                    return (
                      <>
                        ${packSizePrice.toFixed(2)}
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          /kit
                        </span>
                      </>
                    )
                  }
                  
                  return (
                    <>
                      ${packSizePrice.toFixed(2)}
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        /pc Sold per box{pcsPerBox}
                      </span>
                    </>
                  )
                }
                
                // Otherwise show package price
                return <>${packagePrice.toFixed(2)}</>
              }
              
              // Per piece pricing display - if show_unit_price is true but not packaged
              const showUnitPriceForPiece = product.show_unit_price == 1 || product.show_unit_price === true
              if (!isPackaged && showUnitPriceForPiece) {
                return (
                  <>
                    ${finalPrice.toFixed(2)}
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      /pc
                    </span>
                  </>
                )
              }
              
              // Regular price display
              // Show /kit if show_price_unit_kit is enabled
              // Check show_price_unit_kit - handle both string and number values
              // Also check if the field exists (might be undefined if column doesn't exist)
              const showKit = product.show_price_unit_kit != null && 
                             (product.show_price_unit_kit == 1 || 
                              product.show_price_unit_kit === true || 
                              product.show_price_unit_kit === '1' || 
                              product.show_price_unit_kit === 1)
              if (showKit) {
                return (
                  <>
                    ${finalPrice.toFixed(2)}
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      /kit
                    </span>
                  </>
                )
              }
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

          {/* Product Variations */}
          {productVariations.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800">Select Product Option *</h3>
                {selectedProductVariation && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductVariation(null)
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Clear Options
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {productVariations.map((variationProduct) => {
                  const isSelected = selectedProductVariation?.id === variationProduct.id
                  const productPrice = parseFloat(variationProduct.price) || 0
                  
                  return (
                    <div
                      key={variationProduct.id}
                      onClick={() => setSelectedProductVariation(variationProduct)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <img
                        src={variationProduct.image || '/placeholder.jpg'}
                        alt={variationProduct.name}
                        className="w-full h-32 object-cover rounded mb-2"
                        onError={(e) => { e.target.src = '/placeholder.jpg' }}
                      />
                      <h4 className="font-semibold text-gray-800 mb-1">{variationProduct.name}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{variationProduct.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          ${productPrice.toFixed(2)}
                        </span>
                        {isSelected && (
                          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Standard Variations */}
          {product && (variations.length > 0 || variationLibraryLoading) && (() => {
            let productVariationsJson = {}
            try {
              productVariationsJson = product.variations
                ? typeof product.variations === 'string'
                  ? JSON.parse(product.variations)
                  : product.variations
                : {}
            } catch {
              productVariationsJson = {}
            }
            const colorVars = variations.filter((v) => v.type === 'color')
            const otherVars = variations.filter((v) => v.type !== 'color')
            const colorVariationIds = colorVars.map((v) => v.id)
            const primaryColor = colorVars[0]
            const primaryColorId = primaryColor?.id

            const renderNonColorVariation = (variation) => {
              const variationId = variation.id
              const selectedOption = selectedVariations[variationId]
              const variationOptions = productVariationsJson[variationId] || {}
              const selectedPrice = variationPrices[variationId] || 0
              const needsThisOption = !selectedOption

              return (
                <div
                  key={variation.id}
                  className={`rounded-lg border p-4 ${
                    selectedOption
                      ? 'border-primary bg-primary/5'
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-semibold text-gray-800 text-sm">
                      {variation.name}
                      {needsThisOption && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                    {selectedOption ? (
                      selectedPrice > 0 ? (
                        <span className="text-xs font-semibold text-primary">+${selectedPrice.toFixed(2)}</span>
                      ) : (
                        <span className="text-xs text-gray-500">Base</span>
                      )
                    ) : (
                      <span className="text-xs text-red-500">Required</span>
                    )}
                  </div>
                  {(() => {
                    const availableOptions = Array.isArray(variation.options)
                      ? variation.options.filter((option) => variationOptions[getOptionKey(option)] !== undefined)
                      : []

                    if (availableOptions.length > 7) {
                      return (
                        <select
                          value={selectedOption || ''}
                          onChange={(e) => {
                            const option = e.target.value
                            if (!option || option === '') {
                              setSelectedVariations((prev) => {
                                const nv = { ...prev }
                                delete nv[variationId]
                                return nv
                              })
                              setVariationPrices((prev) => {
                                const np = { ...prev }
                                delete np[variationId]
                                return np
                              })
                            } else {
                              const optionData = variationOptions[option] || {}
                              const optionPrice = optionData.price || 0
                              setSelectedVariations((prev) => ({ ...prev, [variationId]: option }))
                              setVariationPrices((prev) => {
                                const np = { ...prev }
                                if (optionPrice) np[variationId] = optionPrice
                                else delete np[variationId]
                                return np
                              })
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="">Select {variation.name}</option>
                          {availableOptions.map((option, idx) => {
                            const key = getOptionKey(option)
                            const optionData = variationOptions[key] || {}
                            const optionPrice = optionData.price || 0
                            const label = optionData.value || getOptionLabel(option)
                            return (
                              <option key={idx} value={key}>
                                {label} {optionPrice > 0 ? `(+$${parseFloat(optionPrice).toFixed(2)})` : ''}
                              </option>
                            )
                          })}
                        </select>
                      )
                    }

                    return (
                      <div className="flex flex-wrap gap-2">
                        {availableOptions.map((option, idx) => {
                          const key = getOptionKey(option)
                          const optionData = variationOptions[key] || {}
                          const optionPrice = optionData.price || 0
                          const isSelected = selectedOption === key
                          const label = optionData.value || getOptionLabel(option)
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedVariations((prev) => {
                                  const cur = prev[variationId]
                                  const turningOff = String(cur) === String(key)
                                  setVariationPrices((prevP) => {
                                    const n = { ...prevP }
                                    if (turningOff) {
                                      delete n[variationId]
                                    } else if (optionPrice) {
                                      n[variationId] = optionPrice
                                    } else {
                                      delete n[variationId]
                                    }
                                    return n
                                  })
                                  if (turningOff) {
                                    const n = { ...prev }
                                    delete n[variationId]
                                    return n
                                  }
                                  return { ...prev, [variationId]: key }
                                })
                              }}
                              className={`min-w-[5.5rem] px-3 py-2 rounded-md border text-xs font-medium text-center transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/10 text-gray-900'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              {label}
                              {optionPrice > 0 && (
                                <span className="block text-[10px] mt-0.5 opacity-90">
                                  +${parseFloat(optionPrice).toFixed(2)}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {needsThisOption && (
                    <p className="text-xs text-red-600 mt-2">Please select</p>
                  )}
                </div>
              )
            }

            const primaryOpts = primaryColor
              ? productVariationsJson[primaryColorId] || {}
              : {}
            const colorAvailableOptions = primaryColor && Array.isArray(primaryColor.options)
              ? primaryColor.options.filter((option) => primaryOpts[getOptionKey(option)] !== undefined)
              : []
            const mainColorOptions = []
            const extraSectionOrder = []
            const extraSectionMap = new Map()
            for (const option of colorAvailableOptions) {
              const k = getOptionKey(option)
              const dg = String(primaryOpts[k]?.displayGroup || '').trim()
              if (dg) {
                if (!extraSectionMap.has(dg)) {
                  extraSectionMap.set(dg, [])
                  extraSectionOrder.push(dg)
                }
                extraSectionMap.get(dg).push(option)
              } else {
                mainColorOptions.push(option)
              }
            }
            const extraColorSections = extraSectionOrder.map((title) => ({
              title,
              options: extraSectionMap.get(title) || [],
            }))
            const selectedColorOption = primaryColorId != null ? selectedVariations[primaryColorId] : null
            const selectedColorPrice = primaryColorId != null ? variationPrices[primaryColorId] || 0 : 0
            const needsColor = primaryColor && !selectedColorOption

            return (
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-800">Options</h3>
                    {variationLibraryLoading && (
                      <span className="text-xs text-gray-500">Loading…</span>
                    )}
                  </div>
                  {Object.keys(selectedVariations).length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVariations({})
                        setVariationPrices({})
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {primaryColor && (
                  <div
                    className={`rounded-lg border p-4 ${
                      selectedColorOption
                        ? 'border-primary bg-white'
                        : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-800 text-sm">
                        {primaryColor.name}
                        {needsColor && <span className="text-red-500 ml-0.5">*</span>}
                      </span>
                      {selectedColorOption ? (
                        selectedColorPrice > 0 ? (
                          <span className="text-xs font-semibold text-primary">+${selectedColorPrice.toFixed(2)}</span>
                        ) : (
                          <span className="text-xs text-gray-500">Base</span>
                        )
                      ) : (
                        <span className="text-xs text-red-500">Required</span>
                      )}
                    </div>

                    {(() => {
                      const renderColorSwatch = (option, listKey) => {
                        const key = getOptionKey(option)
                        const optionData = primaryOpts[key] || {}
                        const optionPrice = optionData.price || 0
                        const isSelected = selectedColorOption === key
                        const label = optionData.value || getOptionLabel(option)
                        const optionImage = typeof option === 'object' && option?.image
                        const sizeLabels = getOptionSizeLabels(option)
                        return (
                          <button
                            key={`${listKey}-${key}`}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => {
                              setSelectedSize('')
                              setSelectedVariations((prev) => {
                                const cur = prev[primaryColorId]
                                const turningOff = String(cur) === String(key)
                                setVariationPrices((prevP) => {
                                  const n = { ...prevP }
                                  colorVariationIds.forEach((id) => delete n[id])
                                  if (!turningOff && optionPrice) n[primaryColorId] = optionPrice
                                  return n
                                })
                                if (turningOff) {
                                  const n = { ...prev }
                                  colorVariationIds.forEach((id) => delete n[id])
                                  return n
                                }
                                return applySingleColorChoice(prev, key, colorVariationIds, primaryColorId)
                              })
                            }}
                            className={`flex flex-col w-[calc(50%-0.375rem)] sm:w-36 shrink-0 text-left rounded-md border overflow-hidden transition-colors ${
                              isSelected
                                ? 'border-primary ring-1 ring-primary bg-primary/5'
                                : 'border-gray-200 bg-white hover:border-gray-400'
                            }`}
                          >
                            {optionImage ? (
                              <div className="w-full h-24 sm:h-28 bg-gray-100 border-b border-gray-200">
                                <img
                                  src={optionImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  draggable={false}
                                />
                              </div>
                            ) : (
                              <div className="w-full h-16 sm:h-20 bg-gray-50 border-b border-gray-200 flex items-center justify-center text-xs text-gray-500 px-1 text-center">
                                {label}
                              </div>
                            )}
                            <div className="p-2">
                              {optionImage && (
                                <span className="text-xs font-medium text-gray-900 leading-tight block">{label}</span>
                              )}
                              {sizeLabels.length > 0 && (
                                <span className="text-[10px] text-gray-500 mt-1 block leading-snug">
                                  {sizeLabels.join(' · ')}
                                </span>
                              )}
                              {optionPrice > 0 && (
                                <span className="text-[10px] text-gray-600 mt-0.5 block">
                                  +${parseFloat(optionPrice).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      }
                      return (
                        <>
                          {mainColorOptions.length > 0 && (
                            <div className="flex flex-wrap gap-3">
                              {mainColorOptions.map((option) => renderColorSwatch(option, 'main'))}
                            </div>
                          )}
                          {extraColorSections.map(({ title, options: secOpts }, si) => (
                            <div
                              key={`extra-${title}-${si}`}
                              className={`${si > 0 || mainColorOptions.length > 0 ? 'mt-5 pt-4 border-t border-gray-200' : ''}`}
                            >
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>
                              <div className="flex flex-wrap gap-3">{secOpts.map((o) => renderColorSwatch(o, `g${si}`))}</div>
                            </div>
                          ))}
                        </>
                      )
                    })()}
                    {(() => {
                      const selOpt = primaryColor.options?.find((o) => String(getOptionKey(o)) === String(selectedColorOption))
                      const sizeOptions = getOptionSizeLabels(selOpt || [])
                      const needsSize = sizeOptions.length >= 2 && !selectedSize
                      return (
                        <>
                          {selectedColorOption && sizeOptions.length >= 2 && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Size</p>
                              <div className="flex flex-wrap gap-3">
                                {sizeOptions.map((sz) => (
                                  <label
                                    key={sz}
                                    className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-800"
                                  >
                                    <input
                                      type="radio"
                                      name="color-size"
                                      checked={selectedSize === sz}
                                      onChange={() => setSelectedSize(sz)}
                                      className="text-primary border-gray-300 focus:ring-primary"
                                    />
                                    {sz}
                                  </label>
                                ))}
                              </div>
                              {needsSize && (
                                <p className="text-xs text-red-600 mt-1.5">Please select a size</p>
                              )}
                            </div>
                          )}
                          {needsColor && (
                            <p className="text-xs text-red-600 mt-2">Please select a color</p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}

                {otherVars.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {otherVars.map((v) => renderNonColorVariation(v))}
                  </div>
                )}
              </div>
            )
          })()}

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
                  const inputValue = e.target.value;
                  // Keep as string for input, but validate it's a valid number
                  if (inputValue === '') {
                    setSqft('');
                  } else {
                    const numValue = parseFloat(inputValue);
                    if (!isNaN(numValue) && numValue > 0) {
                      // Store as string for input compatibility, but it's a valid number
                      setSqft(inputValue);
                    } else {
                      setSqft('');
                    }
                  }
                }}
                step="0.01"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 font-semibold"
                placeholder="Enter sqft"
              />
              {product.sqft_price && sqft !== '' && !isNaN(sqft) && sqft > 0 && (() => {
                const hasSelectedVariations = Object.keys(selectedVariations).length > 0
                let pricePerSqft = parseFloat(product.sqft_price) || 0
                
                // If product variation is selected, use its sqft_price
                if (selectedProductVariation && selectedProductVariation.sqft_price) {
                  pricePerSqft = parseFloat(selectedProductVariation.sqft_price) || 0
                } else if (hasSelectedVariations && Object.keys(variationPrices).length > 0) {
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
          {(product.length_enabled == 1 || product.length_enabled === true || product.length_enabled === "1") && (
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
              {(() => {
                if (!length) return null
                
                // First, try to use length_prices JSON if available
                if (product.length_prices) {
                  try {
                    const lengthPrices = typeof product.length_prices === 'string' 
                      ? JSON.parse(product.length_prices) 
                      : product.length_prices
                    
                    if (lengthPrices && lengthPrices[length.toString()] !== undefined) {
                      const price = parseFloat(lengthPrices[length.toString()])
                      return (
                        <p className="text-sm text-gray-600 mt-1">
                          Price for length {length}: ${price.toFixed(2)}
                        </p>
                      )
                    }
                  } catch (e) {
                    // Error parsing length_prices
                  }
                }
                
                // Otherwise, show length formula pricing
                if (product.length_base_price && product.length_increment_price) {
                  const calculatedPrice = parseFloat(product.length_base_price) + ((length - 1) * parseFloat(product.length_increment_price))
                  return (
                    <p className="text-sm text-gray-600 mt-1">
                      Base: ${parseFloat(product.length_base_price).toFixed(2)} | Increment: ${parseFloat(product.length_increment_price).toFixed(2)} per unit | Total: ${calculatedPrice.toFixed(2)}
                    </p>
                  )
                }
                
                return null
              })()}
            </div>
          )}

          {/* Quantity - Show if:
              1. Neither sqft nor length is enabled (normal products)
              2. OR if length is enabled (length products need quantity)
              NOTE: Sqft products don't need quantity - sqft value itself is the quantity */}
          {(() => {
            const isSqftEnabled = product.sqft_enabled == 1 || product.sqft_enabled === true
            const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true || product.length_enabled === "1"
            const hasVariations = Object.keys(selectedVariations).length > 0
            
            // Show quantity if:
            // - Normal products (no sqft/length)
            // - OR if length enabled (length products need quantity)
            // - NOT for sqft products (sqft value is the quantity)
            const showQuantity = (!isSqftEnabled && !isLengthEnabled) || 
                                 (isLengthEnabled && !isSqftEnabled)
            
            return showQuantity && (
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
                {/* Show total price preview if variations are selected */}
                {hasVariations && (isSqftEnabled || isLengthEnabled) && (() => {
                  const finalPrice = calculateFinalPrice()
                  const totalPrice = finalPrice * quantity
                  return (
                    <p className="text-sm text-gray-600 mt-1">
                      Unit Price: ${finalPrice.toFixed(2)} × {quantity} = Total: ${totalPrice.toFixed(2)}
                    </p>
                  )
                })()}
              </div>
            )
          })()}

          <div className="space-y-4">
            {product.call_for_pricing == 1 || product.call_for_pricing === true || catalogMode ? (
              <a
                href={`tel:+${phoneNumber}`}
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = `tel:+${phoneNumber}`
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span>Call for Price</span>
              </a>
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
                {isVariationSelectionComplete() ? 'Add to Cart' : 'Please Select All Options'}
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
    </>
  )
}

export default ProductDetail
