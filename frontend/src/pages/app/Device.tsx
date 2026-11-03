import { useState } from 'react'
import { Cable, Copy, Cpu, Lightbulb, Radio, Server, Terminal, Thermometer, Volume2, Waves } from 'lucide-react'
import { gooeyToast } from 'goey-toast'
import { PageHeader, ConnectionPill } from '@/components/app/Shell'
import { DemoRibbon, OfflineNotice } from '@/components/app/widgets'
import { Badge, Card, CardHeader, Eyebrow, AccordionItem } from '@/components/ui/primitives'
import { ledMode, useTelemetry } from '@/lib/telemetry'
import { cn, relTime, uptime } from '@/lib/utils'

const WIRING = [
  { part: 'DHT11', pin: 'DATA → D2', power: '5 V / GND', icon: Thermometer, note: 'Some bare sensors need a 4.7–10 kΩ pull-up on DATA' },
  { part: 'GY-61 (ADXL335)', pin: 'ZOUT → A1', power: '3.3 V / GND', icon: Waves, note: 'Use 3.3 V, not 5 V' },
  { part: 'Buzzer', pin: '+ → D8', power: '− → GND', icon: Volume2, note: 'Driven at 1 kHz with tone()' },
  { part: 'LED', pin: 'Anode → D9', power: 'Cathode → GND', icon: Lightbulb, note: 'Through a 220–330 Ω resistor' },
]

