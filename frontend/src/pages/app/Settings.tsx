import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Database, FlaskConical, Monitor, Moon, Palette, Radio, SlidersHorizontal, Sun, Trash2, User } from 'lucide-react'
import { gooeyToast } from 'goey-toast'
import { PageHeader, Avatar } from '@/components/app/Shell'
import { ThresholdEditor } from '@/components/app/widgets'
import { Button } from '@/components/ui/button'
import { Card, Input, Switch } from '@/components/ui/primitives'
import { useAuth } from '@/lib/auth'
import { usePrefs } from '@/lib/prefs'
import { useTheme } from '@/lib/theme'
import { useTelemetry } from '@/lib/telemetry'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'thresholds', label: 'Thresholds', icon: SlidersHorizontal, anim: 'ico-wiggle' },
  { id: 'notifications', label: 'Notifications', icon: Bell, anim: 'ico-ring' },
  { id: 'appearance', label: 'Appearance', icon: Palette, anim: 'ico-tilt' },
  { id: 'data', label: 'Data source', icon: Database, anim: 'ico-pop' },
  { id: 'account', label: 'Account', icon: User, anim: 'ico-pop' },
] as const
type Tab = (typeof TABS)[number]['id']

function Row({ title, body, children }: { title: string; body: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-[52ch]">
        <div className="text-[13.5px] font-medium">{title}</div>
        <div className="mt-0.5 text-[12.5px] text-fg-3">{body}</div>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'thresholds') as Tab
  const setTab = (t: Tab) => setParams(t === 'thresholds' ? {} : { tab: t }, { replace: true })
  const { prefs, setPref } = usePrefs()
  const { theme, setTheme } = useTheme()
  const { user, updateProfile } = useAuth()
  const { clearEvents, exportCsv, history } = useTelemetry()
  const [name, setName] = useState(user?.name ?? '')
  const [apiary, setApiary] = useState(user?.apiary ?? '')
  useEffect(() => {
    setName(user?.name ?? '')
    setApiary(user?.apiary ?? '')
  }, [user])

  return (
    <>
      <PageHeader title="Settings" description="Device limits, alerts, appearance and your account." />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Settings sections">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn('group relative flex h-9 shrink-0 items-center gap-2.5 rounded-[9px] px-3 text-[13.5px] font-medium transition-colors', tab === t.id ? 'text-fg' : 'text-fg-2 hover:bg-sunken hover:text-fg')}>
              {tab === t.id && <motion.span layoutId="set-tab" className="absolute inset-0 rounded-[9px] bg-surface shadow-xs ring-1 ring-line" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              <t.icon className={cn('ico relative size-4', t.anim)} />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </nav>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }} className="min-w-0 max-w-3xl space-y-4">
            {tab === 'thresholds' && (
              <>
                <ThresholdEditor />
                <p className="text-[12.5px] text-fg-3">Limits are stored in the Uno’s RAM. After a reset or power loss the device returns to 30.0 °C and 35 counts.</p>
              </>
            )}
            {tab === 'notifications' && (
              <Card>
                <Row title="Alert toasts" body="Show a notification when a reading crosses a limit or the device disconnects.">
                  <Switch label="Alert toasts" checked={prefs.alertToasts} onChange={(v) => { setPref('alertToasts', v); gooeyToast.success(v ? 'Alert toasts on' : 'Alert toasts off') }} />
                </Row>
                <Row title="Alert sound" body="Play a short 1 kHz beep in the browser on new alerts. Useful when the hive buzzer is out of earshot.">
                  <Switch label="Alert sound" checked={prefs.alertSound} onChange={(v) => setPref('alertSound', v)} />
                </Row>
                <Row title="Send a test notification" body="Preview how an alert will look.">
                  <Button variant="secondary" size="sm" onClick={() => gooeyToast.error('Temperature above limit', { description: '31.2 °C ≥ 30.0 °C. Buzzer is sounding on the hive.', action: { label: 'View alerts', onClick: () => undefined, successLabel: 'Opened' } })}>Send test</Button>
                </Row>
              </Card>
            )}
            {tab === 'appearance' && (
              <Card className="p-5">
                <div className="text-[13.5px] font-medium">Theme</div>
                <div className="mt-0.5 text-[12.5px] text-fg-3">Choose how Bee Guardian looks on this device.</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {([['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]] as const).map(([id, label, Icon]) => (
                    <button key={id} onClick={() => setTheme(id)} className={cn('group overflow-hidden rounded-xl border text-left transition-all', theme === id ? 'border-fg ring-1 ring-fg' : 'border-line hover:border-line-strong')}>
                      <div className={cn('h-24 p-3', id === 'dark' ? 'bg-[#0d0c0a]' : id === 'light' ? 'bg-[#f7f5f0]' : 'bg-[linear-gradient(90deg,#f7f5f0_50%,#0d0c0a_50%)]')}>
                        <div className={cn('h-full rounded-lg border p-2', id === 'dark' ? 'border-[#26241f] bg-[#151411]' : 'border-[#e7e2d8] bg-white')}>
                          <div className="h-1.5 w-10 rounded-full bg-[#e8a317]" />
                          <div className={cn('mt-2 h-1.5 w-16 rounded-full', id === 'dark' ? 'bg-[#35322b]' : 'bg-[#e7e2d8]')} />
                          <div className={cn('mt-1.5 h-1.5 w-12 rounded-full', id === 'dark' ? 'bg-[#35322b]' : 'bg-[#e7e2d8]')} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-line px-3 py-2.5 text-[13px] font-medium"><Icon className="ico ico-spin size-3.5" /> {label}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between rounded-xl bg-sunken px-4 py-3">
                  <div className="text-[13px]"><span className="font-medium">Compact sidebar</span><span className="text-fg-3"> · icons only on desktop</span></div>
                  <Switch label="Compact sidebar" checked={prefs.sidebarCollapsed} onChange={(v) => setPref('sidebarCollapsed', v)} />
                </div>
              </Card>
            )}
            {tab === 'data' && (
              <>
                <Card className="p-5">
                  <div className="text-[13.5px] font-medium">Data source</div>
                  <div className="mt-0.5 text-[12.5px] text-fg-3">Live mode reads the Arduino through the local server. Simulation runs entirely in the browser.</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {([['live', 'Live device', 'Arduino Uno over USB serial', Radio], ['demo', 'Simulated data', 'Realistic readings, same alarm rules', FlaskConical]] as const).map(([id, l, d, Icon]) => (
                      <button key={id} onClick={() => { setPref('source', id); gooeyToast.info(id === 'demo' ? 'Switched to simulated data' : 'Switched to live device') }} className={cn('group flex gap-3 rounded-xl border p-4 text-left transition-all', prefs.source === id ? 'border-fg ring-1 ring-fg' : 'border-line hover:border-line-strong')}>
                        <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', prefs.source === id ? 'bg-fg text-bg' : 'bg-sunken text-fg-2')}><Icon className="ico ico-pop size-4" /></span>
                        <span><span className="block text-[13.5px] font-medium">{l}</span><span className="block text-[12px] text-fg-3">{d}</span></span>
                      </button>
                    ))}
                  </div>
                </Card>
                <Card>
                  <Row title="Export session" body={`Download the ${history.length} readings held in memory as CSV.`}>
                    <Button variant="secondary" size="sm" disabled={!history.length} onClick={exportCsv}>Export CSV</Button>
                  </Row>
                  <Row title="Clear activity log" body="Remove all alerts and events stored in this browser.">
                    <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => { clearEvents(); gooeyToast.success('Activity log cleared') }}><Trash2 className="ico ico-shake size-3.5" /> Clear</Button>
                  </Row>
                </Card>
              </>
            )}
            {tab === 'account' && user && (
              <Card>
                <div className="flex items-center gap-4 border-b border-line p-5">
                  <Avatar name={user.name} className="size-14 text-[18px]" />
                  <div>
                    <div className="text-[16px] font-semibold">{user.name}</div>
                    <div className="text-[13px] text-fg-3">{user.email} · member since {new Date(user.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
                <form
                  className="grid gap-4 p-5 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (name.trim().length < 2) return gooeyToast.error('Name is too short')
                    updateProfile({ name: name.trim(), apiary: apiary.trim() || 'My Apiary' })
                    gooeyToast.success('Profile saved')
                  }}
                >
                  <Input label="Full name" name="name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input label="Apiary" name="apiary" value={apiary} onChange={(e) => setApiary(e.target.value)} />
                  <Input label="Email" name="email" value={user.email} disabled hint="Email can’t be changed in the demo." className="sm:col-span-2 [&_input]:text-fg-3" />
                  <div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={name === user.name && apiary === user.apiary}>Save changes</Button></div>
                </form>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
