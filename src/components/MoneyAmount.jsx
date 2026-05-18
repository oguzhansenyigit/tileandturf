import { applyCategoryDiscount, getCategoryDiscountPercent } from '../utils/pricing'

/**
 * Renders a dollar amount with optional category discount (strikethrough + badge).
 */
const MoneyAmount = ({ amount, product, className = '' }) => {
  const original = parseFloat(amount) || 0
  const final = applyCategoryDiscount(original, product)
  const pct = getCategoryDiscountPercent(product)
  const showDiscount = pct > 0 && final < original - 0.004

  if (!showDiscount) {
    return <span className={className}>${original.toFixed(2)}</span>
  }

  return (
    <span className={className}>
      <span className="line-through text-gray-400 font-normal mr-1.5">
        ${original.toFixed(2)}
      </span>
      <span>${final.toFixed(2)}</span>
      <span className="ml-1.5 text-xs font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded align-middle">
        -{Math.round(pct)}%
      </span>
    </span>
  )
}

export default MoneyAmount
