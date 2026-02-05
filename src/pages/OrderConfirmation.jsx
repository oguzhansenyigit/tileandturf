import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSettings } from '../context/SettingsContext'
import { useCart } from '../context/CartContext'

const OrderConfirmation = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const { whatsappNumber, phoneNumber } = useSettings()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Clear cart when order confirmation page loads (if order was just placed)
  useEffect(() => {
    const orderPlaced = sessionStorage.getItem('orderPlaced')
    if (orderPlaced === 'true') {
      clearCart()
      sessionStorage.removeItem('orderPlaced')
      sessionStorage.removeItem('orderId')
    }
  }, [clearCart])

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false)
        return
      }
      
      try {
        const response = await axios.get(`/api/admin/order-details.php?id=${orderId}`)
        if (response.data && response.data.id) {
          setOrder(response.data)
        } else {
          setOrder(null)
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const handleSendEmail = async () => {
    if (!order || !order.email) return

    setSendingEmail(true)
    try {
      const response = await axios.post('/api/send-order-email.php', {
        order_id: orderId,
        email: order.email
      })
      
      if (response.data.success) {
        setEmailSent(true)
        alert('Order confirmation email sent successfully!')
      } else {
        alert('Error sending email: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Error sending email. Please try again.')
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Order Not Found</h1>
        <button
          onClick={() => navigate('/products')}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    )
  }

  const handleWhatsApp = () => {
    const message = `Hello, I have a question about my order: ${order.order_number || `ORD-${order.id}`}`
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCall = () => {
    window.location.href = `tel:+${phoneNumber}`
  }

  const orderNumber = order.order_number || `ORD-${order.id}`

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-8 mb-8 rounded-lg shadow-lg">
          <div className="flex items-start mb-4">
            <div className="bg-green-500 rounded-full p-3 mr-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-green-800 mb-2">Thank You for Your Order!</h1>
              <p className="text-green-700 text-lg">Your order has been received and is being processed.</p>
            </div>
          </div>
          
          {/* Order Number - Prominent */}
          <div className="bg-white rounded-lg p-6 mt-6 border-2 border-green-500">
            <p className="text-gray-600 font-semibold mb-2 text-center">Your Order Number:</p>
            <p className="text-3xl font-bold text-primary text-center">{orderNumber}</p>
            <p className="text-gray-500 text-sm mt-2 text-center">Please save this number for your records</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-semibold">Order Number:</span>
              <span className="font-bold text-xl text-primary">{orderNumber}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-semibold">Total Amount:</span>
              <span className="font-bold text-2xl text-gray-800">${(parseFloat(order.total) || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-semibold">Status:</span>
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                {order.status || 'Pending'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-semibold">Email:</span>
              <span className="text-gray-800">{order.email}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Send Invoice to Email</h3>
          <p className="text-gray-600 mb-4">
            Click the button below to send your order confirmation and invoice to: <strong>{order.email}</strong>
          </p>
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail || emailSent}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all transform ${
              emailSent
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-primary hover:bg-primary-dark text-white hover:scale-[1.02] active:scale-[0.98]'
            } ${sendingEmail ? 'opacity-50 cursor-not-allowed' : ''} shadow-md hover:shadow-lg`}
          >
            {sendingEmail ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : emailSent ? (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email Sent Successfully!
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Invoice to Email
              </span>
            )}
          </button>
        </div>

        {/* Support Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">Contact us for any questions about your order</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>WhatsApp Support</span>
            </button>
            <button
              onClick={handleCall}
              className="bg-primary hover:bg-primary-dark text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Call Us: (516) 774-1808</span>
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded-lg">
          <h3 className="text-xl font-bold text-blue-800 mb-3">What's Next?</h3>
          <p className="text-blue-700 mb-3">
            A customer service representative will contact you shortly to confirm your order details and arrange payment.
          </p>
          <p className="text-blue-700 font-semibold">
            Your order confirmation and invoice will be sent to: <strong className="text-blue-900">{order.email}</strong>
          </p>
        </div>

        {/* Continue Shopping */}
        <div className="text-center">
          <button
            onClick={() => navigate('/products')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation

