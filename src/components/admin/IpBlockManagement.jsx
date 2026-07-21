import React, { useCallback, useEffect, useMemo, useState } from 'react'
import adminHttp from '../../utils/adminHttp'

const formatWhen = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

const formatMoney = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `$${Number(value).toFixed(2)}`
}

const locationLabel = (row) => {
  const parts = [row.city, row.region_code || row.region, row.country].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

const ipSourceLabel = (source) => {
  switch (source) {
    case 'order':
      return 'Saved on order'
    case 'funnel':
      return 'From checkout tracking'
    case 'session':
      return 'From visit session'
    case 'inferred_checkout':
      return 'Likely — only checkout visitor then'
    case 'inferred_alone':
      return 'Likely — only visitor then'
    case 'inferred_guess':
      return 'Possible — best match near order time'
    default:
      return ''
  }
}

const OrderIpCell = ({ row, busyIp, onBlock }) => {
  const source = row.ip_source || (row.ip ? 'order' : 'none')
  const candidates = Array.isArray(row.ip_candidates) ? row.ip_candidates : []
  const soft = source === 'inferred_guess' || source === 'inferred_checkout' || source === 'inferred_alone'

  if (!row.ip && candidates.length === 0) {
    return <span className="text-xs text-gray-400">No IP on record</span>
  }

  return (
    <div className="space-y-1">
      {row.ip ? (
        <>
          <div className="font-mono text-xs">{row.ip}</div>
          {source && source !== 'none' && source !== 'order' ? (
            <div className={`text-[11px] ${soft ? 'text-amber-800' : 'text-gray-500'}`}>
              {ipSourceLabel(source)}
            </div>
          ) : null}
          <button
            type="button"
            disabled={busyIp === row.ip}
            onClick={() => onBlock({ ip: row.ip })}
            className="text-red-600 hover:text-red-800 font-semibold text-xs"
          >
            Block IP
          </button>
        </>
      ) : null}
      {candidates.length > 1 ? (
        <div className="text-[11px] text-gray-600 pt-1 border-t border-gray-100">
          <div className="font-semibold mb-0.5">Also online then:</div>
          {candidates.slice(0, 5).map((c) => (
            <div key={c.ip} className="flex items-center gap-2 py-0.5">
              <span className="font-mono">{c.ip}</span>
              <span className="text-gray-400">
                {[c.city, c.region_code].filter(Boolean).join(', ') || `${c.hits} hits`}
              </span>
              <button
                type="button"
                disabled={busyIp === c.ip}
                onClick={() => onBlock({ ip: c.ip, city: c.city, region: c.region_code, country: c.country })}
                className="text-red-600 hover:text-red-800 font-semibold"
              >
                Block
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const BuyerBadge = ({ row }) => {
  if (!row?.is_buyer) return null
  const recent = Number(row.recent_order_count) > 0
  const count = Number(row.order_count) || 0
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
        recent ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-800'
      }`}
      title={
        [
          row.buyer_name,
          row.buyer_email,
          row.last_order_number ? `Last: ${row.last_order_number}` : '',
          row.last_order_at ? `at ${formatWhen(row.last_order_at)}` : '',
        ]
          .filter(Boolean)
          .join(' · ')
      }
    >
      {recent ? 'Ordered recently' : 'Buyer'}
      {count > 0 ? ` · ${count}` : ''}
    </span>
  )
}

const BuyerDetails = ({ row }) => {
  if (!row?.is_buyer) return null
  return (
    <div className="text-xs text-gray-600 mt-1 space-y-0.5">
      {row.buyer_name ? <div className="font-semibold text-gray-800">{row.buyer_name}</div> : null}
      {row.buyer_email ? <div>{row.buyer_email}</div> : null}
      {row.last_order_number ? (
        <div className="text-gray-500">
          Last order {row.last_order_number}
          {row.last_order_at ? ` · ${formatWhen(row.last_order_at)}` : ''}
        </div>
      ) : null}
    </div>
  )
}

const IpBlockManagement = () => {
  const [days, setDays] = useState(30)
  const [visitors, setVisitors] = useState([])
  const [live, setLive] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [blockedCount, setBlockedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyIp, setBusyIp] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [manualIp, setManualIp] = useState('')
  const [manualReason, setManualReason] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminHttp.get(`/api/admin/ip-block.php?action=visitors&days=${days}&limit=300`)
      if (!res.data?.success) {
        showMessage(res.data?.error || 'Could not load visitors', 'error')
        setVisitors([])
        setLive([])
        setRecentOrders([])
        return
      }
      setVisitors(Array.isArray(res.data.visitors) ? res.data.visitors : [])
      setLive(Array.isArray(res.data.live) ? res.data.live : [])
      setRecentOrders(Array.isArray(res.data.recent_orders) ? res.data.recent_orders : [])
      setBlockedCount(Number(res.data.blocked_count) || 0)
      setMessage('')
    } catch (err) {
      showMessage(err.response?.data?.error || 'Could not load visitors', 'error')
      setVisitors([])
      setLive([])
      setRecentOrders([])
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return visitors.filter((row) => {
      if (filter === 'blocked' && !row.blocked) return false
      if (filter === 'active' && row.blocked) return false
      if (filter === 'buyers' && !row.is_buyer) return false
      if (!q) return true
      const hay = [
        row.ip,
        row.city,
        row.region,
        row.region_code,
        row.country,
        row.block_reason,
        row.buyer_name,
        row.buyer_email,
        row.last_order_number,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [visitors, search, filter])

  const blockIp = async (row, reason = '') => {
    const ip = row.ip
    if (!ip) return
    if (!window.confirm(`Block ${ip}${row.city ? ` (${row.city})` : ''}? They will get Access denied on the site.`)) {
      return
    }
    setBusyIp(ip)
    try {
      const res = await adminHttp.post('/api/admin/ip-block.php', {
        action: 'block',
        ip,
        city: row.city || '',
        region: row.region || row.region_code || '',
        country: row.country || '',
        reason: reason || row.block_reason || '',
      })
      if (!res.data?.success) {
        showMessage(res.data?.error || 'Block failed', 'error')
        return
      }
      showMessage(`Blocked ${ip}`)
      await load()
    } catch (err) {
      showMessage(err.response?.data?.error || 'Block failed', 'error')
    } finally {
      setBusyIp('')
    }
  }

  const unblockIp = async (ip) => {
    if (!ip) return
    if (!window.confirm(`Unblock ${ip}?`)) return
    setBusyIp(ip)
    try {
      const res = await adminHttp.post('/api/admin/ip-block.php', { action: 'unblock', ip })
      if (!res.data?.success) {
        showMessage(res.data?.error || 'Unblock failed', 'error')
        return
      }
      showMessage(`Unblocked ${ip}`)
      await load()
    } catch (err) {
      showMessage(err.response?.data?.error || 'Unblock failed', 'error')
    } finally {
      setBusyIp('')
    }
  }

  const handleManualBlock = async (e) => {
    e.preventDefault()
    const ip = manualIp.trim()
    if (!ip) return
    await blockIp({ ip }, manualReason.trim())
    setManualIp('')
    setManualReason('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Visitors / IP Block</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track visitor IPs with city, see who placed orders, then block abusive traffic.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {message ? (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            messageType === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Listed IPs</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{visitors.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Buyers</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {visitors.filter((v) => v.is_buyer).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Blocked</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{blockedCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Orders (1 hr)</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{recentOrders.length}</div>
        </div>
      </div>

      {recentOrders.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/60 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Recent orders (last hour)</h3>
            <span className="text-xs text-amber-900 font-semibold">{recentOrders.length} order(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">When</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Order</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">IP</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((row) => (
                  <tr key={`recent-${row.order_id}`} className="hover:bg-amber-50/40">
                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatWhen(row.created_at)}</td>
                    <td className="px-4 py-2 font-semibold">{row.order_number || row.order_id}</td>
                    <td className="px-4 py-2">
                      <div className="font-semibold text-gray-800">{row.buyer_name || '—'}</div>
                      <div className="text-xs text-gray-500">{row.buyer_email || ''}</div>
                    </td>
                    <td className="px-4 py-2">
                      <OrderIpCell row={row} busyIp={busyIp} onBlock={blockIp} />
                    </td>
                    <td className="px-4 py-2">{formatMoney(row.total)}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {row.ip_source && row.ip_source !== 'none' && row.ip_source !== 'order'
                        ? ipSourceLabel(row.ip_source)
                        : row.ip
                          ? '—'
                          : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleManualBlock} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[10rem]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Block IP manually</label>
          <input
            value={manualIp}
            onChange={(e) => setManualIp(e.target.value)}
            placeholder="e.g. 203.0.113.10"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex-[2] min-w-[12rem]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Reason (optional)</label>
          <input
            value={manualReason}
            onChange={(e) => setManualReason(e.target.value)}
            placeholder="Spam, scraping, abuse…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={!manualIp.trim() || busyIp === manualIp.trim()}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-60"
        >
          Block
        </button>
      </form>

      {live.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Live right now</h3>
            <span className="text-xs text-gray-500">Last 5 minutes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">IP</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">City</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Page</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Active</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {live.map((row) => (
                  <tr key={`live-${row.ip}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="font-mono text-xs">{row.ip}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <BuyerBadge row={row} />
                      </div>
                      <BuyerDetails row={row} />
                    </td>
                    <td className="px-4 py-2">{locationLabel(row)}</td>
                    <td className="px-4 py-2 text-gray-600 max-w-[14rem] truncate" title={row.path || ''}>
                      {row.path || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{formatWhen(row.last_activity)}</td>
                    <td className="px-4 py-2">
                      {row.blocked ? (
                        <button
                          type="button"
                          disabled={busyIp === row.ip}
                          onClick={() => unblockIp(row.ip)}
                          className="text-green-700 hover:text-green-900 font-semibold"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyIp === row.ip}
                          onClick={() => blockIp(row)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Block
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <h3 className="font-bold text-gray-800">Visitor IPs</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="buyers">Buyers only</option>
              <option value="blocked">Blocked only</option>
              <option value="active">Not blocked</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search IP, city, name, email…"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[12rem]"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">IP</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">City / location</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Hits</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Sessions</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Last seen</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      No visitor IPs found for this period. Traffic must be tracked first (page hits).
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.ip}
                      className={`hover:bg-gray-50 ${
                        row.blocked ? 'bg-red-50/40' : row.is_buyer ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs whitespace-nowrap">{row.ip}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <BuyerBadge row={row} />
                        </div>
                        <BuyerDetails row={row} />
                      </td>
                      <td className="px-4 py-3">{locationLabel(row)}</td>
                      <td className="px-4 py-3">{row.hits}</td>
                      <td className="px-4 py-3">{row.sessions}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatWhen(row.last_seen)}</td>
                      <td className="px-4 py-3">
                        {row.blocked ? (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Allowed
                          </span>
                        )}
                        {row.block_reason ? (
                          <div className="text-xs text-gray-500 mt-1 max-w-[12rem] truncate" title={row.block_reason}>
                            {row.block_reason}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {row.blocked ? (
                          <button
                            type="button"
                            disabled={busyIp === row.ip}
                            onClick={() => unblockIp(row.ip)}
                            className="text-green-700 hover:text-green-900 font-semibold"
                          >
                            Unblock
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busyIp === row.ip}
                            onClick={() => blockIp(row)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Block
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default IpBlockManagement
