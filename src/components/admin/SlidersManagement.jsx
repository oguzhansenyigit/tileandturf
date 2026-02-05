import React, { useState, useEffect } from 'react'
import axios from 'axios'

const SlidersManagement = () => {
  const [sliders, setSliders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSlider, setEditingSlider] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    button_text: '',
    button_link: '',
    order_index: 0,
    status: 'active',
    image_position_x: 'center',
    image_position_y: 'center'
  })

  useEffect(() => {
    fetchSliders()
  }, [])

  const fetchSliders = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/sliders.php')
      setSliders(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching sliders:', error)
      setSliders([])
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/upload-image.php', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setFormData({ ...formData, image: response.data.url })
        setImagePreview(response.data.url)
      } else {
        alert('Error uploading image: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.image) {
      alert('Please upload an image for the slider')
      return
    }

    try {
      let response
      if (editingSlider) {
        response = await axios.put('/api/admin/sliders.php', { ...formData, id: editingSlider.id })
        if (response.data.success) {
          alert('Slider updated successfully!')
        } else {
          throw new Error(response.data.error || 'Update failed')
        }
      } else {
        response = await axios.post('/api/admin/sliders.php', formData)
        if (response.data.success) {
          alert('Slider added successfully!')
        } else {
          throw new Error(response.data.error || 'Add failed')
        }
      }
      
      // Reset form
      setShowForm(false)
      setEditingSlider(null)
      setImagePreview('')
      setFormData({
        title: '',
        description: '',
        image: '',
        button_text: '',
        button_link: '',
        order_index: sliders.length,
        status: 'active',
        image_position_x: 'center',
        image_position_y: 'center'
      })
      
      // Refresh slider list
      await fetchSliders()
    } catch (error) {
      console.error('Error saving slider:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
      alert('Error saving slider: ' + errorMessage)
    }
  }

  const handleEdit = (slider) => {
    setEditingSlider(slider)
    setFormData({
      title: slider.title || '',
      description: slider.description || '',
      image: slider.image || '',
      button_text: slider.button_text || '',
      button_link: slider.button_link || '',
      order_index: slider.order_index || 0,
      status: slider.status || 'active',
      image_position_x: slider.image_position_x || 'center',
      image_position_y: slider.image_position_y || 'center'
    })
    setImagePreview(slider.image || '')
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this slider?')) return
    try {
      await axios.delete(`/api/admin/sliders.php?id=${id}`)
      alert('Slider deleted successfully!')
      fetchSliders()
    } catch (error) {
      console.error('Error deleting slider:', error)
      alert('Error deleting slider')
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
        <h2 className="text-2xl font-bold text-gray-800">Sliders Management</h2>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingSlider(null)
            setImagePreview('')
            setFormData({
              title: '',
              description: '',
              image: '',
              button_text: '',
              button_link: '',
              order_index: sliders.length,
              status: 'active',
              image_position_x: 'center',
              image_position_y: 'center'
            })
          }}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          Add Slider
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {editingSlider ? 'Edit Slider' : 'Add New Slider'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows="3"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Slider Image *</label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required={!formData.image}
                  />
                  {uploadingImage && (
                    <p className="text-sm text-gray-500">Uploading image...</p>
                  )}
                  {(imagePreview || formData.image) && (
                    <div className="mt-3">
                      <img
                        src={imagePreview || formData.image}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image: '' })
                          setImagePreview('')
                        }}
                        className="mt-2 text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Image Position X</label>
                <select
                  value={formData.image_position_x}
                  onChange={(e) => setFormData({ ...formData, image_position_x: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Image Position Y</label>
                <select
                  value={formData.image_position_y}
                  onChange={(e) => setFormData({ ...formData, image_position_y: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Button Text</label>
                <input
                  type="text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Button Link</label>
                <input
                  type="text"
                  value={formData.button_link}
                  onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Order Index</label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                {editingSlider ? 'Update Slider' : 'Add Slider'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingSlider(null)
                  setImagePreview('')
                  setFormData({
                    title: '',
                    description: '',
                    image: '',
                    button_text: '',
                    button_link: '',
                    order_index: sliders.length,
                    status: 'active',
                    image_position_x: 'center',
                    image_position_y: 'center'
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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Image</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sliders.sort((a, b) => a.order_index - b.order_index).map((slider) => (
              <tr key={slider.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{slider.order_index}</td>
                <td className="px-6 py-4 text-sm font-semibold">{slider.title}</td>
                <td className="px-6 py-4 text-sm">
                  <img src={slider.image} alt={slider.title} className="w-20 h-12 object-cover rounded" />
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    slider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {slider.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(slider)}
                      className="text-primary hover:text-primary-dark font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(slider.id)}
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
        {sliders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No sliders found. Add your first slider!
          </div>
        )}
      </div>
    </div>
  )
}

export default SlidersManagement

