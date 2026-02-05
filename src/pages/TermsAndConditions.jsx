import React from 'react'
import { useSettings } from '../context/SettingsContext'

const TermsAndConditions = () => {
  const { phoneNumber } = useSettings()
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Terms and Conditions</h1>
        <p className="text-gray-600 mb-8">Effective Date: June 12, 2025</p>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 mb-6">
            Welcome to Tile and Turf! These Terms and Conditions govern your use of our website and the purchase of products from our online store.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using our website, you agree to be bound by these Terms and Conditions. If you do not agree, you may not use the website or purchase any products.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Products & Descriptions</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive to ensure that all product descriptions, images, and specifications are accurate. However, we do not warrant that product descriptions or other content on the site are error-free. In the event of a mistake, we reserve the right to correct it and revise your order accordingly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Pricing & Payment</h2>
            <p className="text-gray-700 leading-relaxed">
              All prices are listed in U.S. dollars. We reserve the right to change pricing at any time without notice. Payment must be received in full before order processing. We accept most major credit cards and PayPal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Order Acceptance & Cancellation</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to accept or reject any order. If we cancel your order after payment, we will issue a full refund.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Shipping & Delivery</h2>
            <p className="text-gray-700 leading-relaxed">
              Refer to our Shipping Policy for detailed information. Risk of loss passes to you upon delivery of the order to the carrier.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Returns & Refunds</h2>
            <p className="text-gray-700 leading-relaxed">
              Due to the nature of construction and landscaping materials, returns are accepted only in the case of defective or incorrect items. All return requests must be submitted within 14 days of delivery. Contact us at info@tileandturf.com for return authorization.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All content on our website, including images, text, logos, and product names, is the property of Tile and Turf and protected by copyright and trademark laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              We shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by the laws of the State of New York, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
              <li>Email: <a href="mailto:info@tileandturf.com" className="text-primary hover:underline">info@tileandturf.com</a></li>
              <li>Phone: <a href={`tel:+${phoneNumber}`} className="text-primary hover:underline">(516) 774-1808</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions

