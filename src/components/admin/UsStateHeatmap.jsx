import React, { useMemo, useState } from 'react'
import { US_STATE_PATHS } from '../../data/usStatePaths'

const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington DC', FL: 'Florida',
  GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin',
  WY: 'Wyoming',
}

/** Approximate visual centroids for this map projection (AVOID overlaying AK/HI mainland). */
const STATE_CENTROIDS = {
  AL: [610, 390], AK: [160, 480], AZ: [210, 360], AR: [520, 350], CA: [85, 280],
  CO: [310, 255], CT: [835, 193], DE: [795, 248], DC: [768, 256], FL: [680, 480],
  GA: [675, 390], HI: [340, 530], ID: [180, 120], IL: [570, 240], IN: [620, 235],
  IA: [500, 185], KS: [420, 265], KY: [640, 285], LA: [530, 430], ME: [890, 100],
  MD: [770, 255], MA: [850, 180], MI: [630, 145], MN: [490, 90], MS: [565, 400],
  MO: [520, 270], MT: [280, 80], NE: [400, 195], NV: [140, 250], NH: [850, 140],
  NJ: [805, 220], NM: [300, 360], NY: [780, 150], NC: [740, 335], ND: [390, 60],
  OH: [680, 225], OK: [430, 340], OR: [80, 130], PA: [760, 205], RI: [858, 192],
  SC: [720, 375], SD: [395, 130], TN: [625, 325], TX: [400, 420], UT: [215, 245],
  VT: [845, 140], VA: [740, 275], WA: [90, 55], WV: [720, 250], WI: [560, 120],
  WY: [280, 160],
}

function heatColor(t, scheme) {
  if (t <= 0) return scheme === 'live' ? '#d6e4ef' : '#e6ebe4'
  if (scheme === 'live') {
    // Cool ocean → warm amber presence
    const r = Math.round(214 + t * (234 - 214))
    const g = Math.round(228 - t * (228 - 88))
    const b = Math.round(239 - t * (239 - 12))
    return `rgb(${r},${g},${b})`
  }
  // Soft sage land → deep forest
  const r = Math.round(230 - t * (230 - 22))
  const g = Math.round(236 - t * (236 - 100))
  const b = Math.round(228 - t * (228 - 48))
  return `rgb(${r},${g},${b})`
}

/**
 * Geographic US choropleth with optional live presence pulses.
 * @param {{
 *   data: Array<{state:string, value:number, label?:string}>,
 *   title?: string,
 *   valueLabel?: string,
 *   mode?: 'heatmap' | 'live',
 * }} props
 */
