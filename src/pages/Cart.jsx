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
                    ${(parseFloat(item.price) || 0).toFixed(2)}
                  </p>
                  <div className="flex items-center space-x-4">
                    <label className="text-gray-700 font-semibold">Quantity:</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded font-semibold"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <p className="text-xl font-bold text-gray-800">
                    ${((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}
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

