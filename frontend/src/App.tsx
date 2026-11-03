import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { GooeyToaster } from 'goey-toast'
import { AuthProvider, useAuth } from '@/lib/auth'
import { PrefsProvider } from '@/lib/prefs'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { LogoMark } from '@/components/ui/brand'
import Landing from '@/pages/Landing'
import { ForgotPassword, Login, Signup } from '@/pages/Auth'
import { Legal, NotFound } from '@/pages/Misc'

const AppLayout = lazy(() => import('@/components/app/Shell').then((m) => ({ default: m.AppLayout })))
const Overview = lazy(() => import('@/pages/app/Overview'))
const Analytics = lazy(() => import('@/pages/app/Analytics'))
const Alerts = lazy(() => import('@/pages/app/Alerts'))
const Device = lazy(() => import('@/pages/app/Device'))
const SettingsPage = lazy(() => import('@/pages/app/Settings'))

function Loader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <LogoMark className="size-9 animate-pulse" />
    </div>
  )
}
function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />
  return <>{children}</>
}
function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <Navigate to="/app" replace /> : <>{children}</>
}
function Toaster() {
  const { resolved } = useTheme()
  return <GooeyToaster position="bottom-right" theme={resolved} preset="smooth" closeButton="top-right" maxQueue={4} />
}

export default function App() {
  return (
    <ThemeProvider>
      <PrefsProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/privacy" element={<Legal kind="privacy" />} />
                <Route path="/terms" element={<Legal kind="terms" />} />
                <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
                  <Route index element={<Overview />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="device" element={<Device />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="/index.html" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </PrefsProvider>
    </ThemeProvider>
  )
}
