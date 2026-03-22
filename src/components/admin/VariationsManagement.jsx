import React, { useState, useEffect } from 'react'
import axios from 'axios'

const COLOR_OPTION_SIZE_TAGS = ['12x48', '24x24', '24x48']

// Option key for product pricing: string option or option.label for color
const getOptionKey = (option) =>
  typeof option === 'string' ? option : (option?.label ?? '')

const getOptionLabel = (option) =>
  typeof option === 'string' ? option : (option?.label ?? '')

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
  const [newColorLabel, setNewColorLabel] = useState('')
  /** 'img-0' | 'room-0' | null */
  const [uploadingSlot, setUploadingSlot] = useState(null)

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

  const isColorType = variationForm.type === 'color'

  const normalizeOptionsForType = (options, type) => {
    if (!Array.isArray(options)) return []
    if (type === 'color') {
      return options.map((o) => {
        if (typeof o === 'string') return { label: o, image: '', sizes: [], roomScene: '' }
        const sizes = Array.isArray(o?.sizes)
          ? o.sizes.filter((s) => typeof s === 'string' && COLOR_OPTION_SIZE_TAGS.includes(s))
          : []
        return {
          label: o?.label ?? '',
          image: o?.image ?? '',
          sizes,
          roomScene: o?.roomScene ?? '',
        }
      })
    }
    return options.map((o) => (typeof o === 'string' ? o : o?.label ?? ''))
  }

  const handleAddOption = () => {
    if (isColorType) {
      if (newColorLabel.trim()) {
        setVariationForm({
          ...variationForm,
          options: [...variationForm.options, { label: newColorLabel.trim(), image: '', sizes: [], roomScene: '' }]
        })
        setNewColorLabel('')
      }
    } else {
      if (newOption.trim()) {
        setVariationForm({
          ...variationForm,
          options: [...variationForm.options, newOption.trim()]
        })
        setNewOption('')
      }
    }
  }

  const handleRemoveOption = (index) => {
    const newOptions = variationForm.options.filter((_, i) => i !== index)
    setVariationForm({ ...variationForm, options: newOptions })
  }

  const toggleColorOptionSize = (index, sizeTag) => {
    const newOptions = [...variationForm.options]
    const opt = newOptions[index]
    if (typeof opt !== 'object' || opt === null) return
    const prev = Array.isArray(opt.sizes) ? [...opt.sizes] : []
    const i = prev.indexOf(sizeTag)
    if (i >= 0) prev.splice(i, 1)
    else prev.push(sizeTag)
    newOptions[index] = { ...opt, sizes: prev }
    setVariationForm({ ...variationForm, options: newOptions })
  }

  const handleColorOptionImageUpload = async (index, file) => {
    if (!file) return
    setUploadingSlot(`img-${index}`)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post('/api/upload-image.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.success && data.url) {
        const newOptions = [...variationForm.options]
        const opt = newOptions[index]
        if (typeof opt === 'object' && opt !== null) {
          newOptions[index] = { ...opt, image: data.url }
          setVariationForm({ ...variationForm, options: newOptions })
        }
      } else {
        alert(data.error || 'Image upload failed')
      }
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Image upload failed')
    } finally {
      setUploadingSlot(null)
    }
  }

  const handleColorOptionRoomSceneUpload = async (index, file) => {
    if (!file) return
    setUploadingSlot(`room-${index}`)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post('/api/upload-image.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.success && data.url) {
        const newOptions = [...variationForm.options]
        const opt = newOptions[index]
        if (typeof opt === 'object' && opt !== null) {
          newOptions[index] = { ...opt, roomScene: data.url }
          setVariationForm({ ...variationForm, options: newOptions })
        }
      } else {
        alert(data.error || 'Room scene upload failed')
      }
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Room scene upload failed')
    } finally {
      setUploadingSlot(null)
    }
  }

  const clearColorOptionRoomScene = (index) => {
    const newOptions = [...variationForm.options]
    const opt = newOptions[index]
    if (typeof opt === 'object' && opt !== null) {
      newOptions[index] = { ...opt, roomScene: '' }
      setVariationForm({ ...variationForm, options: newOptions })
    }
  }

  const handleVariationSubmit = async (e) => {
    e.preventDefault()
    try {
      const optionsToSave = normalizeOptionsForType(variationForm.options, variationForm.type)
      const variationData = {
        ...variationForm,
        options: optionsToSave
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
    const opts = Array.isArray(variation.options) ? variation.options : []
    const normalized = normalizeOptionsForType(opts, variation.type || 'select')
    setVariationForm({
      name: variation.name || '',
      type: variation.type || 'select',
      options: normalized,
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
                onChange={(e) => {
                  const newType = e.target.value
                  setVariationForm({
                    ...variationForm,
                    type: newType,
                    options: normalizeOptionsForType(variationForm.options, newType)
                  })
                }}
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
              {isColorType ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newColorLabel}
                      onChange={(e) => setNewColorLabel(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddOption()
                        }
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Color name (e.g., Natural, Walnut)"
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
                      {variationForm.options.map((option, index) => {
                        const label = getOptionLabel(option)
                        const image = typeof option === 'object' && option?.image
                        const sizes = typeof option === 'object' && Array.isArray(option.sizes) ? option.sizes : []
                        const roomScene = typeof option === 'object' && option?.roomScene
                        return (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col items-center"
                          >
                            <div className="w-20 h-20 rounded-lg border border-gray-300 bg-white overflow-hidden mb-2 flex items-center justify-center">
                              {image ? (
                                <img src={image} alt={label} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-gray-400 text-xs">No image</span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-800 mb-1">{label}</span>
                            <div className="flex flex-wrap gap-2 justify-center mb-2 w-full">
                              {COLOR_OPTION_SIZE_TAGS.map((tag) => (
                                <label
                                  key={tag}
                                  className="inline-flex items-center gap-1 text-[11px] text-gray-700 cursor-pointer select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={sizes.includes(tag)}
                                    onChange={() => toggleColorOptionSize(index, tag)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  {tag}
                                </label>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1 justify-center">
                              <label className="cursor-pointer text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary-dark">
                                {uploadingSlot === `img-${index}` ? 'Uploading…' : 'Swatch image'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingSlot !== null}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0]
                                    if (f) handleColorOptionImageUpload(index, f)
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(index)}
                                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="w-full mt-3 pt-3 border-t border-gray-200">
                              <p className="text-[11px] font-semibold text-gray-600 mb-1.5 text-center">Room scene</p>
                              <div className="w-full h-16 rounded border border-dashed border-gray-300 bg-white overflow-hidden mb-2 flex items-center justify-center">
                                {roomScene ? (
                                  <img src={roomScene} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-gray-400 text-[10px] px-1 text-center">Hero / lifestyle</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 justify-center">
                                <label className="cursor-pointer text-xs px-2 py-1 bg-slate-600 text-white rounded hover:bg-slate-700">
                                  {uploadingSlot === `room-${index}` ? 'Uploading…' : 'Upload room scene'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingSlot !== null}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0]
                                      if (f) handleColorOptionRoomSceneUpload(index, f)
                                      e.target.value = ''
                                    }}
                                  />
                                </label>
                                {roomScene && (
                                  <button
                                    type="button"
                                    onClick={() => clearColorOptionRoomScene(index)}
                                    className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
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
                </>
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
                  <div className="flex flex-wrap gap-1 items-center">
                    {Array.isArray(variation.options) && variation.options.length > 0 ? (
                      variation.options.map((option, index) => {
                        const label = getOptionLabel(option)
                        const img = typeof option === 'object' && option?.image
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {img && (
                              <img src={img} alt={label} className="w-5 h-5 rounded object-cover" />
                            )}
                            {label}
                          </span>
                        )
                      })
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

