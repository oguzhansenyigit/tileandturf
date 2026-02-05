import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = async (product, silent = false) => {
    setCart(prevCart => {
      // Ensure quantity is an integer
      const productQuantity = parseInt(product.quantity) || 1
      
      
      // For sqft or length products, create unique cart items based on sqft/length values
      // Otherwise, check for existing items by id
      if (product.sqft || product.length) {
        // Create unique key for sqft/length products
        // Include length_prices in the key to differentiate items with different pricing
        const uniqueKey = `${product.id}_${product.sqft || 0}_${product.length || 0}_${JSON.stringify(product.selectedVariations || {})}_${product.length_prices ? JSON.stringify(product.length_prices) : ''}`
        const existingItem = prevCart.find(item => {
          const itemKey = `${item.id}_${item.sqft || 0}_${item.length || 0}_${JSON.stringify(item.selectedVariations || {})}_${item.length_prices ? JSON.stringify(item.length_prices) : ''}`
          return itemKey === uniqueKey
        })
        
        if (existingItem) {
          // If same item exists, add to quantity (user wants more of the same)
          const newQuantity = (parseInt(existingItem.quantity) || 1) + productQuantity
          return prevCart.map(item => {
            const itemKey = `${item.id}_${item.sqft || 0}_${item.length || 0}_${JSON.stringify(item.selectedVariations || {})}_${item.length_prices ? JSON.stringify(item.length_prices) : ''}`
            return itemKey === uniqueKey
              ? { ...item, quantity: newQuantity }
              : item
          })
        }
        // Add new item with the quantity specified by user
        return [...prevCart, { ...product, quantity: productQuantity }]
      } else {
        // Standard product matching
        const existingItem = prevCart.find(item => 
          item.id === product.id && 
          JSON.stringify(item.selectedVariations || {}) === JSON.stringify(product.selectedVariations || {})
        )
        if (existingItem) {
          return prevCart.map(item =>
            item.id === product.id && 
            JSON.stringify(item.selectedVariations || {}) === JSON.stringify(product.selectedVariations || {})
              ? { ...item, quantity: item.quantity + (product.quantity || 1) }
              : item
          )
        }
        return [...prevCart, { ...product, quantity: product.quantity || 1 }]
      }
    })
    
    // Check if product has a gift product and add it automatically
    if (product.gift_product_id) {
      try {
        const giftProductResponse = await axios.get(`/api/products.php?id=${product.gift_product_id}`)
        const giftProduct = giftProductResponse.data
        
        if (giftProduct) {
          // Add gift product with price 0
          const giftProductForCart = {
            ...giftProduct,
            price: 0,
            quantity: product.quantity || 1,
            is_gift: true // Mark as gift product
          }
          
          setCart(prevCart => {
            // Check if gift product already exists in cart
            const existingGiftItem = prevCart.find(item => 
              item.id === giftProductForCart.id && item.is_gift
            )
            
            if (existingGiftItem) {
              return prevCart.map(item =>
                item.id === giftProductForCart.id && item.is_gift
                  ? { ...item, quantity: item.quantity + (product.quantity || 1) }
                  : item
              )
            }
            
            return [...prevCart, giftProductForCart]
          })
        }
      } catch (error) {
        // Error fetching gift product
      }
    }
    
    if (!silent) {
      setIsCartOpen(true)
    }
  }

  const addToCartSilently = (product) => {
    addToCart(product, true)
  }

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, quantity, itemData = null) => {
    if (quantity <= 0) {
      // For length/sqft products, we need to remove by unique key
      if (itemData && (itemData.length || itemData.sqft)) {
        setCart(prevCart => {
          const uniqueKey = `${itemData.id}_${itemData.sqft || 0}_${itemData.length || 0}_${JSON.stringify(itemData.selectedVariations || {})}_${itemData.length_prices ? JSON.stringify(itemData.length_prices) : ''}`
          return prevCart.filter(item => {
            const itemKey = `${item.id}_${item.sqft || 0}_${item.length || 0}_${JSON.stringify(item.selectedVariations || {})}_${item.length_prices ? JSON.stringify(item.length_prices) : ''}`
            return itemKey !== uniqueKey
          })
        })
      } else {
        removeFromCart(productId)
      }
      return
    }
    setCart(prevCart =>
      prevCart.map(item => {
        // For length/sqft products, match by unique key
        if (itemData && (itemData.length || itemData.sqft)) {
          const uniqueKey = `${itemData.id}_${itemData.sqft || 0}_${itemData.length || 0}_${JSON.stringify(itemData.selectedVariations || {})}_${itemData.length_prices ? JSON.stringify(itemData.length_prices) : ''}`
          const itemKey = `${item.id}_${item.sqft || 0}_${item.length || 0}_${JSON.stringify(item.selectedVariations || {})}_${item.length_prices ? JSON.stringify(item.length_prices) : ''}`
          if (itemKey === uniqueKey) {
            return { ...item, quantity }
          }
        } else {
          // For standard products, match by productId and variations
          if (item.id === productId && 
              JSON.stringify(item.selectedVariations || {}) === JSON.stringify(itemData?.selectedVariations || {})) {
            return { ...item, quantity }
          }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      let price = parseFloat(item.price) || 0
      
      // Recalculate price for sqft products (this overrides other pricing)
      // Sqft products: sqft × sqft_price (no quantity multiplication - sqft value itself is the quantity)
      if (item.sqft && item.sqft_price) {
        price = parseFloat(item.sqft) * parseFloat(item.sqft_price)
        // Don't multiply by quantity for sqft products - sqft value is already the quantity
        return total + price
      }
      // Recalculate price for length products (this overrides other pricing)
      else if (item.length) {
        // First, try to use length_prices JSON if available
        if (item.length_prices) {
          try {
            const lengthPrices = typeof item.length_prices === 'string' 
              ? JSON.parse(item.length_prices) 
              : item.length_prices
            
            // Check if price exists for this length
            if (lengthPrices && lengthPrices[item.length.toString()] !== undefined) {
              price = parseFloat(lengthPrices[item.length.toString()])
            } else if (item.length_base_price && item.length_increment_price) {
              // Fallback to length formula if length not in length_prices
              price = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
            }
          } catch (e) {
            // Error parsing length_prices in cart
            // Fallback to length formula
            if (item.length_base_price && item.length_increment_price) {
              price = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
            }
          }
        } else if (item.length_base_price && item.length_increment_price) {
          // Use length formula: base_price + ((length - 1) * increment_price)
          price = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
        }
      }
      // If product is packaged, calculate package price (base price × pack size)
      // Note: For packaged products, item.price is the base (unit) price
      else if (item.is_packaged && item.pack_size) {
        price = price * parseFloat(item.pack_size)
      }
      
      const quantity = parseInt(item.quantity) || 0
      return total + price * quantity
    }, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addToCartSilently,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