export default function Device() {
  const { link, source, port, error, lastSeen, latest, settings } = useTelemetry()
  const [raw, setRaw] = useState(true)
  const led = ledMode(latest)
  const json = latest ? JSON.stringify(latest, null, 2) : '// waiting for telemetry…'
  const rows = [
    { k: 'Data source', v: source === 'demo' ? 'Simulated in browser' : 'Arduino over USB serial' },
    { k: 'Serial port', v: port ?? '—', mono: true },
    { k: 'Baud rate', v: '9600', mono: true },
    { k: 'Last reading', v: lastSeen ? relTime(lastSeen * 1000) : '—' },
    { k: 'Arduino uptime', v: uptime(latest?.ms), mono: true },
    { k: 'Dashboard server', v: link === 'server-offline' ? 'Unreachable' : '127.0.0.1:8765', mono: true },
  ]
  return (
    <>
      <PageHeader title="Device" description="Connection, outputs, wiring and raw telemetry from the Arduino Uno." actions={<ConnectionPill />} />
      <OfflineNotice />
      <DemoRibbon />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader icon={<span className="grid size-9 place-items-center rounded-xl bg-honey-soft text-honey-ink"><Cpu className="size-[18px]" /></span>} title="Arduino Uno" description="Bee Guardian firmware · USB serial JSON" action={<Badge tone={link === 'online' ? 'ok' : link === 'connecting' ? 'neutral' : 'warn'}>{link === 'online' ? 'Online' : link === 'connecting' ? 'Connecting' : 'Offline'}</Badge>} />
          <dl className="mt-4 divide-y divide-line border-t border-line">
            {rows.map((r) => (
              <div key={r.k} className="flex items-center justify-between gap-4 px-5 py-3 text-[13.5px]">
                <dt className="text-fg-2">{r.k}</dt>
                <dd className={cn('truncate text-right', r.mono && 'font-mono text-[12.5px]')}>{r.v}</dd>
              </div>
            ))}
          </dl>
          {error && link !== 'online' && <div className="mx-5 mb-5 mt-1 rounded-xl bg-warn-soft px-4 py-3 text-[12.5px] text-warn">{error}</div>}
        </Card>
        <Card>
          <CardHeader title="Outputs" description="Mirrors what the hardware is doing right now" />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface-2 p-4">
              <div className="flex items-center justify-between"><Eyebrow>LED · D9</Eyebrow><Lightbulb className="size-4 text-fg-3" /></div>
              <div className="mt-4 flex items-center gap-3">
                <span className={cn('size-6 rounded-full', led === 'off' ? 'bg-line-strong' : 'bg-danger shadow-[0_0_20px_var(--danger)]', led === 'slow' && 'lamp-slow', led === 'fast' && 'lamp-fast')} />
                <div>
                  <div className="text-[15px] font-semibold">{{ off: 'Off', slow: 'Slow blink', fast: 'Fast blink', solid: 'Solid' }[led]}</div>
                  <div className="text-[12px] text-fg-3">{{ off: 'No alerts', slow: 'Temperature alert · 1 s', fast: 'Vibration alert · 150 ms', solid: 'Both alerts' }[led]}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2 p-4">
              <div className="flex items-center justify-between"><Eyebrow>Buzzer · D8</Eyebrow><Volume2 className="size-4 text-fg-3" /></div>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-6 items-end gap-[3px]">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={cn('w-[3px] rounded-sm', latest && (latest.tempAlert || latest.vibAlert) ? 'bg-danger' : 'h-1.5 bg-line-strong')} style={latest && (latest.tempAlert || latest.vibAlert) ? { animation: `eq .45s ${-i * 0.1}s ease-in-out infinite alternate` } : undefined} />)}</span>
                <div>
                  <div className="text-[15px] font-semibold">{latest && (latest.tempAlert || latest.vibAlert) ? 'Sounding' : 'Silent'}</div>
                  <div className="text-[12px] text-fg-3">1 kHz tone during any alert</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2 p-4 sm:col-span-2">
              <Eyebrow>Active limits (confirmed by device)</Eyebrow>
              <div className="mt-2 flex flex-wrap gap-6 font-mono text-[14px] tnum">
                <span>{settings ? `${settings.temperature.toFixed(1)} °C` : '—'}</span>
                <span>{settings ? `${settings.vibration} counts` : '—'}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader icon={<span className="grid size-9 place-items-center rounded-xl bg-sunken text-fg-2"><Cable className="size-[18px]" /></span>} title="Wiring" description="Reference for the Uno pin-out" />
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {WIRING.map((w) => (
              <li key={w.part} className="group flex items-center gap-4 px-5 py-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sunken text-fg-2"><w.icon className="ico ico-pop size-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium">{w.part}</div>
                  <div className="truncate text-[12px] text-fg-3">{w.note}</div>
                </div>
                <div className="text-right font-mono text-[12px]">
                  <div className="text-honey-ink">{w.pin}</div>
                  <div className="text-fg-3">{w.power}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            icon={<span className="grid size-9 place-items-center rounded-xl bg-sunken text-fg-2"><Terminal className="size-[18px]" /></span>}
            title="Raw telemetry"
            description="Latest JSON line from the firmware"
            action={
              <div className="flex gap-1">
                <button onClick={() => setRaw(!raw)} className="rounded-lg px-2 py-1 text-[12px] text-fg-2 hover:bg-sunken">{raw ? 'Pause' : 'Resume'}</button>
                <button aria-label="Copy JSON" onClick={() => navigator.clipboard?.writeText(json).then(() => gooeyToast.success('Telemetry copied'))} className="group grid size-7 place-items-center rounded-lg text-fg-3 hover:bg-sunken hover:text-fg"><Copy className="ico ico-pop size-3.5" /></button>
              </div>
            }
          />
          <Frozen live={raw} value={json} />
        </Card>
      </div>

      <Card className="mt-4 px-5">
        <div className="flex items-center gap-3 pt-5"><Server className="size-4 text-fg-3" /><h3 className="text-[14px] font-semibold">Troubleshooting</h3></div>
        <AccordionItem q="The dashboard says “Device offline”">Check the USB cable and port, and close Arduino IDE’s Serial Monitor and Serial Plotter — only one program can use the port. Run <code className="font-mono">ls /dev/cu.usb*</code> and pass the port explicitly: <code className="font-mono">python3 server.py --port /dev/cu.usbserial-1410</code>.</AccordionItem>
        <AccordionItem q="Values aren’t updating">Make sure the dashboard firmware (not an older text-only sketch) is uploaded. The server warns if no telemetry has arrived for 4 seconds.</AccordionItem>
        <AccordionItem q="Threshold changes aren’t confirmed">The Uno echoes accepted values in its next telemetry line. If nothing comes back within ~5 seconds, the serial link dropped — reconnect and try again.</AccordionItem>
        <AccordionItem q="Vibration readings look wrong">Verify the GY-61 is on 3.3 V with a common ground and ZOUT wired to A1. Tap the hive body and watch the swing rise.</AccordionItem>
      </Card>
      <p className="mt-4 flex items-center gap-1.5 text-[12px] text-fg-3"><Radio className="size-3.5" /> The server only listens on 127.0.0.1 and is never exposed to your network.</p>
    </>
  )
}

function Frozen({ live, value }: { live: boolean; value: string }) {
  const [frozen, setFrozen] = useState(value)
  if (live && frozen !== value) setFrozen(value)
  return <pre className="scroll-thin m-5 mt-4 max-h-[300px] overflow-auto rounded-xl bg-[#16130c] p-4 font-mono text-[12px] leading-relaxed text-[#f1eee8] dark:bg-black/40">{live ? value : frozen}</pre>
}
