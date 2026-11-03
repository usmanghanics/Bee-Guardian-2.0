import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { gooeyToast } from 'goey-toast'
import { usePrefs, type DataSource } from './prefs'
import { clamp, fmt, sleep, store } from './utils'

/* ───────────── Types (mirror the firmware's JSON) ───────────── */
export type Telemetry = {
  type?: 'telemetry'
  ms: number
  temperature: number | null
  humidity: number | null
  tempValid: boolean
  z: number
  minZ: number
  maxZ: number
  swing: number
  tempThreshold: number
  vibThreshold: number
  tempAlert: boolean
  vibAlert: boolean
}
export type Sample = Telemetry & { t: number } // t = epoch seconds
export type Settings = { temperature: number; vibration: number }
export type StatusResponse = {
  connected: boolean
  port: string | null
  error: string | null
  lastSeen: number | null
  latest: Telemetry | null
  settings: Settings
  history: Sample[]
}
export type Link = 'connecting' | 'online' | 'device-offline' | 'server-offline'
export type HiveState = 'normal' | 'temp' | 'vib' | 'both' | 'invalid' | 'offline'
export type EventKind = 'alert' | 'recovery' | 'connection' | 'sensor' | 'config'
export type Tone = 'ok' | 'alert' | 'warn' | 'info' | 'neutral'
export type HiveEvent = { id: string; t: number; kind: EventKind; tone: Tone; title: string; detail?: string; acknowledged: boolean }

export const LIMITS = { temperature: { min: 15, max: 80, step: 0.5 }, vibration: { min: 1, max: 150, step: 1 } }
export const HUMIDITY_REFERENCE: [number, number] = [50, 70]
const MAX_HISTORY = 3600 // 30 minutes at 2 Hz
const POLL_MS = 700

/* ───────────── API backends ───────────── */
interface Backend {
  status(): Promise<StatusResponse>
  setThresholds(s: Settings): Promise<void>
}

const liveBackend: Backend = {
  async status() {
    const r = await fetch('/api/status', { cache: 'no-store' })
    if (!r.ok) throw new Error('Server unavailable')
    const ct = r.headers.get('content-type') || ''
    if (!ct.includes('json')) throw new Error('Server unavailable')
    return r.json()
  },
  async setThresholds(s) {
    const r = await fetch('/api/thresholds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
    let data: { error?: string } = {}
    try {
      data = await r.json()
    } catch {
      /* non-JSON */
    }
    if (!r.ok) throw new Error(data.error || 'The dashboard server rejected the request.')
  },
}

/** Physically plausible simulator that follows the firmware's rules exactly. */
export class Simulator implements Backend {
  private boot = Date.now() - 734_000
  private hist: Sample[] = []
  private settings: Settings = { temperature: 30, vibration: 35 }
  private pending: { at: number; v: Settings } | null = null
  private temp = 28.4
  private hum = 58
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(seed = 90) {
    const now = Date.now() / 1000
    for (let i = seed; i > 0; i--) this.tick(now - i * 0.5)
  }
  start() {
    if (!this.timer) this.timer = setInterval(() => this.tick(), 500)
    return this
  }
  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
  tick(t = Date.now() / 1000) {
    const el = t - this.boot / 1000
    this.temp = clamp(this.temp + Math.sin(el / 22) * 0.025 + (Math.random() - 0.5) * 0.07, 24, 34.5)
    this.hum = clamp(this.hum + (Math.random() - 0.5) * 0.35, 44, 74)
    const burst = el % 45 > 38 ? 28 + Math.random() * 26 : 0
    const swing = Math.round(5 + Math.random() * 8 + burst)
    const z = Math.round(512 + (Math.random() - 0.5) * swing)
    const valid = !(el % 300 > 297)
    if (this.pending && Date.now() > this.pending.at) {
      this.settings = this.pending.v
      this.pending = null
    }
    const s: Sample = {
      t,
      type: 'telemetry',
      ms: Math.round(t * 1000 - this.boot),
      temperature: valid ? +this.temp.toFixed(2) : null,
      humidity: valid ? +this.hum.toFixed(2) : null,
      tempValid: valid,
      z,
      minZ: z - (swing >> 1),
      maxZ: z - (swing >> 1) + swing,
      swing,
      tempThreshold: this.settings.temperature,
      vibThreshold: this.settings.vibration,
      tempAlert: valid && this.temp >= this.settings.temperature,
      vibAlert: swing >= this.settings.vibration,
    }
    this.hist.push(s)
    if (this.hist.length > 200) this.hist.shift()
    return s
  }
  latest() {
    return this.hist[this.hist.length - 1]
  }
  recent(n: number) {
    return this.hist.slice(-n)
  }
  async status(): Promise<StatusResponse> {
    const l = this.latest()
    return { connected: true, port: 'simulated', error: null, lastSeen: l.t, latest: l, settings: { ...this.settings }, history: this.hist.slice(-100) }
  }
  async setThresholds(v: Settings) {
    await sleep(250)
    this.pending = { at: Date.now() + 600, v: { ...v } }
  }
}

/* ───────────── Derived helpers ───────────── */
export function hiveState(link: Link, d: Telemetry | null): HiveState {
  if (link !== 'online' || !d) return 'offline'
  if (!d.tempValid) return 'invalid'
  if (d.tempAlert && d.vibAlert) return 'both'
  if (d.tempAlert) return 'temp'
  if (d.vibAlert) return 'vib'
  return 'normal'
}
export function ledMode(d: Telemetry | null): 'off' | 'slow' | 'fast' | 'solid' {
  if (!d) return 'off'
  if (d.tempAlert && d.vibAlert) return 'solid'
  if (d.tempAlert) return 'slow'
  if (d.vibAlert) return 'fast'
  return 'off'
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = 1000
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.4)
    setTimeout(() => ctx.close(), 600)
  } catch {
    /* audio unavailable */
  }
}

