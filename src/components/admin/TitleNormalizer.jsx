import React, { useState, useCallback } from 'react'
import adminHttp from '../../utils/adminHttp'

const ISSUE_META = {
  case: { label: 'Not uppercase', cls: 'bg-amber-100 text-amber-800' },
  separator: { label: 'Size separator', cls: 'bg-red-100 text-red-800' },
  spacing: { label: 'Extra spacing', cls: 'bg-blue-100 text-blue-800' },
  style: { label: 'Style', cls: 'bg-gray-100 text-gray-700' },
}

const TitleNormalizer = () => {
  const [scanData, setScanData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [applying, setApplying] = useState(false)
  const [applyProgress, setApplyProgress] = useState(0)
  const [selected, setSelected] = useState({})
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
  }

  const runScan = useCallback(async () => {
    setLoading(true)
    setProgress(20)
    showMessage('')
    try {
      setProgress(60)
      const res = await adminHttp.get('/api/admin/title-normalizer.php?action=scan')
      setProgress(100)
      if (res.data?.success) {
        setScanData(res.data)
        const initial = {}
        res.data.products.forEach((p) => {
          initial[p.id] = true
        })
        setSelected(initial)
        showMessage(
          res.data.products.length === 0
            ? 'All product titles already follow the house style. Nothing to fix.'
            : `${res.data.summary.products_with_issues} title(s) need fixing.`,
          'success'
        )
      } else {
        showMessage(res.data?.error || 'Scan failed', 'error')
      }
    } catch (e) {
      showMessage(e.response?.data?.error || 'Could not run scan', 'error')
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 800)
    }
  }, [])

  const products = scanData?.products || []
  const selectedCount = products.filter((p) => selected[p.id]).length

  const toggleAll = (checked) => {
    const next = {}
    products.forEach((p) => {
      next[p.id] = checked
    })
    setSelected(next)
  }

  const applyProducts = async (list) => {
    if (!list.length) return
    setApplyProgress(1)
    showMessage('')

    let updated = 0
    const errors = []
    const appliedIds = []

    for (let i = 0; i < list.length; i++) {
      const p = list[i]
      setApplyProgress(Math.round(((i + 0.5) / list.length) * 100))
      try {
        const res = await adminHttp.post('/api/admin/title-normalizer.php', {
          action: 'apply',
          items: [{ id: p.id, name: p.suggested }],
        })
        if (res.data?.success && res.data.results?.length) {
          if (res.data.results[0].changed) updated++
          appliedIds.push(p.id)
        } else {
          errors.push(res.data?.errors?.[0]?.error || 'Apply failed')
        }
      } catch (e) {
        errors.push(e.response?.data?.error || 'Apply failed')
      }
      setApplyProgress(Math.round(((i + 1) / list.length) * 100))
    }

    // Remove applied rows from the list.
    setScanData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        products: prev.products.filter((p) => !appliedIds.includes(p.id)),
      }
    })

    showMessage(
      updated > 0
        ? `Fixed ${updated} title(s).${errors.length ? ` ${errors.length} failed.` : ''}`
        : `No titles changed.${errors.length ? ` Errors: ${errors.join('; ')}` : ''}`,
      updated > 0 ? 'success' : 'error'
    )
    setApplyProgress(0)
  }

  const applySelected = async () => {
    const list = products.filter((p) => selected[p.id])
    if (!list.length) {
      showMessage('Select at least one title.', 'error')
      return
    }
    setApplying(true)
    await applyProducts(list)
    setApplying(false)
  }

  const applyOne = async (p) => {
    setApplying(true)
    await applyProducts([p])
    setApplying(false)
  }

  const isBusy = loading || applying

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Title Fixer</h2>
          <p className="text-gray-600 mt-1">
            Finds inconsistent product titles (lowercase text, mixed
            <span className="font-mono"> x/X</span> in sizes, extra spaces) and rewrites them in the
            house style: UPPERCASE with a single uppercase X (e.g. <span className="font-mono">4X12</span>).
            Product links (slugs) stay unchanged. Nothing changes until you click Apply.
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={isBusy}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold disabled:opacity-60"
        >
          {loading ? 'Scanning…' : scanData ? 'Rescan' : 'Scan titles'}
        </button>
      </div>

      {(loading || progress > 0) && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Scanning titles…</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {applyProgress > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Fixing titles…</span>
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

      {scanData && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Products scanned</p>
              <p className="text-2xl font-bold text-gray-800">{scanData.summary.total_products}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Titles to fix</p>
              <p className="text-2xl font-bold text-amber-600">
                {scanData.summary.products_with_issues}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Selected</p>
              <p className="text-2xl font-bold text-gray-800">{selectedCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectedCount === products.length && products.length > 0}
                onChange={(e) => toggleAll(e.target.checked)}
                className="rounded"
                disabled={isBusy}
              />
              Select all ({products.length})
            </label>
            <button
              onClick={applySelected}
              disabled={isBusy || selectedCount === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              {applying ? 'Fixing…' : `Fix selected (${selectedCount})`}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {products.map((p) => (
              <div key={p.id} className="p-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded"
                  checked={!!selected[p.id]}
                  onChange={(e) =>
                    setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))
                  }
                  disabled={isBusy}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">ID {p.id}</span>
                    {p.issues.map((issue) => {
                      const meta = ISSUE_META[issue.code] || ISSUE_META.style
                      return (
                        <span
                          key={issue.code}
                          className={`text-xs px-2 py-0.5 rounded ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                      )
                    })}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400 line-through">{p.current}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="font-semibold text-green-700">{p.suggested}</span>
                  </div>
                </div>
                <button
                  onClick={() => applyOne(p)}
                  disabled={isBusy}
                  className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold disabled:opacity-60 shrink-0"
                >
                  Fix
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {!scanData && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          Click &quot;Scan titles&quot; to find inconsistent product titles.
        </div>
      )}
    </div>
  )
}

export default TitleNormalizer
