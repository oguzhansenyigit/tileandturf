import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import ProductSection from '../components/ProductSection'

const Products = () => {
  const { category: categoryParam } = useParams()
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('search')
  const categoryQuery = searchParams.get('category')
  
  // Use category from query param if available, otherwise use URL param
  const category = categoryQuery || categoryParam

  return (
    <div className="pt-8">
      <div className="container mx-auto px-4 mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          {searchTerm 
            ? `Search Results: "${searchTerm}"`
            : category 
              ? category.replace(/-/g, ' ').toUpperCase() 
              : 'All Products'
          }
        </h1>
      </div>
      <ProductSection category={category} />
    </div>
  )
}

export default Products

