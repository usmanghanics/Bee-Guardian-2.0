import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BellOff, BellRing, Check, CheckCheck, Cpu, Radio, Settings, ShieldCheck, Trash2 } from 'lucide-react'
import { gooeyToast } from 'goey-toast'
import { PageHeader } from '@/components/app/Shell'
import { Button } from '@/components/ui/button'
import { Badge, Card, Segmented } from '@/components/ui/primitives'
import { useTelemetry, type HiveEvent } from '@/lib/telemetry'
import { clockTime, cn, relTime } from '@/lib/utils'

type Filter = 'all' | 'alerts' | 'unread' | 'system'
const ICONS = { alert: BellRing, recovery: ShieldCheck, connection: Radio, sensor: Cpu, config: Settings }
const TONE = { alert: 'bg-danger-soft text-danger', ok: 'bg-ok-soft text-ok', warn: 'bg-warn-soft text-warn', info: 'bg-info-soft text-info', neutral: 'bg-sunken text-fg-2' }

export default function Alerts() {
  const { events, unread, acknowledge, acknowledgeAll, clearEvents } = useTelemetry()
  const [filter, setFilter] = useState<Filter>('all')
  const list = useMemo(() => events.filter((e) => (filter === 'alerts' ? e.kind === 'alert' : filter === 'unread' ? !e.acknowledged : filter === 'system' ? e.kind !== 'alert' : true)), [events, filter])
  const groups = useMemo(() => {
    const g: { day: string; items: HiveEvent[] }[] = []
    list.forEach((e) => {
      const day = new Date(e.t).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
      const last = g[g.length - 1]
      if (last?.day === day) last.items.push(e)
      else g.push({ day, items: [e] })
    })
    return g
  }, [list])

  function clear() {
    gooeyToast.warning('Clear the activity log?', {
      description: 'This removes all events stored in this browser.',
      action: { label: 'Clear log', onClick: () => clearEvents(), successLabel: 'Cleared' },
    })
  }
  const counts = { all: events.length, alerts: events.filter((e) => e.kind === 'alert').length, unread, system: events.filter((e) => e.kind !== 'alert').length }
  return (
    <>
      <PageHeader
        title="Alerts & activity"
        description="Every threshold breach, recovery, connection change and settings update in this browser."
        actions={
          <>
            <Button variant="secondary" size="sm" disabled={!unread} onClick={() => { acknowledgeAll(); gooeyToast.success('All alerts acknowledged') }}><CheckCheck className="ico ico-pop size-3.5" /> Mark all read</Button>
            <Button variant="ghost" size="sm" disabled={!events.length} onClick={clear}><Trash2 className="ico ico-shake size-3.5" /> Clear</Button>
          </>
        }
      />
      <div className="mb-4">
        <Segmented
          layoutId="al-filter"
          value={filter}
          onChange={setFilter}
          options={(['all', 'alerts', 'unread', 'system'] as const).map((f) => ({ value: f, label: <>{{ all: 'All', alerts: 'Alerts', unread: 'Unread', system: 'System' }[f]}<span className="rounded bg-sunken px-1 font-mono text-[10.5px] text-fg-3">{counts[f]}</span></> }))}
        />
      </div>
      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <div className="grid place-items-center px-6 py-20 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-sunken text-fg-3"><BellOff className="size-6" /></span>
            <h3 className="mt-5 text-[16px] font-semibold">{filter === 'unread' ? 'You’re all caught up' : 'Nothing here yet'}</h3>
            <p className="mt-1 max-w-[42ch] text-[13.5px] text-fg-2">Events appear here as soon as a reading crosses a limit, the device connects or disconnects, or you change a threshold.</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.day}>
              <div className="sticky top-14 z-10 border-b border-line bg-surface-2/90 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-fg-3 backdrop-blur">{g.day}</div>
              <ul>
                <AnimatePresence initial={false}>
                  {g.items.map((e) => {
                    const Icon = ICONS[e.kind]
                    return (
                      <motion.li key={e.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className={cn('group flex items-center gap-4 border-b border-line px-5 py-3.5 last:border-b-0 transition-colors hover:bg-surface-2', !e.acknowledged && 'bg-danger/[.03]')}>
                        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', TONE[e.tone])}><Icon className={cn('size-4', e.kind === 'alert' && 'ico ico-ring')} /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13.5px] font-medium">{e.title}</span>
                            {!e.acknowledged && <Badge tone="alert">New</Badge>}
                          </div>
                          {e.detail && <div className="mt-0.5 truncate font-mono text-[12px] text-fg-3">{e.detail}</div>}
                        </div>
                        <div className="hidden text-right sm:block">
                          <div className="font-mono text-[12px] text-fg-2 tnum">{clockTime(e.t)}</div>
                          <div className="text-[11.5px] text-fg-3">{relTime(e.t)}</div>
                        </div>
                        {e.kind === 'alert' && !e.acknowledged ? (
                          <Button variant="secondary" size="sm" onClick={() => acknowledge(e.id)}><Check className="ico ico-pop size-3.5" /> Acknowledge</Button>
                        ) : (
                          <span className="w-[112px] text-right text-[12px] text-fg-3 max-sm:hidden">{e.kind === 'alert' ? 'Acknowledged' : ''}</span>
                        )}
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            </div>
          ))
        )}
      </Card>
    </>
  )
}
