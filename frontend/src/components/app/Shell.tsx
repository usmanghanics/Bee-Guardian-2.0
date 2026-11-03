import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell, BellRing, ChartLine, ChevronRight, CircleHelp, Cpu, Download, FlaskConical, House, LayoutDashboard, LogOut, Moon,
  PanelLeftClose, PanelLeftOpen, Radio, Search, Settings, Sun, User, X, CheckCheck, Menu,
} from 'lucide-react'
import { gooeyToast } from 'goey-toast'
import { LogoMark } from '@/components/ui/brand'
import { Kbd, MenuItem, Popover } from '@/components/ui/primitives'
import { useAuth } from '@/lib/auth'
import { usePrefs } from '@/lib/prefs'
import { useTheme } from '@/lib/theme'
import { TelemetryProvider, useTelemetry, type HiveEvent } from '@/lib/telemetry'
import { cn, relTime } from '@/lib/utils'

const NAV = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, anim: 'ico-pop', end: true },
  { to: '/app/analytics', label: 'Analytics', icon: ChartLine, anim: 'ico-pulse' },
  { to: '/app/alerts', label: 'Alerts', icon: BellRing, anim: 'ico-ring', badge: true },
  { to: '/app/device', label: 'Device', icon: Cpu, anim: 'ico-wiggle' },
  { to: '/app/settings', label: 'Settings', icon: Settings, anim: 'ico-spin' },
]
const TITLES: Record<string, string> = { '/app': 'Overview', '/app/analytics': 'Analytics', '/app/alerts': 'Alerts', '/app/device': 'Device', '/app/settings': 'Settings' }

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('')
}
export function Avatar({ name, className }: { name: string; className?: string }) {
  return <span className={cn('grid size-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f3c35a,#c98a0c)] text-[12px] font-semibold text-ink ring-2 ring-surface', className)}>{initials(name)}</span>
}

/* ───────────── Connection pill ───────────── */
export function ConnectionPill({ compact }: { compact?: boolean }) {
  const { link, source, port } = useTelemetry()
  const map = {
    online: { cls: 'bg-ok', label: source === 'demo' ? 'Simulated' : 'Live', sub: source === 'demo' ? '' : port },
    connecting: { cls: 'bg-fg-3', label: 'Connecting', sub: '' },
    'device-offline': { cls: 'bg-warn', label: 'Device offline', sub: '' },
    'server-offline': { cls: 'bg-danger', label: 'Server offline', sub: '' },
  }[link]
  return (
    <Link to="/app/device" className="group inline-flex h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[12.5px] font-medium text-fg-2 shadow-xs transition-colors hover:border-line-strong hover:text-fg">
      <span className="relative flex size-2">
        {link === 'online' && <span className={cn('ping-soft absolute inset-0 rounded-full', map.cls)} />}
        <span className={cn('relative size-2 rounded-full', map.cls)} />
      </span>
      {map.label}
      {!compact && map.sub && <span className="hidden max-w-[140px] truncate font-mono text-[11px] font-normal text-fg-3 xl:inline">{map.sub}</span>}
    </Link>
  )
}

