import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { sleep, store } from './utils'

/**
 * Front-end only demo authentication.
 * Accounts live in localStorage on this browser — there is no backend and no real security.
 * Replace `signIn` / `signUp` with real API calls when a backend exists.
 */
export type User = { name: string; email: string; apiary: string; createdAt: number }
type Account = User & { password: string }
type Ctx = {
  user: User | null
  signIn: (email: string, password: string, remember: boolean) => Promise<User>
  signUp: (data: { name: string; email: string; password: string; apiary: string }) => Promise<User>
  signOut: () => void
  updateProfile: (patch: Partial<Pick<User, 'name' | 'apiary'>>) => void
  requestReset: (email: string) => Promise<void>
}

export const DEMO_ACCOUNT: Account = {
  name: 'Ayesha Khan',
  email: 'demo@beeguardian.app',
  password: 'honeybee',
  apiary: 'Meadow Apiary',
  createdAt: Date.UTC(2026, 9, 1),
}

const AuthCtx = createContext<Ctx | null>(null)
const accounts = () => store.get<Account[]>('bg:accounts', [])
const strip = ({ password: _p, ...u }: Account): User => u

function loadSession(): User | null {
  try {
    const s = sessionStorage.getItem('bg:session') ?? localStorage.getItem('bg:session')
    return s ? (JSON.parse(s) as User) : null
  } catch {
    return null
  }
}
function saveSession(u: User | null, remember = true) {
  try {
    sessionStorage.removeItem('bg:session')
    localStorage.removeItem('bg:session')
    if (u) (remember ? localStorage : sessionStorage).setItem('bg:session', JSON.stringify(u))
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadSession)

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    await sleep(850)
    const e = email.trim().toLowerCase()
    const all = [DEMO_ACCOUNT, ...accounts()]
    const acc = all.find((a) => a.email === e)
    if (!acc || acc.password !== password) throw new Error('That email and password don’t match an account.')
    const u = strip(acc)
    saveSession(u, remember)
    setUser(u)
    return u
  }, [])

  const signUp = useCallback(async (d: { name: string; email: string; password: string; apiary: string }) => {
    await sleep(1000)
    const e = d.email.trim().toLowerCase()
    if (e === DEMO_ACCOUNT.email || accounts().some((a) => a.email === e)) throw new Error('An account with this email already exists.')
    const acc: Account = { name: d.name.trim(), email: e, password: d.password, apiary: d.apiary.trim() || 'My Apiary', createdAt: Date.now() }
    store.set('bg:accounts', [...accounts(), acc])
    const u = strip(acc)
    saveSession(u)
    setUser(u)
    return u
  }, [])

  const signOut = useCallback(() => {
    saveSession(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback((patch: Partial<Pick<User, 'name' | 'apiary'>>) => {
    setUser((u) => {
      if (!u) return u
      const next = { ...u, ...patch }
      saveSession(next, !!localStorage.getItem('bg:session'))
      store.set('bg:accounts', accounts().map((a) => (a.email === u.email ? { ...a, ...patch } : a)))
      return next
    })
  }, [])

  const requestReset = useCallback(async () => {
    await sleep(900)
  }, [])

  return <AuthCtx.Provider value={{ user, signIn, signUp, signOut, updateProfile, requestReset }}>{children}</AuthCtx.Provider>
}
export const useAuth = () => {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('useAuth outside provider')
  return c
}
