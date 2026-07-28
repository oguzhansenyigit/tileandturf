import React, { useCallback, useEffect, useMemo, useState } from 'react'
import adminHttp from '../../utils/adminHttp'

const money = (v) => `$${Number(v || 0).toFixed(2)}`

const formatWhen = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

const ChannelPill = ({ channel }) => {
  const ch = String(channel || '').toLowerCase()
  const cls =
    ch === 'organic'
      ? 'bg-emerald-100 text-emerald-900'
      : ch === 'direct'
        ? 'bg-slate-100 text-slate-800'
        : 'bg-gray-100 text-gray-700'
  const label = ch === 'organic' ? 'Organic (SEO)' : ch === 'direct' ? 'Direct' : ch || '—'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  )
}

const locationLabel = (row) => {
  const parts = [row.city, row.region_code, row.country].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

const OrganicTrafficReport = () => {
  const [days, setDays] = useState(30)
  const [channel, setChannel] = useState('both')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [landings, setLandings] = useState([])
  const [sessions, setSessions] = useState([])
  const [orders, setOrders] = useState([])
  const [live, setLive] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminHttp.get(
        `/api/admin/organic-report.php?days=${days}&channel=${encodeURIComponent(channel)}`
      )
      if (!res.data?.success) {
        setError(res.data?.error || 'Could not load report')
        return
      }
      setSummary(res.data.summary || null)
      setDaily(Array.isArray(res.data.daily) ? res.data.daily : [])
      setLandings(Array.isArray(res.data.landings) ? res.data.landings : [])
      setSessions(Array.isArray(res.data.sessions) ? res.data.sessions : [])
      setOrders(Array.isArray(res.data.orders) ? res.data.orders : [])
      setLive(Array.isArray(res.data.live) ? res.data.live : [])
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not load report')
    } finally {
      setLoading(false)
    }
  }, [days, channel])

  useEffect(() => {
    load()
  }, [load])

  const maxDaily = useMemo(() => {
    let m = 1
    daily.forEach((d) => {
      m = Math.max(m, Number(d.organic) || 0, Number(d.direct) || 0)
    })
    return m
  }, [daily])

  const organicLandings = landings.filter((l) => l.channel === 'organic').slice(0, 12)
  const directLandings = landings.filter((l) => l.channel === 'direct').slice(0, 12)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Organic & Direct Audience</h2>
          <p className="text-sm text-gray-600 mt-1">
            SEO (organic search) and direct visitors — separate from paid Ads traffic.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="both">Organic + Direct</option>
            <option value="organic">Organic only</option>
            <option value="direct">Direct only</option>
          </select>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-60"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg px-4 py-3 text-sm font-medium bg-red-50 text-red-800">{error}</div>
      ) : null}

      {loading && !summary ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-emerald-100 p-4">
              <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Organic sessions</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{summary?.organic_sessions ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">SEO / Google organic</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold">Direct sessions</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{summary?.direct_sessions ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">Typed URL / bookmark</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-emerald-100 p-4">
              <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Organic orders</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{summary?.organic_orders ?? 0}</div>
              <div className="text-sm text-emerald-800 font-semibold mt-1">{money(summary?.organic_revenue)}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold">Direct orders</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{summary?.direct_orders ?? 0}</div>
              <div className="text-sm text-slate-700 font-semibold mt-1">{money(summary?.direct_revenue)}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">Daily sessions</h3>
              <div className="text-xs text-gray-500 flex gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Organic
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" /> Direct
                </span>
                <span className="text-gray-400">Paid (ref): {summary?.paid_sessions ?? 0}</span>
              </div>
            </div>
            {daily.length === 0 ? (
              <p className="text-sm text-gray-500">No organic/direct sessions in this period yet.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {daily.map((d) => (
                  <div key={d.day} className="grid grid-cols-[6.5rem_1fr] gap-3 items-center text-xs">
                    <div className="text-gray-600 font-medium">{d.day}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${Math.max(2, ((Number(d.organic) || 0) / maxDaily) * 100)}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-700">{d.organic || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-slate-500"
                            style={{ width: `${Math.max(2, ((Number(d.direct) || 0) / maxDaily) * 100)}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-700">{d.direct || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {live.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-amber-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/50 flex justify-between">
                <h3 className="font-bold text-gray-800">Live now (organic / direct)</h3>
                <span className="text-xs font-semibold text-amber-900">{live.length} online</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Source</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Page</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Location</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {live.map((row) => (
                      <tr key={`live-${row.session_id}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <ChannelPill channel={row.channel} />
                        </td>
                        <td className="px-4 py-2 text-gray-600 max-w-[16rem] truncate" title={row.path}>
                          {row.path || '—'}
                        </td>
                        <td className="px-4 py-2">{locationLabel(row)}</td>
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatWhen(row.last_activity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h3 className="font-bold text-gray-800 mb-3">Top organic landings</h3>
              {organicLandings.length === 0 ? (
                <p className="text-sm text-gray-500">No organic landings yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {organicLandings.map((l) => (
                    <li key={`o-${l.landing_path}`} className="flex justify-between gap-3">
                      <span className="text-gray-700 truncate" title={l.landing_path}>
                        {l.landing_path}
                      </span>
                      <span className="font-semibold text-emerald-800 flex-shrink-0">{l.sessions}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h3 className="font-bold text-gray-800 mb-3">Top direct landings</h3>
              {directLandings.length === 0 ? (
                <p className="text-sm text-gray-500">No direct landings yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {directLandings.map((l) => (
                    <li key={`d-${l.landing_path}`} className="flex justify-between gap-3">
                      <span className="text-gray-700 truncate" title={l.landing_path}>
                        {l.landing_path}
                      </span>
                      <span className="font-semibold text-slate-800 flex-shrink-0">{l.sessions}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Organic / Direct orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">When</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Order</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Source</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No organic/direct orders in this period. Orders placed after attribution tracking started will appear here.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatWhen(o.created_at)}</td>
                        <td className="px-4 py-2 font-semibold">{o.order_number || o.id}</td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-800">{o.buyer_name || '—'}</div>
                          <div className="text-xs text-gray-500">{o.buyer_email}</div>
                        </td>
                        <td className="px-4 py-2">
                          <ChannelPill channel={o.channel} />
                        </td>
                        <td className="px-4 py-2 font-semibold">{money(o.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Audience sessions</h3>
              <span className="text-xs text-gray-500">{sessions.length} shown</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">When</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Source</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Landing</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Location</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Referrer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No sessions yet. After deploy, new organic/direct visits will be logged here.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={`${s.session_id}-${s.created_at}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatWhen(s.created_at)}</td>
                        <td className="px-4 py-2">
                          <ChannelPill channel={s.channel} />
                        </td>
                        <td className="px-4 py-2 text-gray-700 max-w-[14rem] truncate" title={s.landing_path}>
                          {s.landing_path || '—'}
                        </td>
                        <td className="px-4 py-2">{locationLabel(s)}</td>
                        <td className="px-4 py-2 text-gray-500 max-w-[14rem] truncate" title={s.referrer}>
                          {s.referrer || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OrganicTrafficReport