/* ───────────── Sidebar ───────────── */
function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { unread, state, link, source } = useTelemetry()
  const { user } = useAuth()
  const { prefs, setPref } = usePrefs()
  const dot = link !== 'online' ? 'bg-fg-3' : state === 'normal' ? 'bg-ok' : state === 'invalid' ? 'bg-warn' : 'bg-danger'
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-14 items-center gap-2.5 px-4', collapsed && 'justify-center px-0')}>
        <Link to="/" className="group flex items-center gap-2.5" aria-label="Bee Guardian home">
          <motion.span whileHover={{ rotate: 60 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}><LogoMark className="size-7" /></motion.span>
          {!collapsed && <span className="text-[15.5px] font-semibold tracking-[-0.02em]">Bee Guardian</span>}
        </Link>
      </div>

      <div className={cn('px-3 pt-2', collapsed && 'px-2')}>
        <div className={cn('flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-2.5', collapsed && 'justify-center p-2')} title={collapsed ? `${user?.apiary} · Hive 01` : undefined}>
          <span className="relative grid size-8 shrink-0 place-items-center rounded-lg bg-honey-soft text-honey-ink">
            <House className="size-4" />
            <span className={cn('absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-surface-2', dot)} />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium">Hive 01</div>
              <div className="truncate text-[11.5px] text-fg-3">{user?.apiary ?? 'My Apiary'}</div>
            </div>
          )}
        </div>
      </div>

      <nav className={cn('mt-4 flex-1 space-y-0.5 px-3', collapsed && 'px-2')} aria-label="Main">
        {!collapsed && <div className="px-2.5 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-fg-3">Monitor</div>}
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate} title={collapsed ? n.label : undefined}
            className={({ isActive }) => cn('group relative flex h-9 items-center gap-3 rounded-[9px] px-2.5 text-[13.5px] font-medium transition-colors', collapsed && 'justify-center px-0', isActive ? 'text-fg' : 'text-fg-2 hover:bg-sunken hover:text-fg')}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-active" transition={{ type: 'spring', stiffness: 500, damping: 40 }} className="absolute inset-0 rounded-[9px] bg-surface shadow-xs ring-1 ring-line" />}
                <n.icon className={cn('ico relative size-[17px]', n.anim, isActive && 'text-honey-ink')} />
                {!collapsed && <span className="relative">{n.label}</span>}
                {n.badge && unread > 0 && (
                  <span className={cn('relative grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 font-mono text-[10px] font-semibold text-white', collapsed ? 'absolute right-1 top-0.5 h-4 min-w-4' : 'ml-auto')}>{unread > 99 ? '99+' : unread}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={cn('space-y-1 border-t border-line p-3', collapsed && 'px-2')}>
        {!collapsed && (
          <div className="mb-2 rounded-xl border border-line bg-surface-2 p-1">
            <div className="grid grid-cols-2 gap-1">
              {(['live', 'demo'] as const).map((s) => (
                <button key={s} onClick={() => setPref('source', s)} className={cn('group flex h-8 items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium transition-colors', prefs.source === s ? 'bg-surface text-fg shadow-xs ring-1 ring-line' : 'text-fg-3 hover:text-fg')}>
                  {s === 'live' ? <Radio className="ico ico-pulse size-3.5" /> : <FlaskConical className="ico ico-wiggle size-3.5" />}
                  {s === 'live' ? 'Live' : 'Simulated'}
                </button>
              ))}
            </div>
          </div>
        )}
        <a href="/#faq" title={collapsed ? 'Help' : undefined} className={cn('group flex h-9 items-center gap-3 rounded-[9px] px-2.5 text-[13.5px] text-fg-2 hover:bg-sunken hover:text-fg', collapsed && 'justify-center px-0')}>
          <CircleHelp className="ico ico-wiggle size-[17px]" /> {!collapsed && 'Help & FAQ'}
        </a>
        {source === 'demo' && collapsed && <div className="mx-auto mt-1 h-1 w-6 rounded-full bg-honey" title="Simulated data" />}
      </div>
    </div>
  )
}

