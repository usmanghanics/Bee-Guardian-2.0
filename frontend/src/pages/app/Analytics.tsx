import { useMemo, useState } from 'react'
import { BellRing, Clock, Download, Droplets, Thermometer, Waves } from 'lucide-react'
import { gooeyToast } from 'goey-toast'
import { PageHeader } from '@/components/app/Shell'
import { DemoRibbon, OfflineNotice, SERIES, seriesPoints, StatTile, stats, type SeriesKey } from '@/components/app/widgets'
import { AreaChart } from '@/components/charts/charts'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, Segmented } from '@/components/ui/primitives'
import { HUMIDITY_REFERENCE, useTelemetry } from '@/lib/telemetry'
import { fmt } from '@/lib/utils'

const RANGES = [
  { value: '60', label: '1 min' },
  { value: '300', label: '5 min' },
  { value: '900', label: '15 min' },
  { value: 'all', label: 'Session' },
] as const

export default function Analytics() {
  const { history, settings, events, exportCsv } = useTelemetry()
  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('300')
  const data = useMemo(() => {
    if (range === 'all' || !history.length) return history
    const cut = history[history.length - 1].t - Number(range)
    return history.filter((p) => p.t >= cut)
  }, [history, range])
  const span = data.length > 1 ? data[data.length - 1].t - data[0].t : 0
  const tempAlertPct = data.length ? (data.filter((p) => p.tempAlert).length / data.length) * 100 : 0
  const vibAlertPct = data.length ? (data.filter((p) => p.vibAlert).length / data.length) * 100 : 0
  const alerts = events.filter((e) => e.kind === 'alert').length
  const st = (k: SeriesKey) => stats(seriesPoints(data, k))
  const t = st('temperature'), h = st('humidity'), v = st('swing')
  const charts: { k: SeriesKey; thr?: number; band?: [number, number] }[] = [
    { k: 'temperature', thr: settings?.temperature },
    { k: 'humidity', band: HUMIDITY_REFERENCE },
    { k: 'swing', thr: settings?.vibration },
    { k: 'z' },
  ]
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Trends and summaries for this session. History is kept in memory for up to 30 minutes."
        actions={
          <>
            <Segmented layoutId="an-range" size="sm" value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r.value, label: r.label }))} />
            <Button variant="secondary" size="sm" onClick={() => (data.length ? (exportCsv(), gooeyToast.success('CSV downloaded', { description: `${history.length} readings` })) : gooeyToast.warning('Nothing to export yet'))}><Download className="ico ico-float size-3.5" /> CSV</Button>
          </>
        }
      />
      <OfflineNotice />
      <DemoRibbon />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Avg temperature" icon={Thermometer} value={t ? `${fmt(t.avg)}°` : '—'} sub={t ? `${fmt(t.min)} – ${fmt(t.max)} °C` : 'No valid readings'} />
        <StatTile label="Avg humidity" icon={Droplets} value={h ? `${fmt(h.avg, 0)}%` : '—'} sub={h ? `${fmt(h.min, 0)} – ${fmt(h.max, 0)} % RH` : 'No valid readings'} />
        <StatTile label="Peak vibration" icon={Waves} value={v ? fmt(v.max, 0) : '—'} sub={v ? `avg ${fmt(v.avg, 0)} counts` : '—'} tone={v && settings && v.max >= settings.vibration ? 'alert' : 'neutral'} />
        <StatTile label="Alerts" icon={BellRing} value={alerts} sub={<>Time in alert: <span className="font-mono">{fmt(tempAlertPct, 0)}%</span> temp · <span className="font-mono">{fmt(vibAlertPct, 0)}%</span> vib</>} tone={alerts ? 'alert' : 'ok'} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {charts.map(({ k, thr, band }) => {
          const c = SERIES[k], s = st(k)
          return (
            <Card key={k} className="min-w-0">
              <CardHeader
                icon={<span className="grid size-8 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${c.color} 14%, transparent)`, color: c.color }}><c.icon className="size-4" /></span>}
                title={c.label}
                description={s ? <span className="font-mono">min {fmt(s.min, c.dec)} · avg {fmt(s.avg, c.dec)} · max {fmt(s.max, c.dec)} {c.unit}</span> : 'No data in this range'}
              />
              <div className="px-3 pb-3 pt-3"><AreaChart data={seriesPoints(data, k)} color={c.color} unit={c.unit} decimals={c.dec} threshold={thr} band={band} height={220} /></div>
            </Card>
          )
        })}
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-[12px] text-fg-3"><Clock className="size-3.5" /> Showing {data.length} samples over {Math.round(span)} s.</p>
    </>
  )
}
