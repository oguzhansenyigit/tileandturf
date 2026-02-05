import React from 'react'
import { useSettings } from '../context/SettingsContext'

const ShippingPolicy = () => {
  const { phoneNumber } = useSettings()
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Shipping Policy</h1>
        <p className="text-gray-600 mb-8">Effective Date: June 12, 2025</p>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed mb-8">
            Thank you for visiting and shopping at Tile and Turf. Below are the terms and conditions that constitute our Shipping Policy.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Domestic Shipping Policy (United States)</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Shipment Processing Time</h3>
            <p className="text-gray-700 leading-relaxed">
              All orders are processed within 7–14 business days. Orders are not shipped or delivered on weekends or holidays.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              If we are experiencing a high volume of orders or delays due to stock availability, shipments may be delayed by a few days. Please allow additional days in transit for delivery. If there will be a significant delay, we will contact you via email or phone.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Shipping Rates & Delivery Estimates</h3>
            <p className="text-gray-700 leading-relaxed">
              Shipping charges for your order will be calculated and displayed at checkout. We offer standard ground shipping, freight delivery for larger items (such as porcelain pavers or ipe tiles), and expedited options upon request.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4 mb-2">Estimated delivery time:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Standard Ground:</strong> 7–14 business days</li>
              <li><strong>Freight Delivery:</strong> 5–10 business days (depending on your location)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Delivery delays can occasionally occur.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Shipment to P.O. Boxes or APO/FPO Addresses</h3>
            <p className="text-gray-700 leading-relaxed">
              We do not ship to P.O. boxes or APO/FPO addresses at this time due to the size and nature of our products.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Shipment Confirmation & Order Tracking</h3>
            <p className="text-gray-700 leading-relaxed">
              You will receive a Shipment Confirmation email once your order has shipped, containing your tracking number(s).
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Damages</h3>
            <p className="text-gray-700 leading-relaxed">
              Tile and Turf is not liable for any products damaged or lost during shipping. If your order arrives damaged, please contact the shipment carrier or our support team to file a claim. Save all packaging materials and damaged goods before filing a claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about our Shipping Policy, please contact us at:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
              <li>Email: <a href="mailto:info@tileandturf.com" className="text-primary hover:underline">info@tileandturf.com</a></li>
              <li>Phone: <a href={`tel:+${phoneNumber}`} className="text-primary hover:underline">(516) 774-1808</a></li>
              <li>Address: 5424 73rd Pl, Maspeth, NY 11378</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ShippingPolicy

