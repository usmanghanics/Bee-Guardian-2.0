import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type Ctx = { theme: Theme; resolved: 'light' | 'dark'; setTheme: (t: Theme) => void; toggle: () => void }
const ThemeCtx = createContext<Ctx | null>(null)
const mq = () => window.matchMedia('(prefers-color-scheme: dark)')

function read(): Theme {
  try {
    const t = localStorage.getItem('bg:theme')
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(read)
  const [sysDark, setSysDark] = useState(() => mq().matches)
  useEffect(() => {
    const m = mq(), on = () => setSysDark(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  const resolved = theme === 'system' ? (sysDark ? 'dark' : 'light') : theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try {
      if (t === 'system') localStorage.removeItem('bg:theme')
      else localStorage.setItem('bg:theme', t)
    } catch {
      /* ignore */
    }
  }, [])
  const toggle = useCallback(() => setTheme(resolved === 'dark' ? 'light' : 'dark'), [resolved, setTheme])
  return <ThemeCtx.Provider value={{ theme, resolved, setTheme, toggle }}>{children}</ThemeCtx.Provider>
}
export const useTheme = () => {
  const c = useContext(ThemeCtx)
  if (!c) throw new Error('useTheme outside provider')
  return c
}
