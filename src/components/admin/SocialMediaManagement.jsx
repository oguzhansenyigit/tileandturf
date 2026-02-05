import React, { useState, useEffect } from 'react'
import axios from 'axios'

const SocialMediaManagement = () => {
  const [socialMedia, setSocialMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    platform: 'whatsapp',
    url: '',
    icon: ''
  })

  useEffect(() => {
    fetchSocialMedia()
  }, [])

  const fetchSocialMedia = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/social-media.php')
      setSocialMedia(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching social media:', error)
      setSocialMedia([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await axios.put('/api/admin/social-media.php', { ...formData, id: editingItem.id })
        alert('Social media updated successfully!')
      } else {
        await axios.post('/api/admin/social-media.php', formData)
        alert('Social media added successfully!')
      }
      setEditingItem(null)
      setFormData({
        platform: 'whatsapp',
        url: '',
        icon: ''
      })
      fetchSocialMedia()
    } catch (error) {
      console.error('Error saving social media:', error)
      alert('Error saving social media')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      platform: item.platform || 'whatsapp',
      url: item.url || '',
      icon: item.icon || ''
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this social media link?')) return
    try {
      await axios.delete(`/api/admin/social-media.php?id=${id}`)
      alert('Social media deleted successfully!')
      fetchSocialMedia()
    } catch (error) {
      console.error('Error deleting social media:', error)
      alert('Error deleting social media')
    }
  }

  const platforms = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'youtube', label: 'YouTube' }
  ]

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
        <h2 className="text-2xl font-bold text-gray-800">Social Media Management</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {editingItem ? 'Edit Social Media' : 'Add Social Media'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Platform *</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
              >
                {platforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">URL *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                required
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">Icon (Optional)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Icon class or SVG code"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {editingItem ? 'Update' : 'Add'}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null)
                  setFormData({
                    platform: 'whatsapp',
                    url: '',
                    icon: ''
                  })
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Platform</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">URL</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {socialMedia.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold capitalize">{item.platform}</td>
                <td className="px-6 py-4 text-sm">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {item.url}
                  </a>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-primary hover:text-primary-dark font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
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
        {socialMedia.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No social media links found. Add your first social media link!
          </div>
        )}
      </div>
    </div>
  )
}

export default SocialMediaManagement

