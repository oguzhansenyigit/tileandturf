import React, { useState } from 'react'
import axios from 'axios'
import { useSettings } from '../context/SettingsContext'

const Contact = () => {
  const { phoneNumber } = useSettings()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSubmitStatus(null)

    try {
      // Here you can implement an API endpoint to send emails
      // For now, we'll use a simple mailto link as fallback
      const mailtoLink = `mailto:info@tileandturf.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}`)}`
      window.location.href = mailtoLink
      
      setSubmitStatus({ type: 'success', message: 'Thank you for contacting us! Your message has been sent.' })
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Error sending message. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const address = "5424 73rd Pl, Maspeth, NY 11378"
  const googleMapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Contact Us</h1>
        <p className="text-gray-600 mb-12 text-center">
          Get in touch with us for any inquiries, questions, or support
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h2>
              
              {/* Phone */}
              <div className="flex items-start space-x-4 mb-6 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Phone</h3>
                  <a href={`tel:+${phoneNumber}`} className="text-primary hover:text-primary-dark font-semibold text-lg transition-colors">
                    (516) 774-1808
                  </a>
                  <p className="text-sm text-gray-600 mt-1">Call us during business hours</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4 mb-6 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Email</h3>
                  <a href="mailto:info@tileandturf.com" className="text-primary hover:text-primary-dark font-semibold transition-colors break-all">
                    info@tileandturf.com
                  </a>
                  <p className="text-sm text-gray-600 mt-1">Send us an email anytime</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-4 mb-6 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Address</h3>
                  <p className="text-gray-700 font-medium">
                    5424 73rd Pl<br />
                    Maspeth, NY 11378
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span>View on Maps</span>
                    </a>
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span>Get Directions</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-primary/20">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Business Hours</span>
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p className="flex justify-between">
                    <span className="font-semibold">Monday - Friday:</span>
                    <span className="text-primary font-bold">07:00 - 18:00</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold">Saturday - Sunday:</span>
                    <span className="text-primary font-bold">07:00 - 14:00</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form & Map */}
          <div className="space-y-8">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  ></textarea>
                </div>

                {submitStatus && (
                  <div className={`p-4 rounded-lg ${
                    submitStatus.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {submitStatus.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Google Maps */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Find Us on Map</h2>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="w-full h-[400px]">
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Tile and Turf Location"
                    className="w-full h-full"
                  ></iframe>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Address:</strong> {address}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-primary hover:text-primary-dark text-sm font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span>Open in Google Maps</span>
                    </a>
                    <span className="text-gray-400">|</span>
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 text-sm font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span>Get Directions</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact

