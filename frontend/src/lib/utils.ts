import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
export const fmt = (v: number | null | undefined, d = 1) => (isNum(v) ? v.toFixed(d) : '--')
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function clockTime(d: Date | number, withSeconds = true) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}) })
}
export function relTime(t: number) {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.round(m / 60)}h ago`
}
export function uptime(ms?: number | null) {
  if (!isNum(ms)) return '—'
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(ss).padStart(2, '0')}s`
}

export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key)
      return v == null ? fallback : (JSON.parse(v) as T)
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* storage unavailable */
    }
  },
}
