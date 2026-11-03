import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { clamp, clockTime, fmt, isNum } from '@/lib/utils'

export type Pt = { t: number; v: number | null }

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function niceTicks(lo: number, hi: number, n = 4) {
  const raw = (hi - lo) / n || 1
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / mag
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6))
  return out
}
function extent(vals: number[], extra: (number | undefined)[]) {
  const all = vals.concat(extra.filter(isNum))
  if (!all.length) return [0, 10]
  const lo = Math.min(...all), hi = Math.max(...all)
  const pad = Math.max((hi - lo) * 0.15, Math.abs(hi) * 0.02, 1)
  return [lo - pad, hi + pad]
}
/** Build path segments, breaking on null values. */
function segments(pts: Pt[], X: (i: number) => number, Y: (v: number) => number) {
  const segs: string[] = []
  let cur = ''
  pts.forEach((p, i) => {
    if (p.v === null) {
      if (cur) segs.push(cur)
      cur = ''
      return
    }
    cur += `${cur ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`
  })
  if (cur) segs.push(cur)
  return segs
}

export function AreaChart({
  data,
  color,
  height = 280,
  threshold,
  band,
  unit,
  decimals = 1,
  emptyLabel = 'No data yet',
}: {
  data: Pt[]
  color: string
  height?: number
  threshold?: number
  band?: [number, number]
  unit: string
  decimals?: number
  emptyLabel?: string
}) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId().replace(/:/g, '')
  const pad = { l: 40, r: 8, t: 12, b: 24 }
  const iw = Math.max(10, w - pad.l - pad.r), ih = height - pad.t - pad.b
  const vals = data.map((p) => p.v).filter(isNum)
  const has = vals.length > 1
  const [lo, hi] = extent(has ? vals : isNum(threshold) ? [threshold] : [], [threshold, ...(band ?? [])])
  const X = (i: number) => pad.l + (data.length > 1 ? i / (data.length - 1) : 1) * iw
  const Y = (v: number) => pad.t + ((hi - v) / (hi - lo)) * ih
  const segs = useMemo(() => (has ? segments(data, X, Y) : []), [data, w, lo, hi]) // eslint-disable-line react-hooks/exhaustive-deps
  const span = data.length > 1 ? data[data.length - 1].t - data[0].t : 0
  const spanLabel = (s: number) => (s >= 120 ? `−${Math.round(s / 60)}m` : `−${Math.round(s)}s`)
  const hp = hover !== null ? data[hover] : null

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      {w > 0 && (
        <svg
          width={w}
          height={height}
          className="block touch-none"
          onPointerMove={(e) => {
            if (!has) return
            const x = e.clientX - e.currentTarget.getBoundingClientRect().left
            setHover(clamp(Math.round(((x - pad.l) / iw) * (data.length - 1)), 0, data.length - 1))
          }}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`g${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity=".26" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {has &&
            niceTicks(lo, hi).map((v) => {
              const y = Math.round(Y(v)) + 0.5
              if (y < pad.t - 2 || y > height - pad.b + 2) return null
              return (
                <g key={v}>
                  <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="var(--grid)" />
                  <text x={pad.l - 10} y={y} dy="0.32em" textAnchor="end" className="fill-fg-3 font-mono text-[10.5px]">
                    {Number.isInteger(v) ? v : v.toFixed(1)}
                  </text>
                </g>
              )
            })}
          {has && band && <rect x={pad.l} width={iw} y={Y(band[1])} height={Y(band[0]) - Y(band[1])} fill={color} opacity=".07" />}
          {has && isNum(threshold) && Y(threshold) > pad.t && <rect x={pad.l} width={iw} y={pad.t} height={Y(threshold) - pad.t} fill="var(--danger)" opacity=".055" />}
          {has &&
            segs.map((d, i) => {
              const m = d.match(/^M([\d.]+),/), l = d.match(/L?([\d.]+),[\d.]+$/)
              const x0 = m ? m[1] : pad.l, x1 = l ? l[1] : pad.l
              return <path key={'a' + i} d={`${d}L${x1},${height - pad.b}L${x0},${height - pad.b}Z`} fill={`url(#g${gid})`} />
            })}
          {has && segs.map((d, i) => <path key={'l' + i} d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
          {has && isNum(threshold) && (
            <g>
              <line x1={pad.l} x2={w - pad.r} y1={Y(threshold)} y2={Y(threshold)} stroke="var(--fg-2)" strokeDasharray="4 4" opacity=".7" />
              <g transform={`translate(${w - pad.r - 76},${Y(threshold) - 9})`}>
                <rect width="76" height="18" rx="5" fill="var(--surface)" stroke="var(--border-strong)" />
                <text x="38" y="9" dy="0.34em" textAnchor="middle" className="fill-fg-2 font-mono text-[10px] font-medium">
                  Limit {fmt(threshold, decimals)}
                </text>
              </g>
            </g>
          )}
          {has &&
            [0, 0.5, 1].map((f) => (
              <text key={f} x={pad.l + f * iw} y={height - 6} textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'} className="fill-fg-3 font-mono text-[10.5px]">
                {f === 1 ? 'now' : spanLabel(span * (1 - f))}
              </text>
            ))}
          {has && hp && hover !== null && (
            <g>
              <line x1={X(hover)} x2={X(hover)} y1={pad.t} y2={height - pad.b} stroke="var(--border-strong)" />
              {hp.v !== null && <circle cx={X(hover)} cy={Y(hp.v)} r="4.5" fill="var(--surface)" stroke={color} strokeWidth="2" />}
            </g>
          )}
          {!has && (
            <text x={w / 2} y={height / 2} textAnchor="middle" className="fill-fg-3 text-[13px]">
              {emptyLabel}
            </text>
          )}
        </svg>
      )}
      <AnimatePresence>
        {has && hp && hover !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-fg px-2.5 py-1.5 text-[12px] leading-tight text-bg shadow-pop"
            style={{ left: X(hover) + 14 + 120 > w ? X(hover) - 128 : X(hover) + 14, top: hp.v === null ? pad.t : clamp(Y(hp.v) - 48, 0, height - 52) }}
          >
            <div className="font-mono text-[13px] font-medium">
              {hp.v === null ? 'Invalid reading' : fmt(hp.v, decimals)} <span className="opacity-60">{hp.v === null ? '' : unit}</span>
            </div>
            <div className="opacity-60">{clockTime(hp.t * 1000)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Sparkline({ data, color, height = 36, className }: { data: Pt[]; color: string; height?: number; className?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const gid = useId().replace(/:/g, '')
  const vals = data.map((p) => p.v).filter(isNum)
  const [lo, hi] = vals.length > 1 ? extent(vals, []) : [0, 1]
  const X = (i: number) => 2 + (i / Math.max(1, data.length - 1)) * (w - 6)
  const Y = (v: number) => 3 + ((hi - v) / (hi - lo)) * (height - 6)
  const segs = vals.length > 1 && w ? segments(data, X, Y) : []
  const lastI = data.map((p) => p.v !== null).lastIndexOf(true)
  return (
    <div ref={ref} className={className} style={{ height }}>
      {w > 0 && (
        <svg width={w} height={height} className="block overflow-visible">
          <defs>
            <linearGradient id={`s${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity=".22" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {segs.length === 0 && <line x1="0" x2={w} y1={height / 2} y2={height / 2} stroke="var(--grid)" strokeDasharray="3 4" />}
          {segs.map((d, i) => {
            const m = d.match(/^M([\d.]+),/), l = d.match(/L?([\d.]+),[\d.]+$/)
            return <path key={'a' + i} d={`${d}L${l?.[1]},${height}L${m?.[1]},${height}Z`} fill={`url(#s${gid})`} />
          })}
          {segs.map((d, i) => <path key={i} d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />)}
          {segs.length > 0 && lastI >= 0 && (
            <>
              <circle cx={X(lastI)} cy={Y(data[lastI].v!)} r="5" fill={color} opacity=".2" className="ping-soft" style={{ transformOrigin: `${X(lastI)}px ${Y(data[lastI].v!)}px` }} />
              <circle cx={X(lastI)} cy={Y(data[lastI].v!)} r="2.6" fill={color} />
            </>
          )}
        </svg>
      )}
    </div>
  )
}
