import React, { useState, useCallback, useRef, useEffect } from 'react'
import adminHttp from '../../utils/adminHttp'

const severityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-blue-100 text-blue-800',
}

const AISeoAssistant = () => {
  const [scanData, setScanData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStage, setScanStage] = useState('')
  const [applyingId, setApplyingId] = useState(null)
  const [applyProgress, setApplyProgress] = useState(0)
  const [aiLoadingId, setAiLoadingId] = useState(null)
  const [selected, setSelected] = useState({})
  const [expanded, setExpanded] = useState({})
  const [applyDescription, setApplyDescription] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const progressTimerRef = useRef(null)

  const stopProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }

  const startProgressTimer = (cap = 92) => {
    stopProgressTimer()
    progressTimerRef.current = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= cap) return prev
        const step = prev < 30 ? 4 : prev < 70 ? 3 : 2
        return Math.min(prev + step, cap)
      })
    }, 120)
  }

  useEffect(() => () => stopProgressTimer(), [])

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
  }

  const runScan = useCallback(async () => {
    setLoading(true)
    setScanProgress(1)
    setScanStage('Connecting to database…')
    showMessage('')
    startProgressTimer(92)

    try {
      setScanStage('Loading products…')
      setScanProgress((p) => Math.max(p, 15))

      const response = await adminHttp.get('/api/admin/seo-assistant.php?action=scan')

      setScanStage('Analyzing SEO issues…')
      setScanProgress((p) => Math.max(p, 55))

      await new Promise((resolve) => setTimeout(resolve, 200))

      setScanStage('Building recommendations…')
      setScanProgress((p) => Math.max(p, 85))

      stopProgressTimer()
      setScanProgress(100)
      setScanStage('Scan complete')

      if (response.data.success) {
        setScanData(response.data)
        const initial = {}
        response.data.products.forEach((p) => {
          initial[p.id] = true
        })
        setSelected(initial)
        showMessage(
          `Scan complete: ${response.data.summary.products_with_issues} product(s) need attention.`,
          'success'
        )
      } else {
        showMessage(response.data.error || 'Scan failed', 'error')
      }
    } catch (error) {
      stopProgressTimer()
      setScanProgress(0)
      setScanStage('')
      showMessage(error.response?.data?.error || 'Could not run SEO scan', 'error')
    } finally {
      setLoading(false)
      setTimeout(() => {
        setScanProgress(0)
        setScanStage('')
      }, 1200)
    }
  }, [])

  const updateSuggested = (productId, suggested) => {
    setScanData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId ? { ...p, suggested: { ...p.suggested, ...suggested } } : p
        ),
      }
    })
  }

  const mergeApplyResults = (results) => {
    if (!results?.length) return
    setScanData((prev) => {
      if (!prev) return prev
      const byId = {}
      results.forEach((result) => {
        byId[result.id] = result
      })
      return {
        ...prev,
        products: prev.products.map((product) => {
          const applied = byId[product.id]
          if (!applied?.updated) return product
          return {
            ...product,
            current: {
              meta_title: applied.updated.meta_title || '',
              meta_description: applied.updated.meta_description || '',
              meta_keywords: applied.updated.meta_keywords || '',
              description: applied.updated.description || '',
            },
          }
        }),
      }
    })
  }

  const regenerateWithAi = async (productId) => {
    setAiLoadingId(productId)
    showMessage('')
    try {
      const response = await adminHttp.post('/api/admin/seo-assistant.php', {
        action: 'suggest',
        product_id: productId,
        use_ai: true,
      })
      if (response.data.success) {
        updateSuggested(productId, response.data.suggested)
        showMessage(
          response.data.ai_used
            ? 'AI suggestions generated for this product.'
            : 'Rule-based suggestions refreshed (add OpenAI key for AI copy).',
          'success'
        )
      } else {
        showMessage(response.data.error || 'Could not generate suggestions', 'error')
      }
    } catch (error) {
      showMessage(error.response?.data?.error || 'AI suggestion failed', 'error')
    } finally {
      setAiLoadingId(null)
    }
  }

  const buildApplyItem = (product) => {
    const item = {
      id: product.id,
      meta_title: product.suggested.meta_title,
      meta_description: product.suggested.meta_description,
      meta_keywords: product.suggested.meta_keywords,
    }
    if (applyDescription) {
      item.description = product.suggested.description
    }
    return item
  }

  const applyProducts = async (products) => {
    if (!products.length) return
    showMessage('')
    setApplyProgress(1)

    const results = []
    const errors = []

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      setApplyProgress(Math.max(1, Math.round(((i + 0.5) / products.length) * 100)))

      try {
        const response = await adminHttp.post('/api/admin/seo-assistant.php', {
          action: 'apply',
          items: [buildApplyItem(product)],
        })

        if (response.data.success && response.data.results?.length) {
          results.push(...response.data.results)
        } else if (response.data.errors?.length) {
          errors.push(...response.data.errors)
        } else {
          errors.push({ id: product.id, error: response.data.error || 'Apply failed' })
        }
      } catch (error) {
        errors.push({
          id: product.id,
          error: error.response?.data?.error || 'Could not apply SEO fixes',
        })
      }

      setApplyProgress(Math.round(((i + 1) / products.length) * 100))
    }

    mergeApplyResults(results)

    if (results.length > 0) {
      const changedCount = results.filter((r) => r.changed).length
      showMessage(
        `Applied to ${results.length} product(s). ${changedCount} had database changes. Rescanning…`,
        'success'
      )
      await runScan()
    } else {
      showMessage(
        errors.length
          ? `Apply failed: ${errors.map((e) => `#${e.id} ${e.error}`).join('; ')}`
          : 'No products were updated.',
        'error'
      )
    }

    setApplyProgress(0)
  }

  const applyOne = async (product) => {
    setApplyingId(product.id)
    await applyProducts([product])
    setApplyingId(null)
  }

  const applySelected = async () => {
    if (!scanData) return
    const toApply = scanData.products.filter((p) => selected[p.id])
    if (!toApply.length) {
      showMessage('Select at least one product.', 'error')
      return
    }
    setApplyingId('bulk')
    await applyProducts(toApply)
    setApplyingId(null)
  }

  const toggleAll = (checked) => {
    if (!scanData) return
    const next = {}
    scanData.products.forEach((p) => {
      next[p.id] = checked
    })
    setSelected(next)
  }

  const summary = scanData?.summary
  const selectedCount = scanData ? scanData.products.filter((p) => selected[p.id]).length : 0
  const isBusy = loading || applyingId !== null || applyProgress > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">AI SEO Assistant</h2>
          <p className="text-gray-600 mt-1">
            Scan products and site SEO, review suggestions, and apply fixes with one click.
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={isBusy}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold disabled:opacity-60"
        >
          {loading ? 'Scanning…' : scanData ? 'Rescan' : 'Run SEO Scan'}
        </button>
      </div>

      {(loading || scanProgress > 0) && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">{scanStage || 'Scanning…'}</span>
            <span className="text-sm font-bold text-primary">{scanProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {applyProgress > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Applying SEO fixes…</span>
            <span className="text-sm font-bold text-green-600">{applyProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${applyProgress}%` }}
            />
          </div>
        </div>
      )}

      {message && (
        <div
          className={`px-4 py-3 rounded-lg border ${
            messageType === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {message}
        </div>
      )}

      {scanData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Products scanned</p>
              <p className="text-2xl font-bold text-gray-800">{summary.total_products}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Products with issues</p>
              <p className="text-2xl font-bold text-amber-600">{summary.products_with_issues}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">High severity</p>
              <p className="text-2xl font-bold text-red-600">{summary.high_severity_issues}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">AI status</p>
              <p className="text-lg font-bold text-gray-800">
                {scanData.ai_available ? '✓ OpenAI connected' : 'Rule-based only'}
              </p>
            </div>
          </div>

          {(scanData.site_issues?.length > 0 || scanData.site_recommendations?.length > 0) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Site recommendations</h3>
              {scanData.site_issues?.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {scanData.site_issues.map((issue) => (
                    <li key={issue.code} className="flex items-start gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${severityColors[issue.severity]}`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-gray-700">{issue.message}</span>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {scanData.site_recommendations.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={applyDescription}
                onChange={(e) => setApplyDescription(e.target.checked)}
                className="rounded"
                disabled={isBusy}
              />
              Also apply organic product description when fixing
            </label>
            <button
              onClick={applySelected}
              disabled={isBusy || selectedCount === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              {applyingId === 'bulk' ? 'Applying…' : `Apply selected (${selectedCount})`}
            </button>
            {!scanData.ai_available && (
              <span className="text-sm text-gray-500">
                Add TILEANDTURF_OPENAI_API_KEY to config.local.php for AI-generated copy.
              </span>
            )}
          </div>

          {scanData.products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              No SEO issues found on products. Great job!
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedCount === scanData.products.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="rounded"
                  disabled={isBusy}
                />
                <span className="font-semibold text-gray-800">Products needing attention</span>
              </div>
              <div className="divide-y divide-gray-100">
                {scanData.products.map((product) => (
                  <div key={product.id} className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      <input
                        type="checkbox"
                        checked={!!selected[product.id]}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [product.id]: e.target.checked }))
                        }
                        className="mt-1 rounded"
                        disabled={isBusy}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-800">{product.name}</h4>
                          <span className="text-xs text-gray-500">ID: {product.id}</span>
                          <span className="text-xs text-gray-500">Score: {product.score}/100</span>
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View
                          </a>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {product.issues.map((issue) => (
                            <span
                              key={issue.code}
                              className={`text-xs px-2 py-0.5 rounded ${severityColors[issue.severity]}`}
                            >
                              {issue.message}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [product.id]: !prev[product.id] }))
                          }
                          className="text-sm text-primary hover:underline"
                        >
                          {expanded[product.id] ? 'Hide preview' : 'Show suggested vs current'}
                        </button>
                        {expanded[product.id] && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 rounded p-3">
                              <p className="font-semibold text-gray-700 mb-2">Current (database)</p>
                              <p>
                                <span className="text-gray-500">Title:</span>{' '}
                                {product.current.meta_title || '—'}
                              </p>
                              <p className="mt-1">
                                <span className="text-gray-500">Meta desc:</span>{' '}
                                {product.current.meta_description || '—'}
                              </p>
                              <p className="mt-1">
                                <span className="text-gray-500">Keywords:</span>{' '}
                                {product.current.meta_keywords || '—'}
                              </p>
                            </div>
                            <div className="bg-green-50 rounded p-3">
                              <p className="font-semibold text-gray-700 mb-2">Suggested (will apply)</p>
                              <p>
                                <span className="text-gray-500">Title:</span>{' '}
                                {product.suggested.meta_title}
                              </p>
                              <p className="mt-1">
                                <span className="text-gray-500">Meta desc:</span>{' '}
                                {product.suggested.meta_description}
                              </p>
                              <p className="mt-1">
                                <span className="text-gray-500">Keywords:</span>{' '}
                                {product.suggested.meta_keywords}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          onClick={() => regenerateWithAi(product.id)}
                          disabled={isBusy || aiLoadingId === product.id}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                        >
                          {aiLoadingId === product.id ? 'AI…' : 'Regenerate (AI)'}
                        </button>
                        <button
                          onClick={() => applyOne(product)}
                          disabled={isBusy || applyingId === product.id}
                          className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold disabled:opacity-60"
                        >
                          {applyingId === product.id ? 'Applying…' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!scanData && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          Click &quot;Run SEO Scan&quot; to analyze your products and website SEO.
        </div>
      )}
    </div>
  )
}

export default AISeoAssistant
