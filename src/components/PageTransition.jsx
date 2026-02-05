import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import logoImage from '/logo.svg'

const PageTransition = ({ children }) => {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    setIsLoading(true)
    
    // Show loading screen for a brief moment
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000) // Delay for smooth transition

    return () => clearTimeout(timer)
  }, [location.pathname])

  useEffect(() => {
    if (!isLoading) {
      setDisplayChildren(children)
    }
  }, [children, isLoading])

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          {/* Logo with animation */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <img 
              src={logoImage} 
              alt="Tile and Turf" 
              className="relative z-10 h-20 w-auto animate-pulse"
              style={{
                animation: 'logoPulse 1.5s ease-in-out infinite'
              }}
            />
          </div>
          
          {/* Loading text */}
          <div className="text-gray-600 text-sm font-medium mt-4">
            Loading...
          </div>
          
          {/* Progress bar */}
          <div className="w-48 h-1 bg-gray-200 rounded-full mt-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
              style={{
                animation: 'loadingProgress 1.5s ease-in-out infinite'
              }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      key={location.pathname}
      className="animate-fadeIn"
    >
      {displayChildren}
    </div>
  )
}

export default PageTransition