/* ───────────── Provider ───────────── */
type Ctx = {
  source: DataSource
  link: Link
  state: HiveState
  latest: Telemetry | null
  settings: Settings | null
  port: string | null
  error: string | null
  lastSeen: number | null
  history: Sample[]
  events: HiveEvent[]
  unread: number
  applyThresholds: (s: Settings) => Promise<void>
  acknowledge: (id: string) => void
  acknowledgeAll: () => void
  clearEvents: () => void
  exportCsv: () => void
}
const TelemetryCtx = createContext<Ctx | null>(null)

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const { prefs } = usePrefs()
  const source = prefs.source
  const [link, setLink] = useState<Link>('connecting')
  const [snap, setSnap] = useState<StatusResponse | null>(null)
  const [history, setHistory] = useState<Sample[]>([])
  const [events, setEvents] = useState<HiveEvent[]>(() => store.get<HiveEvent[]>('bg:events', []))
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs
  const prev = useRef<{ state: HiveState | null; link: Link | null; valid: boolean | null }>({ state: null, link: null, valid: null })

  const backend = useMemo<Backend>(() => (source === 'demo' ? new Simulator() : liveBackend), [source])
  useEffect(() => {
    if (!(backend instanceof Simulator)) return
    backend.start()
    return () => backend.stop()
  }, [backend])

  useEffect(() => store.set('bg:events', events.slice(0, 200)), [events])

  const push = useCallback((e: Omit<HiveEvent, 'id' | 't' | 'acknowledged'>) => {
    setEvents((list) => [{ ...e, id: Math.random().toString(36).slice(2, 10), t: Date.now(), acknowledged: e.kind !== 'alert' }, ...list].slice(0, 200))
  }, [])

  // Reset session buffers when switching source
  useEffect(() => {
    setHistory([])
    setSnap(null)
    setLink('connecting')
    prev.current = { state: null, link: null, valid: null }
  }, [source])

  // Poll loop
  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout>
    const loop = async () => {
      let s: StatusResponse | null = null
      let l: Link
      try {
        s = await backend.status()
        l = s.connected && s.latest && s.lastSeen && Date.now() / 1000 - s.lastSeen < 4 ? 'online' : 'device-offline'
      } catch {
        l = 'server-offline'
      }
      if (!alive) return
      setSnap(s)
      setLink(l)
      if (s && l === 'online' && s.history?.length) {
        setHistory((h) => {
          const lastT = h.length ? h[h.length - 1].t : 0
          const add = s!.history.filter((p) => p.t > lastT)
          if (!add.length) return h
          const next = h.concat(add)
          return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
        })
      }

      // Derive events
      const d = l === 'online' ? s!.latest : null
      const st = hiveState(l, d)
      const p = prev.current
      if (l !== p.link && !(p.link === null && l !== 'online')) {
        if (l === 'online') push({ kind: 'connection', tone: 'ok', title: source === 'demo' ? 'Simulation started' : 'Device connected', detail: source === 'demo' ? 'Streaming simulated telemetry' : `Serial port ${s!.port}` })
        else if (p.link === 'online') {
          push({ kind: 'connection', tone: 'warn', title: l === 'server-offline' ? 'Dashboard server unreachable' : 'Device disconnected', detail: s?.error ?? undefined })
          if (prefsRef.current.alertToasts) gooeyToast.warning(l === 'server-offline' ? 'Dashboard server unreachable' : 'Arduino disconnected', { description: 'Live readings paused. Reconnecting automatically…' })
        }
      }
      if (d && p.valid !== null && p.valid !== d.tempValid) {
        push({ kind: 'sensor', tone: d.tempValid ? 'ok' : 'warn', title: d.tempValid ? 'DHT11 readings restored' : 'DHT11 reading invalid', detail: d.tempValid ? undefined : 'Check D2 wiring, power and pull-up resistor' })
      }
      if (d && st !== p.state && st !== 'invalid' && st !== 'offline') {
        const alertTitle = { both: 'Temperature + vibration alert', temp: 'Temperature above limit', vib: 'Vibration detected' } as const
        if (st === 'normal') {
          if (p.state && p.state !== 'normal' && p.state !== 'offline' && p.state !== 'invalid') {
            push({ kind: 'recovery', tone: 'ok', title: 'Conditions back to normal', detail: `${fmt(d.temperature)} °C · ${d.swing} counts` })
          }
        } else {
          const detail = st === 'vib' ? `${d.swing} counts ≥ ${s!.settings.vibration}` : st === 'temp' ? `${fmt(d.temperature)} °C ≥ ${fmt(s!.settings.temperature)} °C` : `${fmt(d.temperature)} °C · ${d.swing} counts`
          push({ kind: 'alert', tone: 'alert', title: alertTitle[st], detail })
          if (prefsRef.current.alertToasts) gooeyToast.error(alertTitle[st], { description: `${detail}. Buzzer is sounding on the hive.` })
          if (prefsRef.current.alertSound) beep()
        }
      }
      prev.current = { state: st === 'invalid' ? p.state : st, link: l, valid: d ? d.tempValid : null }

      timer = setTimeout(loop, POLL_MS)
    }
    loop()
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [backend, push, source])

  const applyThresholds = useCallback(
    async (target: Settings) => {
      await backend.setThresholds(target)
      for (let i = 0; i < 12; i++) {
        await sleep(450)
        try {
          const s = await backend.status()
          if (Math.abs(s.settings.temperature - target.temperature) < 0.11 && Number(s.settings.vibration) === target.vibration) {
            setSnap(s)
            push({ kind: 'config', tone: 'info', title: 'Thresholds updated', detail: `${target.temperature.toFixed(1)} °C · ${target.vibration} counts` })
            return
          }
        } catch {
          /* retry */
        }
      }
      throw new Error('The Arduino didn’t confirm the new values. Check the USB serial link.')
    },
    [backend, push],
  )

  const acknowledge = useCallback((id: string) => setEvents((l) => l.map((e) => (e.id === id ? { ...e, acknowledged: true } : e))), [])
  const acknowledgeAll = useCallback(() => setEvents((l) => l.map((e) => ({ ...e, acknowledged: true }))), [])
  const clearEvents = useCallback(() => setEvents([]), [])

  const exportCsv = useCallback(() => {
    const head = 'timestamp,temperature_c,humidity_pct,temp_valid,vibration_counts,z,min_z,max_z,temp_threshold,vib_threshold,temp_alert,vib_alert'
    const rows = history.map((p) =>
      [new Date(p.t * 1000).toISOString(), p.temperature ?? '', p.humidity ?? '', p.tempValid, p.swing, p.z, p.minZ, p.maxZ, p.tempThreshold, p.vibThreshold, p.tempAlert, p.vibAlert].join(','),
    )
    const blob = new Blob([[head, ...rows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bee-guardian-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }, [history])

  const latest = link === 'online' ? snap?.latest ?? null : null
  const value: Ctx = {
    source,
    link,
    state: hiveState(link, latest),
    latest,
    settings: snap?.settings ?? null,
    port: snap?.port ?? null,
    error: link === 'server-offline' ? 'The local dashboard server isn’t reachable.' : snap?.error ?? null,
    lastSeen: snap?.lastSeen ?? null,
    history,
    events,
    unread: events.filter((e) => !e.acknowledged).length,
    applyThresholds,
    acknowledge,
    acknowledgeAll,
    clearEvents,
    exportCsv,
  }
  return <TelemetryCtx.Provider value={value}>{children}</TelemetryCtx.Provider>
}

export const useTelemetry = () => {
  const c = useContext(TelemetryCtx)
  if (!c) throw new Error('useTelemetry outside provider')
  return c
}

/** Lightweight simulated feed for marketing visuals (landing hero / preview). */
export function useDemoFeed(points = 60) {
  const sim = useMemo(() => new Simulator(points), [points])
  const [, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      sim.tick()
      force((n) => n + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [sim])
  return { latest: sim.latest(), history: sim.recent(points) }
}
