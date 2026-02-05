import React from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import creditCardImage from '/creditcart.png'
import logoImage from '/logo.svg'

const Footer = () => {
  const { phoneNumber } = useSettings()
  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and About Us */}
          <div className="lg:col-span-2">
            <Link to="/" className="block mb-4">
              <img src={logoImage} alt="Tile and Turf Logo" className="h-12 w-auto" />
            </Link>
            <h3 className="text-white text-lg font-semibold mb-4">About Us</h3>
            <p className="text-sm">
              Your trusted source for premium building materials including adjustable pedestals, 
              ipe wood deck, ipe lumber, concrete pavers, and green roof systems.
            </p>
          </div>

          {/* Short Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Short Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products/porcelain-paver" className="hover:text-white transition-colors">Porcelain Paver</Link></li>
              <li><Link to="/products/adjustable-pedestal" className="hover:text-white transition-colors">Adjustable Pedestal</Link></li>
              <li><Link to="/products/synthetic-systems" className="hover:text-white transition-colors">Synthetic Turf Systems</Link></li>
              <li><Link to="/products/ipe-tile-systems" className="hover:text-white transition-colors">IPE Tile Systems</Link></li>
              <li><Link to="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Quick Links & Legal */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm mb-6">
              <li><Link to="/products" className="hover:text-white transition-colors">Our Products</Link></li>
              <li><Link to="/resources" className="hover:text-white transition-colors">Resource Library</Link></li>
              <li><Link to="/pedestal-calculator" className="hover:text-white transition-colors">Pedestal Calculator</Link></li>
            </ul>
            <h3 className="text-white text-lg font-semibold mb-4">Legal & Policies</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms and Conditions</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/distance-sales-agreement" className="hover:text-white transition-colors">Distance Sales Agreement</Link></li>
              <li><Link to="/return-policy" className="hover:text-white transition-colors">Return Policy</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link></li>
            </ul>
          </div>

          {/* Contact & Payment */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:+${phoneNumber}`} className="hover:text-white transition-colors">(516) 774-1808</a>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:info@tileandturf.com" className="hover:text-white transition-colors">info@tileandturf.com</a>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>5424 73rd Pl<br />Maspeth, NY 11378</span>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="text-white text-sm font-semibold mb-2">Payment Methods</h4>
              <img 
                src={creditCardImage} 
                alt="Accepted Payment Methods" 
                className="h-12 object-contain"
              />
              <p className="text-sm mt-4">
                We currently serve customers in the United States only.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Tile and Turf. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

