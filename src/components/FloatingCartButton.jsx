import React from 'react'
import { useCart } from '../context/CartContext'

const FloatingCartButton = () => {
  const { getCartItemCount, openCart } = useCart()
  const cartCount = getCartItemCount()

  return (
    <button
      onClick={openCart}
      className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group"
      aria-label="Open cart"
    >
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
          {cartCount}
        </span>
      )}
    </button>
  )
}

export default FloatingCartButton

