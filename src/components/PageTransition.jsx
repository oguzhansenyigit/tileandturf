import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import logoImage from '/logo.svg'

const OVERLAY_HOLD_MS = 140
const OVERLAY_FADE_MS = 320

const PageTransition = ({ children }) => {
  const location = useLocation()
  const isFirstRender = useRef(true)
  const [overlayActive, setOverlayActive] = useState(false)
  const [overlayOpaque, setOverlayOpaque] = useState(false)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    window.scrollTo(0, 0)
    setOverlayActive(true)
    setOverlayOpaque(true)

    const fadeTimer = setTimeout(() => {
      setOverlayOpaque(false)
    }, OVERLAY_HOLD_MS)

    const removeTimer = setTimeout(() => {
      setOverlayActive(false)
    }, OVERLAY_HOLD_MS + OVERLAY_FADE_MS)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [location.pathname])

  return (
    <>
      <div key={location.pathname} className="page-transition-content">
        {children}
      </div>

      {overlayActive && (
        <div
          className="page-transition-overlay"
          style={{ opacity: overlayOpaque ? 1 : 0 }}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center">
            <img
              src={logoImage}
              alt=""
              width={80}
              height={80}
              className="h-16 w-auto"
              decoding="async"
            />
            <p className="text-gray-600 text-sm font-medium mt-4">Loading...</p>
            <div className="w-40 h-1 bg-gray-200 rounded-full mt-3 overflow-hidden">
              <div
                className="page-transition-progress h-full bg-primary rounded-full origin-left"
                style={{ transform: overlayOpaque ? 'scaleX(1)' : 'scaleX(0)' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PageTransition
