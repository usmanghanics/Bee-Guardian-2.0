import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { store } from './utils'

export type DataSource = 'live' | 'demo'
export type Prefs = {
  source: DataSource
  alertToasts: boolean
  alertSound: boolean
  sidebarCollapsed: boolean
}
const DEFAULTS: Prefs = { source: 'live', alertToasts: true, alertSound: false, sidebarCollapsed: false }
type Ctx = { prefs: Prefs; setPref: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void }
const PrefsCtx = createContext<Ctx | null>(null)

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(() => {
    const p = { ...DEFAULTS, ...store.get<Partial<Prefs>>('bg:prefs', {}) }
    if (new URLSearchParams(location.search).has('demo')) p.source = 'demo'
    return p
  })
  const setPref = useCallback(<K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    setPrefs((p) => {
      const n = { ...p, [k]: v }
      store.set('bg:prefs', n)
      return n
    })
  }, [])
  return <PrefsCtx.Provider value={{ prefs, setPref }}>{children}</PrefsCtx.Provider>
}
export const usePrefs = () => {
  const c = useContext(PrefsCtx)
  if (!c) throw new Error('usePrefs outside provider')
  return c
}
