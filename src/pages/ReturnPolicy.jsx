import React from 'react'

const ReturnPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Return Policy</h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              Our refund and returns policy lasts 30 days. If 30 days have passed since your purchase, we can't offer you a full refund or exchange.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Non-Returnable Items</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Several types of goods are exempt from being returned. Perishable goods such as food, flowers, newspapers or magazines cannot be returned. We also do not accept products that are intimate or sanitary goods, hazardous materials, or flammable liquids or gases.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">Additional non-returnable items:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Gift cards</li>
              <li>Downloadable software products</li>
              <li>Some health and personal care items</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Return Requirements</h2>
            <p className="text-gray-700 leading-relaxed">
              To complete your return, we require a receipt or proof of purchase. Please do not send your purchase back to the manufacturer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Partial Refunds</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              There are certain situations where only partial refunds are granted:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Book with obvious signs of use</li>
              <li>CD, DVD, VHS tape, software, video game, cassette tape, or vinyl record that has been opened</li>
              <li>Any item not in its original condition, is damaged or missing parts for reasons not due to our error</li>
              <li>Any item that is returned more than 30 days after delivery</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Refunds</h2>
            <p className="text-gray-700 leading-relaxed">
              Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Late or Missing Refunds</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              If you haven't received a refund yet, first check your bank account again. Then contact your credit card company, it may take some time before your refund is officially posted. Next contact your bank. There is often some processing time before a refund is posted.
            </p>
            <p className="text-gray-700 leading-relaxed">
              If you've done all of this and you still have not received your refund yet, please contact us at <a href="mailto:info@tileandturf.com" className="text-primary hover:underline">info@tileandturf.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sale Items</h2>
            <p className="text-gray-700 leading-relaxed">
              Only regular priced items may be refunded. Sale items cannot be refunded.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Exchanges</h2>
            <p className="text-gray-700 leading-relaxed">
              We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at <a href="mailto:info@tileandturf.com" className="text-primary hover:underline">info@tileandturf.com</a> and send your item to: 5424 73rd Pl, Maspeth, NY 11378.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gifts</h2>
            <p className="text-gray-700 leading-relaxed">
              If the item was marked as a gift when purchased and shipped directly to you, you'll receive a gift credit for the value of your return. Once the returned item is received, a gift certificate will be mailed to you.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              If the item wasn't marked as a gift when purchased, or the gift giver had the order shipped to themselves to give to you later, we will send a refund to the gift giver and they will find out about your return.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Shipping Returns</h2>
            <p className="text-gray-700 leading-relaxed">
              To return your product, you should mail your product to: <strong>5424 73rd Pl, Maspeth, NY 11378</strong>.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Depending on where you live, the time it may take for your exchanged product to reach you may vary. If you are returning more expensive items, you may consider using a trackable shipping service or purchasing shipping insurance. We don't guarantee that we will receive your returned item.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Need Help?</h2>
            <p className="text-gray-700 leading-relaxed">
              Contact us at <a href="mailto:info@tileandturf.com" className="text-primary hover:underline">info@tileandturf.com</a> for questions related to refunds and returns.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default ReturnPolicy

