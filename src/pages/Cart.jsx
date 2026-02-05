import React from 'react'
import { Link } from 'react-router-dom'
import { getProductUrl } from '../utils/slug'
import { useCart } from '../context/CartContext'

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-8">Add some products to your cart to continue shopping.</p>
        <Link
          to="/products"
          className="inline-block bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-800 font-semibold"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {cart.map((item) => (
              <div
                key={item.id}
                className="border-b border-gray-200 p-6 flex flex-col md:flex-row gap-4"
              >
                <Link to={getProductUrl(item)} className="flex-shrink-0">
                  <img
                    src={item.image || '/slider.webp'}
                    alt={item.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </Link>
                <div className="flex-grow">
                  <Link to={getProductUrl(item)}>
                    <h3 className="text-xl font-semibold text-gray-800 hover:text-primary transition-colors mb-2">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-2xl font-bold text-primary mb-4">
                    {(() => {
                      let unitPrice = parseFloat(item.price) || 0
                      
                      // For sqft products, calculate unit price (sqft_price per sqft)
                      if (item.sqft && item.sqft_price) {
                        unitPrice = parseFloat(item.sqft_price) || 0
                      }
                      // For length products, calculate unit price
                      else if (item.length) {
                        // First, try to use length_prices JSON if available
                        if (item.length_prices) {
                          try {
                            const lengthPrices = typeof item.length_prices === 'string' 
                              ? JSON.parse(item.length_prices) 
                              : item.length_prices
                            
                            // Check if price exists for this length
                            if (lengthPrices && lengthPrices[item.length.toString()] !== undefined) {
                              unitPrice = parseFloat(lengthPrices[item.length.toString()])
                            } else if (item.length_base_price && item.length_increment_price) {
                              // Fallback to length formula if length not in length_prices
                              unitPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                            }
                          } catch (e) {
                            console.error('Error parsing length_prices in cart:', e)
                            // Fallback to length formula
                            if (item.length_base_price && item.length_increment_price) {
                              unitPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                            }
                          }
                        } else if (item.length_base_price && item.length_increment_price) {
                          // Use length formula: base_price + ((length - 1) * increment_price)
                          unitPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                        }
                      }
                      
                      // For sqft products, show total price (sqft × sqft_price)
                      if (item.sqft && item.sqft_price) {
                        const sqftTotal = parseFloat(item.sqft) * parseFloat(item.sqft_price)
                        return (
                          <>
                            ${sqftTotal.toFixed(2)}
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              ({item.sqft} sqft × ${unitPrice.toFixed(2)}/sqft)
                            </span>
                          </>
                        )
                      }
                      
                      return `$${unitPrice.toFixed(2)}`
                    })()}
                    {item.length && (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        (length: {item.length})
                      </span>
                    )}
                  </p>
                  {/* Don't show quantity controls for sqft products - sqft value itself is the quantity */}
                  {!item.sqft && (
                    <div className="flex items-center space-x-4">
                      <label className="text-gray-700 font-semibold">Quantity:</label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded font-semibold"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded font-semibold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between items-end">
                  <p className="text-xl font-bold text-gray-800">
                    {(() => {
                      let unitPrice = parseFloat(item.price) || 0
                      
                      // For sqft products, calculate total: sqft × sqft_price (no quantity multiplication)
                      if (item.sqft && item.sqft_price) {
                        const sqftTotal = parseFloat(item.sqft) * parseFloat(item.sqft_price)
                        return `$${sqftTotal.toFixed(2)}`
                      }
                      // For length products, calculate unit price
                      else if (item.length) {
                        // First, try to use length_prices JSON if available
                        if (item.length_prices) {
                          try {
                            const lengthPrices = typeof item.length_prices === 'string' 
                              ? JSON.parse(item.length_prices) 
                              : item.length_prices
                            
                            // Check if price exists for this length
                            if (lengthPrices && lengthPrices[item.length.toString()] !== undefined) {
                              unitPrice = parseFloat(lengthPrices[item.length.toString()])
                            } else if (item.length_base_price && item.length_increment_price) {
                              // Fallback to length formula if length not in length_prices
                              unitPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                            }
                          } catch (e) {
                            console.error('Error parsing length_prices in cart:', e)
                            // Fallback to length formula
                            if (item.length_base_price && item.length_increment_price) {
                              unitPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                            }
                          }
                        } else if (item.length_base_price && item.length_increment_price) {
                          // Use length formula: base_price + ((length - 1) * increment_price)
                          unitPrice = parseFloat(item.length_base_price) + ((parseInt(item.length) - 1) * parseFloat(item.length_increment_price))
                        }
                      }
                      
                      const totalPrice = unitPrice * (parseInt(item.quantity) || 1)
                      return `$${totalPrice.toFixed(2)}`
                    })()}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-semibold">Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-primary">${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Link
              to="/checkout"
              className="block w-full bg-primary hover:bg-primary-dark text-white text-center py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Proceed to Checkout
            </Link>
            <p className="text-sm text-gray-600 mt-4 text-center">
              We currently serve customers in the United States only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart

