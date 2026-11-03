import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, BellRing, CircleAlert, Cpu, Droplets, FlaskConical, Minus, Plus, Radio, RefreshCw, RotateCcw, Settings,
  ShieldCheck, Thermometer, TriangleAlert, Unplug, Waves, type LucideIcon,
} from 'lucide-react'
import { gooeyToast } from 'goey-toast'
import { Button } from '@/components/ui/button'
import { Badge, Card, CardHeader, Eyebrow } from '@/components/ui/primitives'
import { Sparkline, type Pt } from '@/components/charts/charts'
import { HUMIDITY_REFERENCE, LIMITS, ledMode, useTelemetry, type HiveEvent, type Sample, type Tone } from '@/lib/telemetry'
import { usePrefs } from '@/lib/prefs'
import { clamp, clockTime, cn, fmt, isNum, relTime, uptime } from '@/lib/utils'

export type SeriesKey = 'temperature' | 'humidity' | 'swing' | 'z'
export const SERIES: Record<SeriesKey, { label: string; unit: string; dec: number; color: string; icon: LucideIcon; anim: string }> = {
  temperature: { label: 'Temperature', unit: '°C', dec: 1, color: 'var(--temp)', icon: Thermometer, anim: 'ico-pulse' },
  humidity: { label: 'Humidity', unit: '% RH', dec: 0, color: 'var(--hum)', icon: Droplets, anim: 'ico-float' },
  swing: { label: 'Vibration', unit: 'counts', dec: 0, color: 'var(--vib)', icon: Waves, anim: 'ico-shake' },
  z: { label: 'Z-axis raw', unit: 'ADC', dec: 0, color: 'var(--zaxis)', icon: Activity, anim: 'ico-pop' },
}
export function seriesPoints(h: Sample[], k: SeriesKey): Pt[] {
  return h.map((p) => ({ t: p.t, v: k === 'swing' ? p.swing : k === 'z' ? p.z : p.tempValid && isNum(p[k]) ? (p[k] as number) : null }))
}
export function stats(pts: Pt[]) {
  const v = pts.map((p) => p.v).filter(isNum)
  if (!v.length) return null
  return { cur: v[v.length - 1], min: Math.min(...v), max: Math.max(...v), avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length }
}
function delta(pts: Pt[], dec: number) {
  const p = pts.filter((x) => x.v !== null)
  if (p.length < 4) return null
  const now = p[p.length - 1], past = p.find((q) => q.t >= now.t - 10) ?? p[0]
  const d = (now.v as number) - (past.v as number)
  return Math.abs(d) < Math.pow(10, -dec) / 2 ? 0 : d
}

/* ───────────── Status banner ───────────── */
export function StatusBanner() {
  const { state, latest, settings, link, error } = useTelemetry()
  const d = latest
  const t = settings
  const conf: Record<string, { tone: Tone; icon: LucideIcon; title: string; body: string }> = {
    normal: { tone: 'ok', icon: ShieldCheck, title: 'Hive conditions are normal', body: `All readings are within your limits — ${fmt(d?.temperature)} °C, ${fmt(d?.humidity, 0)} % RH, vibration ${d?.swing ?? '--'} counts.` },
    temp: { tone: 'alert', icon: Thermometer, title: 'Temperature above limit', body: `${fmt(d?.temperature)} °C is at or above your ${fmt(t?.temperature)} °C limit. The buzzer is sounding and the LED is blinking slowly.` },
    vib: { tone: 'alert', icon: Waves, title: 'Vibration detected', body: `A swing of ${d?.swing} counts reached your ${t?.vibration}-count limit. The buzzer is sounding and the LED is blinking fast.` },
    both: { tone: 'alert', icon: BellRing, title: 'Temperature and vibration alerts', body: `${fmt(d?.temperature)} °C and ${d?.swing} counts are both over their limits. Buzzer on, LED solid.` },
    invalid: { tone: 'warn', icon: TriangleAlert, title: 'Temperature sensor needs attention', body: 'The DHT11 didn’t return a valid reading. Check the D2 data wire, power, ground and any required 4.7–10 kΩ pull-up resistor.' },
    offline: { tone: 'neutral', icon: Unplug, title: link === 'connecting' ? 'Connecting to your hive…' : link === 'server-offline' ? 'Dashboard server unavailable' : 'Arduino disconnected', body: link === 'connecting' ? 'Waiting for the first reading.' : error ?? 'Connect the Uno over USB and close Arduino Serial Monitor.' },
  }
  const c = conf[state]
  const stripe = { ok: 'bg-ok', alert: 'bg-danger', warn: 'bg-warn', neutral: 'bg-fg-3', info: 'bg-info' }[c.tone]
  const chip = { ok: 'bg-ok-soft text-ok', alert: 'bg-danger-soft text-danger', warn: 'bg-warn-soft text-warn', neutral: 'bg-sunken text-fg-3', info: 'bg-info-soft text-info' }[c.tone]
  const led = ledMode(d)
  const buzz = !!d && (d.tempAlert || d.vibAlert)
  return (
    <Card className="relative overflow-hidden">
      <motion.span layout className={cn('absolute inset-y-0 left-0 w-[3px]', stripe)} />
      {c.tone === 'alert' && <motion.div className="pointer-events-none absolute inset-0 bg-danger/[.04]" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />}
      <div className="relative grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex min-w-0 gap-4">
          <AnimatePresence mode="wait">
            <motion.span key={state} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className={cn('grid size-11 shrink-0 place-items-center rounded-xl', chip)}>
              <c.icon className={cn('size-5', c.tone === 'alert' && 'ico-ring is-active')} />
            </motion.span>
          </AnimatePresence>
          <div className="min-w-0" aria-live="polite">
            <Eyebrow>System status</Eyebrow>
            <h2 className="mt-1.5 text-[20px] font-semibold leading-tight tracking-[-0.025em]">{c.title}</h2>
            <p className="mt-1 max-w-[70ch] text-[13.5px] text-fg-2">{c.body}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line bg-surface-2">
          <div className="px-4 py-3">
            <Eyebrow>Buzzer</Eyebrow>
            <div className="mt-1.5 flex items-center gap-2 whitespace-nowrap text-[13.5px] font-medium">
              <span className="flex h-3 items-end gap-[2px]">{[0, 1, 2, 3].map((i) => <i key={i} className={cn('w-[2px] rounded-sm', buzz ? 'bg-danger' : 'h-1 bg-line-strong')} style={buzz ? { animation: `eq .5s ${-i * 0.12}s ease-in-out infinite alternate` } : undefined} />)}</span>
              {d ? (buzz ? '1 kHz' : 'Silent') : '—'}
            </div>
          </div>
          <div className="px-4 py-3">
            <Eyebrow>LED · D9</Eyebrow>
            <div className="mt-1.5 flex items-center gap-2 whitespace-nowrap text-[13.5px] font-medium">
              <span className={cn('size-2.5 rounded-full', led === 'off' ? 'bg-line-strong' : 'bg-danger shadow-[0_0_10px_var(--danger)]', led === 'slow' && 'lamp-slow', led === 'fast' && 'lamp-fast')} />
              {d ? { off: 'Off', slow: 'Slow', fast: 'Fast', solid: 'Solid' }[led] : '—'}
            </div>
          </div>
          <div className="px-4 py-3">
            <Eyebrow>Uptime</Eyebrow>
            <div className="mt-1.5 whitespace-nowrap font-mono text-[13.5px] font-medium tnum">{uptime(d?.ms)}</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ───────────── Metric card ───────────── */
function Meter({ value, limit, max, color, band }: { value: number | null; limit?: number; max: number; color: string; band?: [number, number] }) {
  const scale = limit ? Math.max(max, limit * 1.5) : max
  return (
    <div className="relative h-1.5 rounded-full bg-sunken">
      {band && <div className="absolute inset-y-0 rounded-sm" style={{ left: `${band[0]}%`, width: `${band[1] - band[0]}%`, background: `color-mix(in srgb, ${color} 22%, transparent)` }} />}
      {!band && <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: color }} animate={{ width: `${isNum(value) ? clamp((value / scale) * 100, 0, 100) : 0}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />}
      {band && isNum(value) && <motion.div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-surface" style={{ borderColor: color }} animate={{ left: `${clamp(value, 0, 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />}
      {isNum(limit) && isNum(value) && <div className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-fg" style={{ left: `${clamp((limit / scale) * 100, 0, 100)}%` }} />}
    </div>
  )
}

export function MetricCard({ k, onSelect, selected }: { k: Exclude<SeriesKey, 'z'>; onSelect?: () => void; selected?: boolean }) {
  const { latest: d, settings, history } = useTelemetry()
  const cfg = SERIES[k]
  const pts = useMemo(() => seriesPoints(history.slice(-90), k), [history, k])
  const valid = !!d && (k === 'swing' || (d.tempValid && isNum(d[k])))
  const value = valid && d ? (k === 'swing' ? d.swing : (d[k] as number)) : null
  const dl = valid ? delta(pts, cfg.dec) : null
  const limit = k === 'temperature' ? settings?.temperature : k === 'swing' ? settings?.vibration : undefined
  const alert = !!d && ((k === 'temperature' && d.tempAlert) || (k === 'swing' && d.vibAlert))
  let badge: { tone: Tone; label: string } = { tone: 'neutral', label: 'Awaiting data' }
  if (d) {
    if (!valid) badge = { tone: 'warn', label: 'Sensor invalid' }
    else if (k === 'temperature') badge = alert ? { tone: 'alert', label: 'Above limit' } : { tone: 'ok', label: 'Normal' }
    else if (k === 'swing') badge = alert ? { tone: 'alert', label: 'Movement' } : { tone: 'ok', label: 'Still' }
    else badge = value! < HUMIDITY_REFERENCE[0] ? { tone: 'neutral', label: 'Below range' } : value! > HUMIDITY_REFERENCE[1] ? { tone: 'neutral', label: 'Above range' } : { tone: 'ok', label: 'In range' }
  }
  const Comp = onSelect ? motion.button : motion.div
  return (
    <Comp
      onClick={onSelect}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'group relative flex min-w-0 flex-col gap-3 rounded-2xl border bg-surface p-4 text-left shadow-xs transition-[border-color,box-shadow] hover:shadow-card',
        alert ? 'border-danger/45' : selected ? 'border-line-strong ring-1 ring-line-strong' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-medium text-fg-2">
          <span className="grid size-7 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${cfg.color} 14%, transparent)`, color: cfg.color }}><cfg.icon className={cn('ico size-[15px]', cfg.anim)} /></span>
          {cfg.label}
        </span>
        <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-fg-3">{k === 'swing' ? 'GY-61 · A1' : 'DHT11 · D2'}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value === null ? 'x' : fmt(value, cfg.dec)} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.2 }} className="font-mono text-[32px] font-medium leading-none tracking-[-0.05em] tnum">
            {value === null ? '--' : fmt(value, cfg.dec)}
          </motion.span>
        </AnimatePresence>
        <span className="text-[13px] text-fg-3">{cfg.unit}</span>
        {dl !== null && <span className={cn('ml-auto font-mono text-[11.5px] tnum', dl === 0 ? 'text-fg-3' : 'text-fg-2')}>{dl === 0 ? '±0' : `${dl > 0 ? '↑' : '↓'} ${Math.abs(dl).toFixed(cfg.dec)}`}</span>}
      </div>
      <Sparkline data={pts} color={cfg.color} height={34} />
      <Meter value={value} limit={limit} max={k === 'temperature' ? 50 : 100} color={cfg.color} band={k === 'humidity' ? HUMIDITY_REFERENCE : undefined} />
      <div className="flex items-center justify-between gap-2 text-[12px] text-fg-3">
        <span>{k === 'humidity' ? <>Reference <span className="font-mono">50–70</span> %</> : <>Limit <span className="font-mono">{limit !== undefined ? fmt(limit, cfg.dec) : '--'}</span> {k === 'swing' ? 'counts' : '°C'}</>}</span>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
    </Comp>
  )
}

/* ───────────── Threshold editor ───────────── */
function Stepper({ value, onChange, min, max, step, unit, label, dec }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string; label: string; dec: number }) {
  const [text, setText] = useState(value.toFixed(dec))
  useEffect(() => setText(value.toFixed(dec)), [value, dec])
  const commit = (raw: string) => {
    const n = Number(raw)
    onChange(clamp(Number.isFinite(n) ? Math.round(n / step) * step : value, min, max))
  }
  return (
    <div className="flex h-9 items-center overflow-hidden rounded-[9px] border border-line bg-surface-2 focus-within:border-honey focus-within:shadow-[0_0_0_4px_var(--ring)]">
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(clamp(value - step, min, max))} className="group grid h-full w-8 place-items-center text-fg-3 hover:bg-sunken hover:text-fg"><Minus className="ico ico-pop size-3.5" /></button>
      <input aria-label={label} inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="h-full w-14 bg-transparent text-right font-mono text-[13px] outline-none tnum focus-visible:outline-none" />
      <span className="pl-1 pr-1.5 text-[12px] text-fg-3">{unit}</span>
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(clamp(value + step, min, max))} className="group grid h-full w-8 place-items-center text-fg-3 hover:bg-sunken hover:text-fg"><Plus className="ico ico-pop size-3.5" /></button>
    </div>
  )
}

export function ThresholdEditor({ compact }: { compact?: boolean }) {
  const { settings, link, applyThresholds } = useTelemetry()
  const online = link === 'online'
  const [t, setT] = useState(30)
  const [v, setV] = useState(35)
  const [edited, setEdited] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (settings && !edited && !busy) {
      setT(settings.temperature)
      setV(Math.min(LIMITS.vibration.max, settings.vibration))
    }
  }, [settings, edited, busy])
  const dirty = !!settings && (Math.abs(t - settings.temperature) > 0.01 || v !== settings.vibration)

  async function apply() {
    setBusy(true)
    const id = gooeyToast('Sending to Arduino…', { description: `${t.toFixed(1)} °C · ${v} counts`, duration: 20000 })
    try {
      await applyThresholds({ temperature: t, vibration: v })
      gooeyToast.update(id, { title: 'Thresholds confirmed', type: 'success', description: `The Uno is now using ${t.toFixed(1)} °C and ${v} counts.` })
      setEdited(false)
    } catch (e) {
      gooeyToast.update(id, { title: 'Update not confirmed', type: 'error', description: (e as Error).message })
    } finally {
      setBusy(false)
      setTimeout(() => gooeyToast.dismiss(id), 4000)
    }
  }
  const rows = [
    { key: 'temperature', label: 'Temperature', hint: 'Alarm at or above', value: t, set: setT, ...LIMITS.temperature, unit: '°C', dec: 1, device: settings ? `${settings.temperature.toFixed(1)} °C` : '—' },
    { key: 'vibration', label: 'Vibration', hint: 'Lower is more sensitive', value: v, set: setV, ...LIMITS.vibration, unit: 'ct', dec: 0, device: settings ? `${settings.vibration} counts` : '—' },
  ]
  return (
    <Card>
      <CardHeader
        title={<span className="flex items-center gap-2">Alert thresholds {dirty && <span className="size-1.5 rounded-full bg-honey" title="Unsaved changes" />}</span>}
        description="Written to the Uno over USB serial"
        action={compact ? <Link to="/app/settings" className="group grid size-8 place-items-center rounded-lg text-fg-3 hover:bg-sunken hover:text-fg" aria-label="Open settings"><Settings className="ico ico-spin size-4" /></Link> : undefined}
      />
      <div className="space-y-5 px-5 pt-5">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-medium">{r.label}</div>
                <div className="text-[11.5px] text-fg-3">{r.hint}</div>
              </div>
              <Stepper label={`${r.label} limit`} value={r.value} onChange={(x) => { r.set(x); setEdited(true) }} min={r.min} max={r.max} step={r.step} unit={r.unit} dec={r.dec} />
            </div>
            <input
              type="range"
              aria-label={`${r.label} limit slider`}
              className="range"
              min={r.min}
              max={r.max}
              step={r.step}
              value={r.value}
              onChange={(e) => { r.set(Number(e.target.value)); setEdited(true) }}
              style={{ ['--p' as string]: `${((r.value - r.min) / (r.max - r.min)) * 100}%` }}
            />
            <div className="mt-1 flex justify-between font-mono text-[10.5px] text-fg-3"><span>{r.min}</span><span>On device: <span className="text-fg-2">{r.device}</span></span><span>{r.max}</span></div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-5">
        <Button variant="secondary" disabled={!dirty || busy} onClick={() => { if (settings) { setT(settings.temperature); setV(settings.vibration); setEdited(false) } }} className="flex-1">
          <RotateCcw className="ico ico-flip size-3.5" /> Revert
        </Button>
        <Button disabled={!online || !dirty} loading={busy} onClick={apply} className="flex-[1.6]">{busy ? 'Confirming…' : 'Apply to device'}</Button>
      </div>
      {!online && <p className="-mt-2 px-5 pb-5 text-[12px] text-fg-3">Connect the device (or switch to simulated data) to change thresholds.</p>}
    </Card>
  )
}

/* ───────────── Activity feed ───────────── */
const toneDot: Record<Tone, string> = { ok: 'border-ok', alert: 'border-danger bg-danger', warn: 'border-warn', info: 'border-info', neutral: 'border-fg-3' }
export function ActivityFeed({ limit = 8, events: ext }: { limit?: number; events?: HiveEvent[] }) {
  const { events: all } = useTelemetry()
  const events = (ext ?? all).slice(0, limit)
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 10000)
    return () => clearInterval(id)
  }, [])
  return (
    <Card>
      <CardHeader title="Activity" description="Alerts, connections and changes" action={<Link to="/app/alerts" className="text-[12.5px] font-medium text-fg-2 hover:text-fg">View all</Link>} />
      <ul className="px-5 pb-3 pt-3">
        {events.length === 0 && <li className="py-6 text-center text-[13px] text-fg-3">No activity yet. Events appear here as they happen.</li>}
        <AnimatePresence initial={false}>
          {events.map((e, i) => (
            <motion.li key={e.id} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="relative grid grid-cols-[14px_1fr_auto] gap-3 py-2.5">
              {i < events.length - 1 && <span className="absolute left-[6px] top-[26px] bottom-[-10px] w-px bg-line" />}
              <span className={cn('relative z-10 mt-1 size-[11px] rounded-full border-2 bg-surface', toneDot[e.tone])} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{e.title}</div>
                {e.detail && <div className="truncate text-[12px] text-fg-3">{e.detail}</div>}
              </div>
              <time className="font-mono text-[11px] text-fg-3" title={clockTime(e.t)}>{relTime(e.t)}</time>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Card>
  )
}

/* ───────────── Offline guidance ───────────── */
export function OfflineNotice() {
  const { link, source } = useTelemetry()
  const { setPref } = usePrefs()
  if (link === 'online' || link === 'connecting') return null
  const server = link === 'server-offline'
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex flex-col gap-4 rounded-2xl border border-dashed border-line-strong bg-surface-2 p-5 sm:flex-row sm:items-center">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn">{server ? <CircleAlert className="size-5" /> : <Cpu className="size-5" />}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold">{server ? 'Start the local dashboard server' : 'Waiting for the Arduino'}</div>
        <p className="mt-0.5 text-[13px] text-fg-2">
          {server ? <>Run <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[12px]">python3 server.py</code> in the project folder, then this page reconnects by itself.</> : 'Plug the Uno in over USB and close Arduino Serial Monitor. The server retries automatically.'}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => location.reload()}><RefreshCw className="ico ico-spin size-3.5" /> Retry</Button>
        {source !== 'demo' && <Button variant="honey" size="sm" onClick={() => { setPref('source', 'demo'); gooeyToast.info('Switched to simulated data', { description: 'Switch back to Live from the sidebar any time.' }) }}><FlaskConical className="ico ico-wiggle size-3.5" /> Use simulated data</Button>}
      </div>
    </motion.div>
  )
}

export function DemoRibbon() {
  const { source } = useTelemetry()
  const { setPref } = usePrefs()
  if (source !== 'demo') return null
  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-honey/40 bg-honey-soft/70 px-4 py-2.5 text-[13px]">
      <FlaskConical className="size-4 text-honey-ink" />
      <span className="flex-1 text-fg-2"><span className="font-medium text-fg">Simulated data.</span> Readings follow the firmware’s alarm rules but don’t come from a device.</span>
      <button onClick={() => setPref('source', 'live')} className="group inline-flex items-center gap-1.5 font-medium text-fg hover:underline"><Radio className="ico ico-pulse size-3.5" /> Go live</button>
    </div>
  )
}

export function StatTile({ label, value, sub, icon: Icon, tone = 'neutral' }: { label: string; value: ReactNode; sub?: ReactNode; icon: LucideIcon; tone?: Tone }) {
  const cls = { ok: 'text-ok bg-ok-soft', alert: 'text-danger bg-danger-soft', warn: 'text-warn bg-warn-soft', info: 'text-info bg-info-soft', neutral: 'text-fg-2 bg-sunken' }[tone]
  return (
    <Card className="group p-4">
      <div className="flex items-center justify-between">
        <Eyebrow>{label}</Eyebrow>
        <span className={cn('grid size-7 place-items-center rounded-lg', cls)}><Icon className="ico ico-pop size-3.5" /></span>
      </div>
      <div className="mt-3 font-mono text-[24px] font-medium tracking-[-0.04em] tnum">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-fg-3">{sub}</div>}
    </Card>
  )
}

