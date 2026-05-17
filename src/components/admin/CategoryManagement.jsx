import React, { useState, useEffect } from 'react'
import axios from 'axios'

const CategoryManagement = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    datasheet_pdf: '',
    brochure_pdf: '',
    parent_id: ''
  })
  const [uploadingDatasheet, setUploadingDatasheet] = useState(false)
  const [uploadingBrochure, setUploadingBrochure] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/categories.php')
      setCategories(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handlePDFUpload = async (file, type) => {
    const uploadState = type === 'datasheet' ? setUploadingDatasheet : setUploadingBrochure
    uploadState(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await axios.post('/api/upload-pdf.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data.success) {
        setCategoryForm({ 
          ...categoryForm, 
          [type === 'datasheet' ? 'datasheet_pdf' : 'brochure_pdf']: response.data.url 
        })
        alert('PDF uploaded successfully!')
      } else {
        alert('Error uploading PDF: ' + response.data.error)
      }
    } catch (error) {
      console.error('Error uploading PDF:', error)
      alert('Error uploading PDF')
    } finally {
      uploadState(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const categoryData = {
        ...categoryForm,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
        parent_id: categoryForm.parent_id ? parseInt(categoryForm.parent_id) : null,
        // Ensure empty strings are sent as empty strings, not null (API will convert to NULL)
        datasheet_pdf: categoryForm.datasheet_pdf || '',
        brochure_pdf: categoryForm.brochure_pdf || ''
      }


      if (editingCategory) {
        const response = await axios.put('/api/categories.php', { ...categoryData, id: editingCategory.id })
        if (response.data.success) {
          alert('Category updated successfully!')
        } else {
          throw new Error(response.data.error || 'Update failed')
        }
      } else {
        const response = await axios.post('/api/categories.php', categoryData)
        if (response.data.success) {
          alert('Category added successfully!')
        } else {
          throw new Error(response.data.error || 'Add failed')
        }
      }
      
      setEditingCategory(null)
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        datasheet_pdf: '',
        brochure_pdf: '',
        parent_id: ''
      })
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error saving category'
      alert('Error saving category: ' + errorMessage)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      datasheet_pdf: category.datasheet_pdf || '',
      brochure_pdf: category.brochure_pdf || '',
      parent_id: category.parent_id || ''
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category? Products in this category will lose their category assignment.')) return
    
    try {
      await axios.delete(`/api/categories.php?id=${id}`)
      alert('Category deleted successfully!')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
    }
  }

  const getCategoryHierarchy = () => {
    const mainCategories = categories.filter(cat => !cat.parent_id || cat.parent_id === null || cat.parent_id === '')
    const categoryMap = {}
    
    categories.forEach(cat => {
      categoryMap[cat.id] = {
        ...cat,
        children: []
      }
    })
    
    categories.forEach(cat => {
      if (cat.parent_id && categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(cat)
      }
    })
    
    return mainCategories.map(cat => categoryMap[cat.id])
  }

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map((category) => (
      <div key={category.id} className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{category.name}</span>
              {category.parent_id && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Sub-category</span>
              )}
              {!category.parent_id && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Main Category</span>
              )}
            </div>
            <div className="mt-1 flex gap-4 text-xs text-gray-500">
              {category.datasheet_pdf && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Datasheet
                </span>
              )}
              {category.brochure_pdf && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Brochure
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(category)}
              className="px-3 py-1 bg-primary hover:bg-primary-dark text-white rounded text-sm font-semibold transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
        {category.children && category.children.length > 0 && (
          <div className="mt-2">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const categoryHierarchy = getCategoryHierarchy()
  const mainCategories = categories.filter(cat => !cat.parent_id || cat.parent_id === null || cat.parent_id === '')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
        <button
          onClick={() => {
            setEditingCategory(null)
            setCategoryForm({
              name: '',
              slug: '',
              description: '',
              datasheet_pdf: '',
              brochure_pdf: '',
              parent_id: ''
            })
          }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          Add Category
        </button>
      </div>

      {/* Category Form */}
      {(editingCategory || (!editingCategory && categoryForm.name)) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Category Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Slug</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Parent Category</label>
                <select
                  value={categoryForm.parent_id}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">None (Main Category)</option>
                  {mainCategories
                    .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a parent category to make this a sub-category. Leave empty for main category.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows="3"
                />
              </div>
            </div>

            {/* PDF Uploads */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Category PDFs</h4>
              <p className="text-sm text-gray-600 mb-4">
                PDFs added here will be available for all products in this category. Individual product PDFs will override category PDFs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Technical Datasheet PDF</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handlePDFUpload(e.target.files[0], 'datasheet')
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      disabled={uploadingDatasheet}
                    />
                    {uploadingDatasheet && (
                      <p className="text-sm text-gray-500">Uploading...</p>
                    )}
                    <input
                      type="text"
                      value={categoryForm.datasheet_pdf}
                      onChange={(e) => setCategoryForm({ ...categoryForm, datasheet_pdf: e.target.value })}
                      placeholder="Or enter PDF URL"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                    {categoryForm.datasheet_pdf && (
                      <div className="flex items-center gap-2">
                        <a
                          href={categoryForm.datasheet_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View PDF
                        </a>
                        <button
                          type="button"
                          onClick={() => setCategoryForm({ ...categoryForm, datasheet_pdf: '' })}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                          title="Remove PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Brochure PDF</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handlePDFUpload(e.target.files[0], 'brochure')
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      disabled={uploadingBrochure}
                    />
                    {uploadingBrochure && (
                      <p className="text-sm text-gray-500">Uploading...</p>
                    )}
                    <input
                      type="text"
                      value={categoryForm.brochure_pdf}
                      onChange={(e) => setCategoryForm({ ...categoryForm, brochure_pdf: e.target.value })}
                      placeholder="Or enter PDF URL"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                    {categoryForm.brochure_pdf && (
                      <div className="flex items-center gap-2">
                        <a
                          href={categoryForm.brochure_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View PDF
                        </a>
                        <button
                          type="button"
                          onClick={() => setCategoryForm({ ...categoryForm, brochure_pdf: '' })}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                          title="Remove PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryForm({
                    name: '',
                    slug: '',
                    description: '',
                    datasheet_pdf: '',
                    brochure_pdf: '',
                    parent_id: ''
                  })
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Categories Hierarchy</h3>
        {categoryHierarchy.length > 0 ? (
          <div className="space-y-2">
            {renderCategoryTree(categoryHierarchy)}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No categories found. Add your first category!
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryManagement

