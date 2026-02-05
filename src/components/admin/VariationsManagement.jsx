import React, { useState, useEffect } from 'react'
import axios from 'axios'

const VariationsManagement = () => {
  const [variations, setVariations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVariationForm, setShowVariationForm] = useState(false)
  const [editingVariation, setEditingVariation] = useState(null)
  const [variationForm, setVariationForm] = useState({
    name: '',
    type: 'select',
    options: [],
    description: ''
  })
  const [newOption, setNewOption] = useState('')

  useEffect(() => {
    fetchVariations()
  }, [])

  const fetchVariations = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/variations.php')
      setVariations(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching variations:', error)
      setVariations([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddOption = () => {
    if (newOption.trim()) {
      setVariationForm({
        ...variationForm,
        options: [...variationForm.options, newOption.trim()]
      })
      setNewOption('')
    }
  }

  const handleRemoveOption = (index) => {
    const newOptions = variationForm.options.filter((_, i) => i !== index)
    setVariationForm({ ...variationForm, options: newOptions })
  }

  const handleVariationSubmit = async (e) => {
    e.preventDefault()
    try {
      const variationData = {
        ...variationForm,
        options: variationForm.options
      }

      if (editingVariation) {
        await axios.put('/api/admin/variations.php', { ...variationData, id: editingVariation.id })
        alert('Variation updated successfully!')
      } else {
        await axios.post('/api/admin/variations.php', variationData)
        alert('Variation added successfully!')
      }

      setShowVariationForm(false)
      setEditingVariation(null)
      setVariationForm({
        name: '',
        type: 'select',
        options: [],
        description: ''
      })
      fetchVariations()
    } catch (error) {
      console.error('Error saving variation:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Error saving variation'
      alert('Error saving variation: ' + errorMessage)
    }
  }

  const handleEditVariation = (variation) => {
    setEditingVariation(variation)
    setVariationForm({
      name: variation.name || '',
      type: variation.type || 'select',
      options: Array.isArray(variation.options) ? variation.options : [],
      description: variation.description || ''
    })
    setShowVariationForm(true)
  }

  const handleDeleteVariation = async (id) => {
    if (!confirm('Are you sure you want to delete this variation?')) return
    try {
      await axios.delete(`/api/admin/variations.php?id=${id}`)
      alert('Variation deleted successfully!')
      fetchVariations()
    } catch (error) {
      console.error('Error deleting variation:', error)
      alert('Error deleting variation')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Variation Management</h2>
        <button
          onClick={() => {
            setShowVariationForm(true)
            setEditingVariation(null)
            setVariationForm({
              name: '',
              type: 'select',
              options: [],
              description: ''
            })
          }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          Add Variation
        </button>
      </div>

      {showVariationForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {editingVariation ? 'Edit Variation' : 'Add New Variation'}
          </h3>
          <form onSubmit={handleVariationSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Variation Name *</label>
              <input
                type="text"
                value={variationForm.name}
                onChange={(e) => setVariationForm({ ...variationForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="e.g., Size, Color, Material"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Variation Type</label>
              <select
                value={variationForm.type}
                onChange={(e) => setVariationForm({ ...variationForm, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="select">Select</option>
                <option value="color">Color</option>
                <option value="size">Size</option>
                <option value="material">Material</option>
                <option value="finish">Finish</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Options *</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddOption()
                    }
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Enter option value (e.g., Small, Red, Wood)"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Add Option
                </button>
              </div>
              {variationForm.options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {variationForm.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-lg"
                    >
                      <span className="text-sm text-gray-700">{option}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {variationForm.options.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">Add at least one option</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Description</label>
              <textarea
                value={variationForm.description}
                onChange={(e) => setVariationForm({ ...variationForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows="3"
                placeholder="Optional description for this variation"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={variationForm.options.length === 0}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {editingVariation ? 'Update Variation' : 'Add Variation'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVariationForm(false)
                  setEditingVariation(null)
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Options</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {variations.map((variation) => (
              <tr key={variation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{variation.id}</td>
                <td className="px-6 py-4 text-sm font-semibold">{variation.name}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {variation.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(variation.options) && variation.options.length > 0 ? (
                      variation.options.map((option, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {option}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">No options</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditVariation(variation)}
                      className="text-primary hover:text-primary-dark font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteVariation(variation.id)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {variations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No variations found. Add your first variation!
          </div>
        )}
      </div>
    </div>
  )
}

export default VariationsManagement

