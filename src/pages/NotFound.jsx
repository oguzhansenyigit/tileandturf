import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
        </div>

        {/* Error Message */}
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist. It may have been moved, deleted, or the URL might be incorrect.
        </p>

        {/* Suggestions */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Here are some helpful links:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link to="/" className="text-primary hover:text-primary-dark hover:underline">
                → Home Page
              </Link>
            </li>
            <li>
              <Link to="/products" className="text-primary hover:text-primary-dark hover:underline">
                → Our Products
              </Link>
            </li>
            <li>
              <Link to="/resources" className="text-primary hover:text-primary-dark hover:underline">
                → Resource Library
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-primary hover:text-primary-dark hover:underline">
                → Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Home Button */}
        <Link
          to="/"
          className="inline-block bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  )
}

export default NotFound
