import React from 'react'

const DistanceSalesAgreement = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Distance Sales Agreement</h1>
        <p className="text-gray-600 mb-8">Last Updated: March 18, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Parties</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>Seller:</strong> TileandTurf
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              Contact Email: <a href="mailto:info@tileandturf.com" className="text-primary hover:underline">info@tileandturf.com</a>
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Buyer:</strong> The Customer who places an order through our website or other distance communication methods.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Subject and Scope</h2>
            <p className="text-gray-700 leading-relaxed">
              This Distance Sales Agreement regulates the rights and obligations of the parties in relation to the sale and purchase of products through distance communication methods in accordance with the applicable laws and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Shipping and Delivery</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Shipping costs are calculated based on current FedEx Express rates.</li>
              <li>Shipping fees will be displayed during checkout before payment confirmation.</li>
              <li>Delivery times may vary depending on the destination and shipping method selected.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Right of Withdrawal and Return Policy</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>The customer has the right to withdraw from the contract within 14 days from the date of product delivery without stating any reason.</li>
              <li>Our company does not accept product returns except for damaged items.</li>
              <li>Returns for damaged products are accepted after inspection and confirmation of the damage.</li>
              <li>To initiate a return for damaged products, please contact: <a href="mailto:info@tileandturf.com" className="text-primary hover:underline">info@tileandturf.com</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Payment Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              All payments must be made in full at the time of purchase. We accept various payment methods as displayed during checkout.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Product Information</h2>
            <p className="text-gray-700 leading-relaxed">
              All product information, including prices, specifications, and availability, is subject to change without notice. Colors of products may vary slightly from their appearance on the website due to digital display variations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Damaged Products</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Claims for damaged products must be reported within 24 hours of delivery.</li>
              <li>Photographic evidence of damage must be provided.</li>
              <li>Shipping costs for returning damaged products will be covered by TileandTurf.</li>
              <li>Replacement or refund will be processed after inspection of the returned damaged product.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Customer Service</h2>
            <p className="text-gray-700 leading-relaxed">
              For any questions or concerns regarding this agreement or our products, please contact us at:
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              Email: <a href="mailto:info@tileandturf.com" className="text-primary hover:underline">info@tileandturf.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              This agreement shall be governed by and construed in accordance with the laws of NYC/Maspeth. Any disputes arising from this agreement shall be subject to the exclusive jurisdiction of the courts of NYC/Maspeth.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Amendments</h2>
            <p className="text-gray-700 leading-relaxed">
              TileandTurf reserves the right to modify this agreement at any time. Any changes will be effective immediately upon posting on our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default DistanceSalesAgreement

