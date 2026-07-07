import React, { useState, useEffect, useCallback } from 'react'
import adminHttp from '../../utils/adminHttp'
import { productImageSrc } from '../../utils/mediaUrl'

const STATUS_META = {
  matched: { label: 'Matched', cls: 'bg-green-100 text-green-800' },
  matched_simple: { label: 'Matched (base price)', cls: 'bg-green-100 text-green-800' },
  ambiguous: { label: 'Multiple matches', cls: 'bg-amber-100 text-amber-800' },
  no_match: { label: 'No match', cls: 'bg-gray-100 text-gray-600' },
  no_price: { label: 'No price / call for pricing', cls: 'bg-gray-100 text-gray-600' },
  no_dimension: { label: 'No size in name', cls: 'bg-gray-100 text-gray-600' },
  error: { label: 'Fetch error', cls: 'bg-red-100 text-red-800' },
}

const money = (v) => (v === null || v === undefined ? '—' : `$${Number(v).toFixed(2)}`)

const PriceSync = () => {
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState('ipe')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState({})
  const [expanded, setExpanded] = useState({})
  const [applying, setApplying] = useState(false)
  const [applyProgress, setApplyProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    adminHttp
      .get('/api/admin/price-sync.php?action=categories')
      .then((res) => {
        if (res.data?.success) setCategories(res.data.categories)
      })
      .catch(() => {})
  }, [])

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
  }

  const rowKey = (url) => url

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    setRows([])
    setSelected({})
    setExpanded({})
    setProgress(1)
    setStage('Loading product list…')
    showMessage('')

    try {
      const listRes = await adminHttp.get(
        `/api/admin/price-sync.php?action=list&category=${encodeURIComponent(selectedCat)}`
      )
      if (!listRes.data?.success) {
        showMessage(listRes.data?.error || 'Could not load product list', 'error')
        setLoading(false)
        setProgress(0)
        return
      }

      const { urls, species } = listRes.data
      if (!urls.length) {
        showMessage('No products found in this category.', 'error')
        setLoading(false)
        setProgress(0)
        return
      }

      const collected = []
      for (let i = 0; i < urls.length; i++) {
        setStage(`Reading prices ${i + 1} / ${urls.length}…`)
        setProgress(Math.round(((i + 0.5) / urls.length) * 100))

        let preview
        try {
          const res = await adminHttp.post('/api/admin/price-sync.php', {
            action: 'preview',
            url: urls[i],
            species,
          })
          preview = res.data?.success
            ? res.data.preview
            : { url: urls[i], name: urls[i], status: 'error', external_sizes: [], sizes: [] }
        } catch (e) {
          preview = { url: urls[i], name: urls[i], status: 'error', external_sizes: [], sizes: [] }
        }

        collected.push(preview)
        setRows([...collected])
        setProgress(Math.round(((i + 1) / urls.length) * 100))
      }

      const initSel = {}
      collected.forEach((p) => {
        const ok = (p.status === 'matched' || p.status === 'matched_simple') && p.updatable_count > 0
        initSel[rowKey(p.url)] = ok
      })
      setSelected(initSel)

      const matched = collected.filter(
        (p) => p.status === 'matched' || p.status === 'matched_simple'
      ).length
      setStage('Done')
      showMessage(
        `Read ${collected.length} product(s): ${matched} matched to your catalog.`,
        'success'
      )
    } catch (e) {
      showMessage(e.response?.data?.error || 'Price fetch failed', 'error')
    } finally {
      setLoading(false)
      setTimeout(() => {
        setProgress(0)
        setStage('')
      }, 1000)
    }
  }, [selectedCat])

  const selectableRows = rows.filter(
    (p) => (p.status === 'matched' || p.status === 'matched_simple') && p.updatable_count > 0
  )
  const selectedCount = selectableRows.filter((p) => selected[rowKey(p.url)]).length

  const toggleAll = (checked) => {
    const next = { ...selected }
    selectableRows.forEach((p) => {
      next[rowKey(p.url)] = checked
    })
    setSelected(next)
  }

  const applySelected = async () => {
    const toApply = selectableRows.filter((p) => selected[rowKey(p.url)])
    if (!toApply.length) {
      showMessage('Select at least one matched product.', 'error')
      return
    }

    setApplying(true)
    setApplyProgress(1)
    showMessage('')

    let updated = 0
    const errors = []
    const appliedByUrl = {}

    for (let i = 0; i < toApply.length; i++) {
      const p = toApply[i]
      setApplyProgress(Math.round(((i + 0.5) / toApply.length) * 100))
      try {
        const res = await adminHttp.post('/api/admin/price-sync.php', {
          action: 'apply',
          items: [{ product_id: p.product_id, url: p.url }],
        })
        if (res.data?.success && res.data.results?.length) {
          const r = res.data.results[0]
          if (r.changed) updated++
          appliedByUrl[p.url] = r
        } else {
          errors.push(res.data?.errors?.[0]?.error || 'Apply failed')
        }
      } catch (e) {
        errors.push(e.response?.data?.error || 'Apply failed')
      }
      setApplyProgress(Math.round(((i + 1) / toApply.length) * 100))
    }

    // Mark applied rows
    setRows((prev) =>
      prev.map((p) => (appliedByUrl[p.url] ? { ...p, applied: true } : p))
    )

    showMessage(
      updated > 0
        ? `Updated ${updated} product(s) successfully.${errors.length ? ` ${errors.length} failed.` : ''}`
        : `No products were changed.${errors.length ? ` Errors: ${errors.join('; ')}` : ''}`,
      updated > 0 ? 'success' : 'error'
    )

    setApplying(false)
    setApplyProgress(0)
  }

  const isBusy = loading || applying

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Price Sync</h2>
          <p className="text-gray-600 mt-1">
            Read live prices from brazilianlumber.com, review them next to your catalog, and update
            after approval. The shown (card) price mirrors the source&apos;s starting price, so
            customers never see a scary short-length price. Nothing changes until you click Apply.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            disabled={isBusy}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchPrices}
            disabled={isBusy}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold disabled:opacity-60"
          >
            {loading ? 'Reading…' : 'Fetch prices'}
          </button>
        </div>
      </div>

      {(loading || progress > 0) && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">{stage || 'Working…'}</span>
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
            <span className="text-sm font-semibold text-gray-700">Applying price updates…</span>
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

      {rows.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selectableRows.length > 0 && selectedCount === selectableRows.length}
                onChange={(e) => toggleAll(e.target.checked)}
                className="rounded"
                disabled={isBusy}
              />
              Select all matched ({selectableRows.length})
            </label>
            <button
              onClick={applySelected}
              disabled={isBusy || selectedCount === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              {applying ? 'Applying…' : `Apply selected (${selectedCount})`}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {rows.map((p) => {
              const meta = STATUS_META[p.status] || STATUS_META.no_match
              const selectable =
                (p.status === 'matched' || p.status === 'matched_simple') && p.updatable_count > 0
              return (
                <div key={p.url} className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 rounded"
                      checked={!!selected[rowKey(p.url)]}
                      onChange={(e) =>
                        setSelected((prev) => ({ ...prev, [rowKey(p.url)]: e.target.checked }))
                      }
                      disabled={isBusy || !selectable}
                    />
                    {p.image ? (
                      <img
                        src={productImageSrc(p.image)}
                        alt={p.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded object-cover border border-gray-200 bg-gray-50 shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded bg-gray-100 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-800">{p.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${meta.cls}`}>
                          {p.applied ? 'Applied ✓' : meta.label}
                        </span>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          source
                        </a>
                      </div>

                      {(p.status === 'matched' || p.status === 'matched_simple') && (
                        <div className="text-sm text-gray-600 mt-1">
                          → <span className="font-medium">{p.product_name}</span>{' '}
                          <span className="text-gray-400">(ID {p.product_id})</span>
                          <span className="ml-2">
                            shown price {money(p.base_old)} →{' '}
                            <span className="font-semibold text-green-700">{money(p.base_new)}</span>
                          </span>
                          {p.status === 'matched' && (
                            <span className="ml-2 text-gray-500">
                              · {p.updatable_count} size(s) will change
                            </span>
                          )}
                        </div>
                      )}

                      {p.status === 'ambiguous' && (
                        <div className="text-sm text-amber-700 mt-1">
                          Matches multiple products:{' '}
                          {(p.matches || []).map((m) => `${m.name} (#${m.id})`).join(', ')}. Fix names
                          to disambiguate.
                        </div>
                      )}

                      {p.status === 'no_match' && p.external_sizes?.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          {p.external_sizes.length} size(s) on source · no product in your catalog
                          matched this name.
                        </div>
                      )}

                      {p.status === 'matched' && p.sizes?.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [p.url]: !prev[p.url] }))
                          }
                          className="text-sm text-primary hover:underline mt-1"
                        >
                          {expanded[p.url] ? 'Hide sizes' : 'Show per-size prices'}
                        </button>
                      )}

                      {expanded[p.url] && p.sizes?.length > 0 && (
                        <div className="mt-2 overflow-x-auto">
                          <table className="text-sm border-collapse">
                            <thead>
                              <tr className="text-gray-500">
                                <th className="text-left pr-4 py-1">Size</th>
                                <th className="text-right px-4 py-1">Current</th>
                                <th className="text-right px-4 py-1">New</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.sizes.map((s) => {
                                const changed =
                                  s.new !== null && Math.abs((s.new || 0) - (s.old || 0)) >= 0.01
                                return (
                                  <tr
                                    key={s.length}
                                    className={changed ? 'bg-green-50' : ''}
                                  >
                                    <td className="pr-4 py-1">{s.length}</td>
                                    <td className="text-right px-4 py-1 text-gray-600">
                                      {money(s.old)}
                                    </td>
                                    <td
                                      className={`text-right px-4 py-1 font-semibold ${
                                        s.new === null
                                          ? 'text-gray-300'
                                          : changed
                                          ? 'text-green-700'
                                          : 'text-gray-500'
                                      }`}
                                    >
                                      {s.new === null ? 'no source' : money(s.new)}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {rows.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          Pick a category and click &quot;Fetch prices&quot; to read live prices from
          brazilianlumber.com.
        </div>
      )}
    </div>
  )
}

export default PriceSync
