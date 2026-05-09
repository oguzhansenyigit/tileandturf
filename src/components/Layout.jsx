import React, { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import CartSidebar from './CartSidebar'
import FloatingCartButton from './FloatingCartButton'
import PageTransition from './PageTransition'
import { useCart } from '../context/CartContext'

const Layout = ({ children }) => {
  const { isCartOpen, closeCart } = useCart()

  useEffect(() => {
    // Prevent scroll jump on page refresh
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual'
    }
    
    // Scroll to top on mount (page refresh)
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
      <FloatingCartButton />
      <CartSidebar isOpen={isCartOpen} onClose={closeCart} />
    </div>
  )
}

export default Layout

