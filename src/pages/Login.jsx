import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.password) newErrors.password = 'Password is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/login.php', {
        email: formData.email,
        password: formData.password
      })
      
      if (response.data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('token', response.data.token || 'authenticated')
        
        // Trigger custom event so Header can update (storage event only works across tabs)
        window.dispatchEvent(new Event('userChanged'))
        
        // Check if account is approved
        if (response.data.user.status === 'pending') {
          alert('Your account is still pending approval. Please wait for admin approval.')
          navigate('/')
        } else {
          alert('Login successful!')
          navigate('/my-account')
        }
      } else {
        alert(response.data.error || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Sign In</h1>
        <p className="text-gray-600 mb-8 text-center">
          Sign in to your account to track orders and access exclusive features
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:bg-gray-300"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

