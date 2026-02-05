import React from 'react'
import { useSettings } from '../context/SettingsContext'

const PrivacyPolicy = () => {
  const { phoneNumber } = useSettings()
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Privacy Policy & Personal Data Protection</h1>
        <p className="text-gray-600 mb-8">Last Updated: March 18, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Tile and Turf ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Name, email address, phone number, and shipping address</li>
              <li>Payment information (processed securely through our payment processors)</li>
              <li>Order history and preferences</li>
              <li>Communication preferences</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders and our products</li>
              <li>Improve our website and customer service</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Data Protection</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy

