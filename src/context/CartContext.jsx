import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { applyProductCategoryDiscount } from '../utils/pricing'

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
    const pricedProduct = applyProductCategoryDiscount(product)
    setCart(prevCart => {
      // For sqft or length products, create unique cart items based on sqft/length values
      // Otherwise, check for existing items by id
      if (pricedProduct.sqft || pricedProduct.length) {
        // Create unique key for sqft/length products
        const uniqueKey = `${pricedProduct.id}_${pricedProduct.sqft || 0}_${pricedProduct.length || 0}_${JSON.stringify(pricedProduct.selectedVariations || {})}`
        const existingItem = prevCart.find(item => {
          const itemKey = `${item.id}_${item.sqft || 0}_${item.length || 0}_${JSON.stringify(item.selectedVariations || {})}`
          return itemKey === uniqueKey
        })
        
        if (existingItem) {
          return prevCart.map(item => {
            const itemKey = `${item.id}_${item.sqft || 0}_${item.length || 0}_${JSON.stringify(item.selectedVariations || {})}`
            return itemKey === uniqueKey
              ? { ...item, quantity: (item.quantity || 1) + (pricedProduct.quantity || 1) }
              : item
          })
        }
        return [...prevCart, { ...pricedProduct, quantity: pricedProduct.quantity || 1 }]
      } else {
        // Standard product matching
        const existingItem = prevCart.find(item => 
          item.id === pricedProduct.id && 
          JSON.stringify(item.selectedVariations || {}) === JSON.stringify(pricedProduct.selectedVariations || {})
        )
        if (existingItem) {
          return prevCart.map(item =>
            item.id === pricedProduct.id && 
            JSON.stringify(item.selectedVariations || {}) === JSON.stringify(pricedProduct.selectedVariations || {})
              ? { ...item, quantity: item.quantity + (pricedProduct.quantity || 1) }
              : item
          )
        }
        return [...prevCart, { ...pricedProduct, quantity: pricedProduct.quantity || 1 }]
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
        console.error('Error fetching gift product:', error)
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

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      let price = parseFloat(item.price) || 0
      
      // Recalculate price for sqft products (this overrides other pricing)
      if (item.sqft && item.sqft_price) {
        price = parseFloat(item.sqft) * parseFloat(item.sqft_price)
      }
      // Recalculate price for length products (this overrides other pricing)
      else if (item.length && item.length_base_price && item.length_increment_price) {
        // Formula: base_price + ((length - 1) * increment_price)
        // 1 length = base_price, 2 length = base_price + increment, etc.
        price = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
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

