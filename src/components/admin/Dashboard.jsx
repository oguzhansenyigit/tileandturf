import React, { useState, useEffect, useCallback } from 'react'
import adminHttp from '../../utils/adminHttp'
import { productImageSrc } from '../../utils/mediaUrl'
import UsStateHeatmap from './UsStateHeatmap'

const money = (v) => `$${(parseFloat(v) || 0).toFixed(2)}`

const BarRow = ({ label, value, max, suffix = '' }) => {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-700 truncate mr-2">{label}</span>
        <span className="font-semibold text-gray-800 shrink-0">
          {typeof value === 'number' && suffix === '$' ? money(value) : `${value}${suffix}`}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const MiniSpark = ({ series, keyName, color = '#43a047' }) => {
  const vals = (series || []).map((d) => Number(d[keyName]) || 0)
  const max = Math.max(...vals, 1)
  const w = 280
  const h = 56
  const step = vals.length > 1 ? w / (vals.length - 1) : w
  const points = vals
    .map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  )
}

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [live, setLive] = useState([])
  const [liveProducts, setLiveProducts] = useState([])
  const [liveBehavior, setLiveBehavior] = useState(null)
  const [liveByState, setLiveByState] = useState([])
  const [activeVisitors, setActiveVisitors] = useState(0)
  const [mapMode, setMapMode] = useState('live') // live | sales | visits
  const [funnelWindow, setFunnelWindow] = useState('today') // today | 7d | 30d
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const fetchLive = useCallback(async () => {
    try {
      const res = await adminHttp.get('/api/track-visitor.php')
      if (res.data?.success) {
        setActiveVisitors(res.data.active_visitors || 0)
        setLive(res.data.live || [])
        if (Array.isArray(res.data.live_by_state)) {
          setLiveByState(res.data.live_by_state)
        }
        if (Array.isArray(res.data.live_products)) {
          setLiveProducts(res.data.live_products)
        }
        if (res.data.live_behavior) {
          setLiveBehavior(res.data.live_behavior)
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

  const fetchDashboard = useCallback(async () => {
    try {
      setLoadError('')
      const res = await adminHttp.get('/api/admin/dashboard.php')
      if (res.data?.success || res.data?.kpis || res.data?.totals) {
        setStats(res.data)
        if (typeof res.data.active_visitors === 'number') {
          setActiveVisitors(res.data.active_visitors)
        }
        if (Array.isArray(res.data.live_visitors)) {
          setLive(res.data.live_visitors)
        }
        if (Array.isArray(res.data.live_by_state)) {
          setLiveByState(res.data.live_by_state)
        }
        if (Array.isArray(res.data.live_products)) {
          setLiveProducts(res.data.live_products)
        }
        if (res.data.live_behavior) {
          setLiveBehavior(res.data.live_behavior)
        }
      } else {
        setStats(null)
        setLoadError(res.data?.error || 'Dashboard returned an empty response.')
      }
    } catch (e) {
      console.error(e)
      setStats(null)
      setLoadError(
        e.response?.data?.error ||
          e.message ||
          'Could not reach dashboard API (HTTP ' + (e.response?.status || '?') + ')'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    fetchLive()
    const a = setInterval(fetchLive, 20000)
    const b = setInterval(fetchDashboard, 120000)
    return () => {
      clearInterval(a)
      clearInterval(b)
    }
  }, [fetchDashboard, fetchLive])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white border border-red-100 rounded-lg p-6 max-w-xl">
        <p className="text-red-700 font-semibold mb-2">Could not load dashboard.</p>
        {loadError && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{loadError}</p>
        )}
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            fetchDashboard()
          }}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    )
  }

  const k = stats.kpis || {}
  const series = stats.series || []
  const salesStates = (stats.sales_by_state || []).map((s) => ({
    state: s.state,
    value: s.revenue,
    label: `${s.orders} orders · ${money(s.revenue)}`,
  }))
  const visitStates = (stats.visits_by_state || []).map((s) => ({
    state: s.state,
    value: s.hits,
    label: `${s.visitors} visitors · ${s.hits} page hits`,
  }))
  const liveStates = (liveByState.length ? liveByState : stats.live_by_state || []).map((s) => ({
    state: s.state,
    value: s.visitors,
    label: s.cities
      ? `${s.visitors} online · ${s.cities}`
      : `${s.visitors} online now`,
  }))
  const mapData =
    mapMode === 'live' ? liveStates : mapMode === 'sales' ? salesStates : visitStates
  const topPathsMax = Math.max(...(stats.top_paths || []).map((p) => p.hits), 1)
  const deviceMax = Math.max(...(stats.devices || []).map((d) => d.hits), 1)
  const funnel = stats.funnel || {}
  const lb = liveBehavior || stats.live_behavior || {}
  const funnelWin = funnel[funnelWindow] || funnel['30d'] || {}
  const productsLive = liveProducts.length > 0 ? liveProducts : stats.live_products || []
  const liveStateRows = liveByState.length ? liveByState : stats.live_by_state || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Live product viewers, cart/checkout abandon, traffic and sales geography.
          </p>
        </div>
        <button
          onClick={() => {
            fetchDashboard()
            fetchLive()
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      {/* Live shopper behavior */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Active now',
            value: activeVisitors,
            hint: 'Last 5 minutes',
            color: 'text-orange-600',
          },
          {
            label: 'Viewing a product',
            value: lb.on_product || 0,
            hint: 'On a product page now',
            color: 'text-green-700',
          },
          {
            label: 'In cart, not checkout',
            value: lb.in_cart_not_checkout || 0,
            hint: 'Added to cart · still online',
            color: 'text-amber-700',
          },
          {
            label: 'Checkout, no order',
            value: lb.checkout_no_purchase || 0,
            hint: 'Reached checkout · no payment',
            color: 'text-red-700',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-100 shadow-sm p-4"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-bold text-gray-800">Products being viewed now</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-green-700 bg-green-50 px-2 py-0.5 rounded">
              Live
            </span>
          </div>
          {productsLive.length === 0 ? (
            <p className="text-sm text-gray-500">
              No one is on a product page right now. Counts appear as shoppers open products.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {productsLive.map((p) => (
                <div key={p.product_id} className="flex items-center gap-3 text-sm">
                  <img
                    src={productImageSrc(p.image)}
                    alt=""
                    className="w-10 h-10 rounded object-cover border bg-gray-50"
                  />
                  <span className="flex-1 truncate font-medium text-gray-800">{p.name}</span>
                  <span className="shrink-0 font-bold text-green-700">
                    {p.viewers}{' '}
                    <span className="font-normal text-gray-500 text-xs">
                      viewer{p.viewers === 1 ? '' : 's'}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-bold text-gray-800">Purchase funnel</h3>
            <div className="flex gap-1">
              {[
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7d' },
                { id: '30d', label: '30d' },
              ].map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setFunnelWindow(w.id)}
                  className={`px-2.5 py-1 text-xs rounded font-semibold ${
                    funnelWindow === w.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Viewed a product', value: funnelWin.view_product || 0 },
              { label: 'Added to cart', value: funnelWin.add_to_cart || 0 },
              { label: 'Started checkout', value: funnelWin.begin_checkout || 0 },
              { label: 'Placed order', value: funnelWin.purchase || 0 },
            ].map((row) => (
              <div key={row.label} className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-600">{row.label}</span>
                <span className="font-bold text-gray-900">{row.value}</span>
              </div>
            ))}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="text-xs text-amber-800 font-semibold uppercase">Cart abandon</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {funnelWin.cart_no_checkout || 0}
                </p>
                <p className="text-xs text-amber-700/80 mt-1">
                  Added to cart · never reached checkout
                </p>
              </div>
              <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                <p className="text-xs text-red-800 font-semibold uppercase">Checkout abandon</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {funnelWin.checkout_no_purchase || 0}
                </p>
                <p className="text-xs text-red-700/80 mt-1">
                  Opened checkout · did not place order
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 pt-1">
              Unique real shoppers (browser sessions). Data starts after this deploy.
            </p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          { label: 'Active now', value: activeVisitors, hint: 'Last 5 min', color: 'text-orange-600' },
          { label: "Today's views", value: stats.today?.page_views || 0, color: 'text-primary' },
          { label: "Today's visitors", value: stats.today?.unique_visitors || 0, color: 'text-green-600' },
          { label: 'Orders today', value: k.orders_today || 0, color: 'text-blue-600' },
          { label: 'Revenue today', value: money(k.revenue_today), color: 'text-purple-600' },
          { label: 'Pending', value: k.pending || 0, color: 'text-amber-600' },
          { label: '30d orders', value: k.orders_month || 0, color: 'text-blue-700' },
          { label: 'Total revenue', value: money(k.revenue), color: 'text-purple-700' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            {card.hint && <p className="text-[10px] text-gray-400 mt-0.5">{card.hint}</p>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-1">Traffic (14 days)</h3>
          <p className="text-xs text-gray-500 mb-2">Page views</p>
          <MiniSpark series={series} keyName="views" color="#43a047" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{series[0]?.day}</span>
            <span>{series[series.length - 1]?.day}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-1">Revenue (14 days)</h3>
          <p className="text-xs text-gray-500 mb-2">Non-cancelled orders</p>
          <MiniSpark series={series} keyName="revenue" color="#7c3aed" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{series[0]?.day}</span>
            <span>{series[series.length - 1]?.day}</span>
          </div>
        </div>
      </div>

      {/* Map + live */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setMapMode('live')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                mapMode === 'live' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Live now
            </button>
            <button
              type="button"
              onClick={() => setMapMode('sales')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                mapMode === 'sales' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Sales by state
            </button>
            <button
              type="button"
              onClick={() => setMapMode('visits')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                mapMode === 'visits' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Visits by state
            </button>
            <span className="text-xs text-gray-400 ml-auto">
              {mapMode === 'live'
                ? 'Active sessions · updates every ~20s'
                : mapMode === 'sales'
                  ? 'From order shipping addresses'
                  : 'From visitor IP geo (last 30 days)'}
            </span>
          </div>
          <UsStateHeatmap
            data={mapData}
            mode={mapMode === 'live' ? 'live' : 'heatmap'}
            title={
              mapMode === 'live'
                ? 'Who is on the site right now'
                : mapMode === 'sales'
                  ? 'Where customers order from'
                  : 'Where visitors browse from'
            }
            valueLabel={mapMode === 'live' ? 'Online' : mapMode === 'sales' ? 'Revenue' : 'Hits'}
          />
          {mapData.length === 0 && (
            <p className="text-sm text-gray-500 mt-3">
              {mapMode === 'live'
                ? 'No US visitors online with a detected state right now (local/VPN IPs may not resolve).'
                : mapMode === 'visits'
                  ? 'No geo visit data yet — new visits after deploy will populate this map.'
                  : 'No order state data found.'}
            </p>
          )}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(mapMode === 'live'
              ? liveStateRows
              : mapMode === 'sales'
                ? stats.sales_by_state
                : stats.visits_by_state || []
            )
              .slice(0, 8)
              .map((s) => (
                <div
                  key={s.state}
                  className="flex justify-between text-sm border border-gray-100 rounded px-3 py-2"
                >
                  <span className="font-semibold text-gray-800">{s.state}</span>
                  <span className="text-gray-600">
                    {mapMode === 'live'
                      ? `${s.visitors} online${s.cities ? ` · ${s.cities}` : ''}`
                      : mapMode === 'sales'
                        ? `${s.orders} orders · ${money(s.revenue)}`
                        : `${s.visitors} visitors · ${s.hits} hits`}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-1">Live on site</h3>
          <p className="text-xs text-gray-500 mb-3">
            Paid = Ads · Organic = Google search / free listings
          </p>
          <p className="text-3xl font-bold text-orange-600 mb-3">{activeVisitors}</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {live.length === 0 ? (
              <p className="text-sm text-gray-500">No active sessions in the last 5 minutes.</p>
            ) : (
              live.map((v, i) => {
                const channel = String(v.traffic_channel || '').toLowerCase()
                const label =
                  channel === 'paid'
                    ? 'Paid'
                    : channel === 'organic'
                      ? 'Organic'
                      : channel === 'direct'
                        ? 'Direct'
                        : channel === 'referral'
                          ? 'Referral'
                          : channel === 'social'
                            ? 'Social'
                            : 'Unknown'
                const badgeCls =
                  channel === 'paid'
                    ? 'bg-violet-100 text-violet-900'
                    : channel === 'organic'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-gray-100 text-gray-600'
                return (
                  <div key={i} className="text-xs border-b border-gray-50 pb-2">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className="font-medium text-gray-800 truncate">
                        {v.product_name
                          ? `Product: ${v.product_name}`
                          : v.path || '/'}
                      </p>
                      <span
                        className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeCls}`}
                        title={[v.utm_source, v.utm_medium, v.utm_campaign].filter(Boolean).join(' / ') || 'No attribution yet'}
                      >
                        {label}
                        {v.utm_medium ? ` · ${v.utm_medium}` : ''}
                      </span>
                    </div>
                    <p className="text-gray-500 truncate">{v.path || '/'}</p>
                    <p className="text-gray-500">
                      {[v.city, v.region_code, v.country].filter(Boolean).join(', ') || 'Location unknown'}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Behavior + devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-3">Top pages (30d)</h3>
          {(stats.top_paths || []).length === 0 ? (
            <p className="text-sm text-gray-500">No page hit data yet.</p>
          ) : (
            (stats.top_paths || []).map((p) => (
              <BarRow key={p.path} label={p.path} value={p.hits} max={topPathsMax} />
            ))
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-3">Devices (30d)</h3>
          {(stats.devices || []).length === 0 ? (
            <p className="text-sm text-gray-500">No device data yet.</p>
          ) : (
            (stats.devices || []).map((d) => (
              <BarRow key={d.device} label={d.device} value={d.hits} max={deviceMax} />
            ))
          )}
        </div>
      </div>

      {/* Product-level funnel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
          <div>
            <h3 className="font-bold text-gray-800">Product funnel (30d)</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Unique shoppers: view → add to cart → checkout → order. Low view→cart % = weak product page.
            </p>
          </div>
        </div>
        {(stats.product_funnel || []).length === 0 ? (
          <p className="text-sm text-gray-500">
            Product funnel fills as shoppers view products and add them to cart after deploy.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-3 font-semibold">Product</th>
                  <th className="py-2 px-2 font-semibold text-right">Views</th>
                  <th className="py-2 px-2 font-semibold text-right">Cart</th>
                  <th className="py-2 px-2 font-semibold text-right">Checkout</th>
                  <th className="py-2 px-2 font-semibold text-right">Orders</th>
                  <th className="py-2 pl-2 font-semibold text-right">View→Cart</th>
                </tr>
              </thead>
              <tbody>
                {(stats.product_funnel || []).map((p) => (
                  <tr key={p.product_id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={productImageSrc(p.image)}
                          alt=""
                          className="w-8 h-8 rounded object-cover border bg-gray-50 shrink-0"
                        />
                        <span className="truncate font-medium text-gray-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{p.views}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{p.add_to_cart}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{p.checkouts}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums font-semibold">{p.purchases}</td>
                    <td className="py-2.5 pl-2 text-right">
                      <span
                        className={`font-semibold tabular-nums ${
                          p.views > 0 && p.view_to_cart_pct < 5
                            ? 'text-amber-700'
                            : 'text-gray-800'
                        }`}
                      >
                        {p.view_to_cart_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-3">Most viewed products</h3>
          {(stats.top_viewed || stats.topProducts || []).filter((p) => (p.total_views || 0) > 0)
            .length === 0 ? (
            <p className="text-sm text-gray-500">
              Views start counting after deploy (product page opens).
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(stats.top_viewed || stats.topProducts || [])
                .filter((p) => (p.total_views || 0) > 0)
                .map((p, i) => (
                  <div key={p.id || i} className="flex items-center gap-3 text-sm">
                    <span className="w-5 text-gray-400">{i + 1}</span>
                    <img
                      src={productImageSrc(p.image)}
                      alt=""
                      className="w-9 h-9 rounded object-cover border bg-gray-50"
                    />
                    <span className="flex-1 truncate font-medium">{p.name}</span>
                    <span className="font-semibold">{p.total_views}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-3">Top selling products</h3>
          {(stats.top_selling || []).length === 0 ? (
            <p className="text-sm text-gray-500">No sales yet.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {stats.top_selling.map((p, i) => (
                <div key={`${p.id}-${i}`} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-gray-400">{i + 1}</span>
                  <img
                    src={productImageSrc(p.image)}
                    alt=""
                    className="w-9 h-9 rounded object-cover border bg-gray-50"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.order_count} orders · {p.units} units
                    </p>
                  </div>
                  <span className="font-semibold">{money(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-800 mb-3">Recent orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(stats.recent_orders || stats.recentOrders || []).map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2 font-semibold">
                    {order.order_number || `ORD-${order.id}`}
                  </td>
                  <td className="px-3 py-2">
                    {order.first_name} {order.last_name}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {[order.city, order.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-3 py-2 font-semibold">{money(order.total)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
