import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { gooeyToast } from 'goey-toast'
import { PageHeader } from '@/components/app/Shell'
import { ActivityFeed, DemoRibbon, MetricCard, OfflineNotice, SERIES, seriesPoints, StatusBanner, stats, ThresholdEditor, type SeriesKey } from '@/components/app/widgets'
import { AreaChart } from '@/components/charts/charts'
import { Button } from '@/components/ui/button'
import { Card, Eyebrow, Segmented } from '@/components/ui/primitives'
import { HUMIDITY_REFERENCE, useTelemetry } from '@/lib/telemetry'
import { useAuth } from '@/lib/auth'
import { fmt } from '@/lib/utils'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Overview() {
  const { user } = useAuth()
  const { history, settings, link, exportCsv } = useTelemetry()
  const [series, setSeries] = useState<Exclude<SeriesKey, 'z'>>('temperature')
  const recent = history.slice(-120)
  const pts = useMemo(() => seriesPoints(recent, series), [recent, series])
  const st = stats(pts)
  const cfg = SERIES[series]
  const threshold = series === 'temperature' ? settings?.temperature : series === 'swing' ? settings?.vibration : undefined
  const span = recent.length > 1 ? Math.round(recent[recent.length - 1].t - recent[0].t) : 0
  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name.split(' ')[0] ?? 'beekeeper'}`}
        description="Here’s what’s happening inside Hive 01 right now."
        actions={<Button variant="secondary" size="sm" onClick={() => (history.length ? (exportCsv(), gooeyToast.success('Export ready', { description: `${history.length} readings saved as CSV.` })) : gooeyToast.warning('Nothing to export yet'))}><Download className="ico ico-float size-3.5" /> Export</Button>}
      />
      <OfflineNotice />
      <DemoRibbon />
      <div className="space-y-4">
        <StatusBanner />
        <div className="grid gap-4 sm:grid-cols-3">
          {(['temperature', 'humidity', 'swing'] as const).map((k) => <MetricCard key={k} k={k} selected={series === k} onSelect={() => setSeries(k)} />)}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
              <div>
                <h3 className="text-[14px] font-semibold tracking-[-0.01em]">Telemetry</h3>
                <p className="mt-0.5 text-[12.5px] text-fg-3">{link === 'online' && span ? `Last ${span} s · ${recent.length} samples` : "Recent readings"}</p>
              </div>
              <Segmented layoutId="ov-series" value={series} onChange={setSeries} options={(['temperature', 'humidity', 'swing'] as const).map((k) => ({ value: k, label: <><span className="size-2 rounded-[3px]" style={{ background: SERIES[k].color }} />{SERIES[k].label}</> }))} />
            </div>
            <div className="px-3 pt-4">
              <AreaChart data={pts} color={cfg.color} unit={cfg.unit} decimals={cfg.dec} threshold={threshold} band={series === 'humidity' ? HUMIDITY_REFERENCE : undefined} height={300} emptyLabel={link === 'online' ? 'Collecting readings…' : 'No live telemetry'} />
            </div>
            <div className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
              {(['cur', 'min', 'avg', 'max'] as const).map((k, i) => (
                <div key={k} className={`px-5 py-3.5 ${i ? 'sm:border-l' : ''} ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t sm:border-t-0' : ''} border-line`}>
                  <Eyebrow>{{ cur: 'Current', min: 'Min', avg: 'Average', max: 'Max' }[k]}</Eyebrow>
                  <div className="mt-1 font-mono text-[15px] font-medium tnum">{st ? `${fmt(st[k], cfg.dec)} ${cfg.unit}` : '—'}</div>
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-4">
            <ThresholdEditor compact />
          </div>
        </div>
        <ActivityFeed limit={6} />
      </div>
    </>
  )
}