/* ───────────── Notifications ───────────── */
function EventIcon({ e }: { e: HiveEvent }) {
  const cls = { alert: 'bg-danger-soft text-danger', ok: 'bg-ok-soft text-ok', warn: 'bg-warn-soft text-warn', info: 'bg-info-soft text-info', neutral: 'bg-sunken text-fg-2' }[e.tone]
  const Icon = e.kind === 'alert' ? BellRing : e.kind === 'connection' ? Radio : e.kind === 'config' ? Settings : e.kind === 'sensor' ? Cpu : CheckCheck
  return <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', cls)}><Icon className="size-4" /></span>
}
function Notifications() {
  const { events, unread, acknowledgeAll, acknowledge } = useTelemetry()
  const nav = useNavigate()
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15000)
    return () => clearInterval(id)
  }, [])
  return (
    <Popover
      className="w-[min(380px,calc(100vw-24px))] p-0"
      trigger={({ toggle, open }) => (
        <button onClick={toggle} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className={cn('group relative grid size-9 place-items-center rounded-lg text-fg-2 transition-colors hover:bg-sunken hover:text-fg', open && 'bg-sunken text-fg')}>
          <Bell className={cn('ico ico-ring size-[18px]', unread > 0 && 'is-active')} key={unread} />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger ring-2 ring-bg" />}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="text-[14px] font-semibold">Notifications</div>
            <button onClick={acknowledgeAll} disabled={!unread} className="group inline-flex items-center gap-1.5 text-[12.5px] text-fg-2 hover:text-fg disabled:opacity-40"><CheckCheck className="ico ico-pop size-3.5" /> Mark all read</button>
          </div>
          <div className="scroll-thin max-h-[360px] overflow-auto p-1.5">
            {events.length === 0 && <div className="px-4 py-10 text-center text-[13px] text-fg-3">You’re all caught up.</div>}
            {events.slice(0, 12).map((e) => (
              <button key={e.id} onClick={() => acknowledge(e.id)} className="flex w-full gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-sunken">
                <EventIcon e={e} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px] font-medium">{e.title}{!e.acknowledged && <span className="size-1.5 rounded-full bg-danger" />}</div>
                  {e.detail && <div className="truncate text-[12px] text-fg-3">{e.detail}</div>}
                </div>
                <span className="shrink-0 font-mono text-[11px] text-fg-3">{relTime(e.t)}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-line p-1.5">
            <button onClick={() => { close(); nav('/app/alerts') }} className="group flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-medium text-fg-2 hover:bg-sunken hover:text-fg">View all activity <ChevronRight className="ico ico-nudge size-3.5" /></button>
          </div>
        </div>
      )}
    </Popover>
  )
}

/* ───────────── User menu ───────────── */
function UserMenu() {
  const { user, signOut } = useAuth()
  const { resolved, toggle } = useTheme()
  const nav = useNavigate()
  if (!user) return null
  return (
    <Popover
      className="w-64"
      trigger={({ toggle: t }) => (
        <button onClick={t} aria-label="Account menu" className="rounded-full transition-transform hover:scale-105"><Avatar name={user.name} /></button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-3 px-2.5 py-2">
            <Avatar name={user.name} className="size-9" />
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-medium">{user.name}</div>
              <div className="truncate text-[12px] text-fg-3">{user.email}</div>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <MenuItem icon={<User className="size-4" />} onClick={() => { close(); nav('/app/settings?tab=account') }}>Profile</MenuItem>
          <MenuItem icon={<Settings className="size-4" />} anim="ico-spin" onClick={() => { close(); nav('/app/settings') }}>Settings</MenuItem>
          <MenuItem icon={resolved === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />} anim="ico-tilt" onClick={toggle}>{resolved === 'dark' ? 'Light mode' : 'Dark mode'}</MenuItem>
          <MenuItem icon={<House className="size-4" />} onClick={() => { close(); nav('/') }}>Back to website</MenuItem>
          <div className="my-1 h-px bg-line" />
          <MenuItem danger icon={<LogOut className="size-4" />} anim="ico-nudge" onClick={() => { signOut(); gooeyToast('Signed out', { description: 'See you soon.' }); nav('/login') }}>Sign out</MenuItem>
        </>
      )}
    </Popover>
  )
}

/* ───────────── Command menu ───────────── */
function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate()
  const { toggle, resolved } = useTheme()
  const { prefs, setPref } = usePrefs()
  const { exportCsv, acknowledgeAll, history } = useTelemetry()
  const { signOut } = useAuth()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const items = useMemo(() => {
    const all: { group: string; label: string; icon: typeof Bell; run: () => void; hint?: string }[] = [
      ...NAV.map((n) => ({ group: 'Pages', label: n.label, icon: n.icon, run: () => nav(n.to) })),
      { group: 'Actions', label: resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', icon: resolved === 'dark' ? Sun : Moon, run: toggle },
      { group: 'Actions', label: prefs.source === 'demo' ? 'Use live device data' : 'Use simulated data', icon: prefs.source === 'demo' ? Radio : FlaskConical, run: () => { setPref('source', prefs.source === 'demo' ? 'live' : 'demo'); gooeyToast.info(prefs.source === 'demo' ? 'Switched to live device' : 'Switched to simulated data') } },
      { group: 'Actions', label: 'Export session as CSV', icon: Download, run: () => (history.length ? exportCsv() : gooeyToast.warning('Nothing to export yet', { description: 'Wait for a few readings first.' })) },
      { group: 'Actions', label: 'Mark all alerts as read', icon: CheckCheck, run: acknowledgeAll },
      { group: 'Actions', label: 'Edit alert thresholds', icon: Settings, run: () => nav('/app/settings') },
      { group: 'Account', label: 'Back to website', icon: House, run: () => nav('/') },
      { group: 'Account', label: 'Sign out', icon: LogOut, run: () => { signOut(); nav('/login') } },
    ]
    const s = q.trim().toLowerCase()
    return s ? all.filter((i) => i.label.toLowerCase().includes(s)) : all
  }, [q, resolved, prefs.source, history.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setQ('')
      setIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])
  useEffect(() => setIdx(0), [q])

  const run = (i: number) => {
    const it = items[i]
    if (!it) return
    onClose()
    it.run()
  }
  let lastGroup = ''
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/30 px-3 pt-[12vh] backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            role="dialog"
            aria-label="Command menu"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 text-fg-3" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)) }
                  if (e.key === 'Enter') { e.preventDefault(); run(idx) }
                  if (e.key === 'Escape') onClose()
                }}
                placeholder="Search pages and actions…"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-fg-3 focus-visible:outline-none"
              />
              <Kbd>esc</Kbd>
            </div>
            <div className="scroll-thin max-h-[360px] overflow-auto p-2">
              {items.length === 0 && <div className="py-10 text-center text-[13px] text-fg-3">No results for “{q}”.</div>}
              {items.map((it, i) => {
                const head = it.group !== lastGroup
                lastGroup = it.group
                return (
                  <div key={it.label}>
                    {head && <div className="px-3 pb-1 pt-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-fg-3">{it.group}</div>}
                    <button onMouseEnter={() => setIdx(i)} onClick={() => run(i)} className={cn('group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors', i === idx ? 'bg-sunken text-fg' : 'text-fg-2')}>
                      <it.icon className="ico ico-pop size-4" />
                      <span className="flex-1">{it.label}</span>
                      {i === idx && <ChevronRight className="size-3.5 text-fg-3" />}
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[11.5px] text-fg-3">
              <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
              <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> select</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────────── Top bar ───────────── */
function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { pathname } = useLocation()
  const { resolved, toggle } = useTheme()
  const { user } = useAuth()
  const title = TITLES[pathname] ?? 'Overview'
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl backdrop-saturate-150 sm:px-6">
      <button onClick={onMenu} aria-label="Open navigation" className="grid size-9 place-items-center rounded-lg text-fg-2 hover:bg-sunken lg:hidden"><Menu className="size-5" /></button>
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13.5px]">
        <span className="hidden truncate text-fg-3 sm:inline">{user?.apiary ?? 'My Apiary'}</span>
        <ChevronRight className="hidden size-3.5 text-fg-3 sm:block" />
        <span className="hidden text-fg-3 md:inline">Hive 01</span>
        <ChevronRight className="hidden size-3.5 text-fg-3 md:block" />
        <AnimatePresence mode="wait">
          <motion.span key={title} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="font-medium text-fg">{title}</motion.span>
        </AnimatePresence>
      </nav>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button onClick={onSearch} className="group hidden h-8 w-56 items-center gap-2 rounded-[9px] border border-line bg-surface px-2.5 text-[13px] text-fg-3 shadow-xs transition-colors hover:border-line-strong md:flex">
          <Search className="ico ico-grow size-3.5" /> Search…
          <span className="ml-auto flex gap-0.5"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
        </button>
        <button onClick={onSearch} aria-label="Search" className="grid size-9 place-items-center rounded-lg text-fg-2 hover:bg-sunken md:hidden"><Search className="size-[18px]" /></button>
        <div className="hidden sm:block"><ConnectionPill /></div>
        <Notifications />
        <button onClick={toggle} aria-label="Toggle theme" className="group hidden size-9 place-items-center rounded-lg text-fg-2 transition-colors hover:bg-sunken hover:text-fg sm:grid">
          {resolved === 'dark' ? <Sun className="ico ico-spin size-[18px]" /> : <Moon className="ico ico-tilt size-[18px]" />}
        </button>
        <div className="ml-1"><UserMenu /></div>
      </div>
    </header>
  )
}

/* ───────────── Layout ───────────── */
function Frame() {
  const { prefs, setPref } = usePrefs()
  const collapsed = prefs.sidebarCollapsed
  const [mobile, setMobile] = useState(false)
  const [cmd, setCmd] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setMobile(false), [pathname])
  useEffect(() => {
    document.title = `${TITLES[pathname] ?? 'Dashboard'} · Bee Guardian`
  }, [pathname])
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmd((o) => !o)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  return (
    <div className="min-h-[100svh] bg-bg">
      <motion.aside
        animate={{ width: collapsed ? 68 : 252 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-surface-2/60 lg:block"
      >
        <SidebarBody collapsed={collapsed} />
        <button
          onClick={() => setPref('sidebarCollapsed', !collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="group absolute -right-3 top-[68px] grid size-6 place-items-center rounded-full border border-line bg-surface text-fg-3 shadow-xs transition-colors hover:text-fg"
        >
          {collapsed ? <PanelLeftOpen className="ico ico-grow size-3.5" /> : <PanelLeftClose className="ico ico-grow size-3.5" />}
        </button>
      </motion.aside>

      <AnimatePresence>
        {mobile && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobile(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-line bg-surface lg:hidden" initial={{ x: -290 }} animate={{ x: 0 }} exit={{ x: -290 }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}>
              <button onClick={() => setMobile(false)} aria-label="Close navigation" className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-fg-2 hover:bg-sunken"><X className="size-4" /></button>
              <SidebarBody collapsed={false} onNavigate={() => setMobile(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={cn('min-w-0 transition-[padding] duration-300 ease-out', collapsed ? 'lg:pl-[68px]' : 'lg:pl-[252px]')}>
        <Topbar onMenu={() => setMobile(true)} onSearch={() => setCmd(true)} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandMenu open={cmd} onClose={() => setCmd(false)} />
    </div>
  )
}

export function AppLayout() {
  return (
    <TelemetryProvider>
      <Frame />
    </TelemetryProvider>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-semibold tracking-[-0.03em]">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-fg-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