const UsStateHeatmap = ({
  data = [],
  title = 'United States',
  valueLabel = 'Value',
  mode = 'heatmap',
}) => {
  const [hover, setHover] = useState(null)
  const isLive = mode === 'live'

  const { byState, max } = useMemo(() => {
    const map = {}
    let m = 0
    data.forEach((d) => {
      const code = String(d.state || '').toUpperCase()
      if (!code || !US_STATE_PATHS[code]) return
      const v = Number(d.value) || 0
      map[code] = { ...d, state: code, value: v }
      if (v > m) m = v
    })
    return { byState: map, max: m }
  }, [data])

  const liveMarkers = useMemo(() => {
    if (!isLive) return []
    return Object.values(byState)
      .filter((e) => e.value > 0 && STATE_CENTROIDS[e.state])
      .map((e) => {
        const [x, y] = STATE_CENTROIDS[e.state]
        const size = 5 + Math.min(10, Math.sqrt(e.value) * 3)
        return { ...e, x, y, size }
      })
  }, [byState, isLive])

  const legendGradient = isLive
    ? 'linear-gradient(90deg, #d6e4ef, #f59e0b, #ea580c)'
    : 'linear-gradient(90deg, #e6ebe4, #166534)'

  return (
    <div className="tt-us-map">
      <style>{`
        @keyframes ttLivePulse {
          0% { opacity: 0.55; transform: scale(0.55); }
          70% { opacity: 0; transform: scale(2.1); }
          100% { opacity: 0; transform: scale(2.1); }
        }
        .tt-us-map .tt-pulse-ring {
          transform-box: fill-box;
          transform-origin: center;
          animation: ttLivePulse 2.2s ease-out infinite;
        }
        .tt-us-map .tt-pulse-ring-delay {
          animation-delay: 1.1s;
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          {title}
          {isLive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Live
            </span>
          )}
        </h3>
        {hover && (
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{STATE_NAMES[hover.state] || hover.state}</span>
            {': '}
            {hover.label || `${valueLabel}: ${hover.value}`}
          </p>
        )}
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-inner">
        <svg
          viewBox="0 0 960 600"
          className="w-full h-auto min-h-[240px]"
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id="ttOcean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5dde8" />
              <stop offset="55%" stopColor="#a9cddc" />
              <stop offset="100%" stopColor="#8fb8cb" />
            </linearGradient>
            <filter id="ttLandShadow" x="-2%" y="-2%" width="104%" height="104%">
              <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor="#1e3a4c" floodOpacity="0.22" />
            </filter>
            <radialGradient id="ttDotGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff7ed" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#f97316" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="960" height="600" fill="url(#ttOcean)" />

          {/* Soft vignette / depth */}
          <rect width="960" height="600" fill="url(#ttOcean)" opacity="0" />
          <ellipse cx="480" cy="290" rx="420" ry="260" fill="#ffffff" opacity="0.07" />

          <g filter="url(#ttLandShadow)">
            {Object.entries(US_STATE_PATHS).map(([code, d]) => {
              const entry = byState[code]
              const t = entry && max > 0 ? entry.value / max : 0
              const active = hover?.state === code
              const hasLive = isLive && entry && entry.value > 0
              const fill =
                t > 0
                  ? heatColor(t, isLive ? 'live' : 'heat')
                  : isLive
                    ? '#dce8f0'
                    : '#edf0ea'
              return (
                <path
                  key={code}
                  d={d}
                  fill={fill}
                  stroke={active ? (isLive ? '#9a3412' : '#14532d') : hasLive ? '#fb923c' : '#f8fafc'}
                  strokeWidth={active ? 2.2 : hasLive ? 1.35 : 0.75}
                  className="cursor-pointer transition-[fill,stroke-width] duration-150"
                  onMouseEnter={() =>
                    setHover(
                      entry || {
                        state: code,
                        value: 0,
                        label: isLive ? 'No one online' : `${valueLabel}: 0`,
                      }
                    )
                  }
                  onMouseLeave={() => setHover(null)}
                >
                  <title>
                    {STATE_NAMES[code] || code}
                    {entry ? `: ${entry.label || entry.value}` : isLive ? ': offline' : ': 0'}
                  </title>
                </path>
              )
            })}
          </g>

          {liveMarkers.map((m) => (
            <g key={`dot-${m.state}`} pointerEvents="none">
              <circle
                className="tt-pulse-ring"
                cx={m.x}
                cy={m.y}
                r={m.size * 1.6}
                fill="none"
                stroke="#ea580c"
                strokeWidth="1.5"
              />
              <circle
                className="tt-pulse-ring tt-pulse-ring-delay"
                cx={m.x}
                cy={m.y}
                r={m.size * 1.6}
                fill="none"
                stroke="#f97316"
                strokeWidth="1.2"
              />
              <circle cx={m.x} cy={m.y} r={m.size * 1.8} fill="url(#ttDotGlow)" opacity="0.85" />
              <circle cx={m.x} cy={m.y} r={Math.max(3.5, m.size * 0.55)} fill="#ea580c" stroke="#fff7ed" strokeWidth="1.5" />
              {m.value > 1 && (
                <text
                  x={m.x}
                  y={m.y + 3.5}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="#fff7ed"
                  style={{ userSelect: 'none' }}
                >
                  {m.value}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <span>{isLive ? 'Quiet' : 'Low'}</span>
        <div className="h-2 flex-1 max-w-[180px] rounded" style={{ background: legendGradient }} />
        <span>{isLive ? 'Busy now' : 'High'}</span>
        {isLive && (
          <span className="ml-auto text-gray-400">
            Dots = people online right now (IP → US state)
          </span>
        )}
      </div>
    </div>
  )
}

export default UsStateHeatmap
