import React, { useState } from 'react'
import { saveCartLead } from '../utils/saveCartLead'

/**
 * Capture email so we can remind shoppers who leave without ordering.
 * Shipping is always confirmed by phone.
 */
const CartEmailReminder = ({ cart, source = 'cart', compact = false }) => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('') // '', saving, ok, error
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e?.preventDefault()
    setStatus('saving')
    setMessage('')
    const res = await saveCartLead({ email, items: cart, source })
    if (res.ok) {
      setStatus('ok')
      setMessage('Saved. We will remind you by email if you leave — shipping is confirmed by phone.')
    } else if (res.error === 'invalid_email') {
      setStatus('error')
      setMessage('Enter a valid email.')
    } else {
      setStatus('error')
      setMessage('Could not save. Please try again.')
    }
  }

  if (!cart?.length) return null

  return (
    <div
      className={
        compact
          ? 'rounded-lg border border-gray-200 bg-gray-50 p-3 mb-3'
          : 'rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6'
      }
    >
      <p className={`font-semibold text-gray-800 ${compact ? 'text-xs mb-1' : 'text-sm mb-1'}`}>
        Email me this cart
      </p>
      <p className={`text-gray-500 ${compact ? 'text-[11px] mb-2' : 'text-xs mb-3'}`}>
        If you do not finish the order, we send one reminder. Exact shipping is quoted by phone at{' '}
        <a href="tel:+15167741808" className="text-primary font-medium whitespace-nowrap">
          (516) 774-1808
        </a>
        .
      </p>
      <form onSubmit={submit} className={`flex gap-2 ${compact ? 'flex-col' : 'flex-col sm:flex-row'}`}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={status === 'saving'}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50 shrink-0"
        >
          {status === 'saving' ? 'Saving…' : 'Save reminder'}
        </button>
      </form>
      {message && (
        <p
          className={`mt-2 ${compact ? 'text-[11px]' : 'text-xs'} ${
            status === 'ok' ? 'text-green-700' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}

export default CartEmailReminder
