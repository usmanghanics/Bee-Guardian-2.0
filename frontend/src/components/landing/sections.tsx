import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Activity, ArrowRight, BellRing, Cable, Check, ChartLine, Copy, Cpu, Download, Droplets, Gauge, Lightbulb, Lock,
  Play, ShieldCheck, SlidersHorizontal, Terminal, Thermometer, Usb, Volume2, Waves, Zap,
} from 'lucide-react'
import { gooeyToast } from 'goey-toast'
import { ButtonLink } from '@/components/ui/button'
import { AccordionItem, Badge, Eyebrow } from '@/components/ui/primitives'
import { BeeGlyph, Photo } from '@/components/ui/brand'
import { CountUp, Reveal, Tilt } from '@/components/ui/motion'
import { AreaChart, Sparkline } from '@/components/charts/charts'
import { useDemoFeed, type Sample } from '@/lib/telemetry'
import { useAuth } from '@/lib/auth'
import { cn, fmt } from '@/lib/utils'

const HiveScene = lazy(() => import('./HiveScene'))

const pts = (h: Sample[], k: 'temperature' | 'humidity' | 'swing') => h.map((p) => ({ t: p.t, v: k === 'swing' ? p.swing : p.tempValid ? (p[k] as number) : null }))

export function SectionHead({ eyebrow, title, body, center, dark }: { eyebrow: string; title: ReactNode; body?: ReactNode; center?: boolean; dark?: boolean }) {
  return (
    <Reveal className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <Eyebrow className={cn(dark && 'text-bone/45')}>{eyebrow}</Eyebrow>
      <h2 className={cn('mt-4 text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[44px]', dark ? 'text-bone' : 'text-fg')}>{title}</h2>
      {body && <p className={cn('mt-5 text-pretty text-[16.5px] leading-relaxed', dark ? 'text-bone/60' : 'text-fg-2')}>{body}</p>}
    </Reveal>
  )
}
const Serif = ({ children }: { children: ReactNode }) => <span className="font-serif font-normal italic tracking-[-0.01em]">{children}</span>

/* ─────────────────────────── HERO ─────────────────────────── */
function FloatCard({ className, delay, children }: { className?: string; delay: number; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn('absolute', className)}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6 + delay * 2, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl border border-white/12 bg-[#16130c]/55 p-3.5 text-bone shadow-[0_20px_50px_-20px_rgb(0_0_0/.7)] backdrop-blur-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export function Hero() {
  const { user } = useAuth()
  const { latest, history } = useDemoFeed(40)
  const { scrollY } = useScroll()
  const sceneY = useTransform(scrollY, [0, 700], [0, 120])
  const fade = useTransform(scrollY, [0, 500], [1, 0.2])
  const alert = latest.vibAlert || latest.tempAlert
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#0d0c0a] text-bone">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_72%_45%,rgb(232_163_23/.28),transparent_70%),radial-gradient(40%_40%_at_10%_0%,rgb(232_163_23/.10),transparent)]" />
      <div className="absolute inset-0 -z-10 bg-honeycomb opacity-[.07] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />

      <motion.div style={{ y: sceneY, opacity: fade }} className="absolute bottom-[-20%] right-[-30%] h-[60%] w-[130%] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_70%)] sm:right-[-14%] sm:w-[90%] lg:inset-y-0 lg:right-[-8%] lg:h-auto lg:w-[60%] lg:opacity-100 lg:[mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_72%)]">
        <Suspense fallback={<div className="absolute inset-0 grid place-items-center"><BeeGlyph className="w-24 animate-pulse text-bone" /></div>}>
          <HiveScene />
        </Suspense>
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <FloatCard className="left-[20%] top-[60%]" delay={0.9}>
            <div className="flex items-center gap-2 text-[11.5px] text-bone/55"><Thermometer className="size-3.5 text-[#f0a43a]" /> Brood temperature</div>
            <div className="mt-1 font-mono text-[26px] font-medium tracking-[-0.04em] tnum">{fmt(latest.temperature)}<span className="ml-1 text-[13px] text-bone/45">°C</span></div>
            <Sparkline data={pts(history, 'temperature')} color="#f0a43a" className="mt-1 w-36" height={26} />
          </FloatCard>
          <FloatCard className="right-[24%] top-[16%]" delay={1.1}>
            <div className="flex items-center gap-2 text-[11.5px] text-bone/55"><Droplets className="size-3.5 text-[#6b9bf2]" /> Humidity</div>
            <div className="mt-1 font-mono text-[22px] font-medium tracking-[-0.04em] tnum">{fmt(latest.humidity, 0)}<span className="ml-1 text-[12px] text-bone/45">% RH</span></div>
          </FloatCard>
          <FloatCard className="bottom-[16%] right-[24%]" delay={1.3}>
            <div className="flex items-center gap-3">
              <span className={cn('relative grid size-8 place-items-center rounded-full', alert ? 'bg-[#f87171]/20 text-[#f87171]' : 'bg-[#4ade80]/15 text-[#4ade80]')}>
                {alert ? <BellRing className="ico-ring is-active size-4" /> : <ShieldCheck className="size-4" />}
              </span>
              <div>
                <div className="text-[13px] font-medium">{alert ? (latest.vibAlert ? 'Disturbance detected' : 'Temperature alert') : 'Hive conditions normal'}</div>
                <div className="font-mono text-[11px] text-bone/50 tnum">Vibration {latest.swing} counts</div>
              </div>
            </div>
          </FloatCard>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[52%] bg-gradient-to-r from-[#0d0c0a] via-[#0d0c0a]/85 to-transparent lg:block" />
      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-5 pb-20 pt-32 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
          <a href="#how" className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.04] py-1 pl-1 pr-3 text-[12.5px] text-bone/75 backdrop-blur transition-colors hover:border-white/25 hover:text-bone">
            <span className="rounded-full bg-honey px-2 py-0.5 text-[11px] font-semibold text-ink">v2.0</span>
            DHT11 humidity sensing is here
            <ArrowRight className="ico ico-nudge size-3.5" />
          </a>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative mt-7 max-w-[13ch] text-balance text-[50px] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-[76px] lg:text-[88px]"
        >
          Hear your hive <Serif><span className="text-honey">before</span></Serif> it’s in trouble.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.8 }} className="mt-7 max-w-[46ch] text-pretty text-[17px] leading-relaxed text-bone/65 sm:text-[18.5px]">
          Bee Guardian streams temperature, humidity and disturbance from inside the hive to a live dashboard — and sounds an alarm at the hive the moment a reading crosses your limit. No cloud. No subscription.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }} className="mt-10 flex flex-wrap items-center gap-3">
          <ButtonLink to={user ? '/app' : '/login'} variant="honey" size="lg">
            Open live dashboard <ArrowRight className="ico ico-nudge size-4" />
          </ButtonLink>
          <a href="#preview" className="group inline-flex h-12 items-center gap-2.5 rounded-xl border border-white/15 px-5 text-[15px] font-medium text-bone transition-colors hover:border-white/30 hover:bg-white/[.05]">
            <span className="grid size-6 place-items-center rounded-full bg-bone text-ink"><Play className="ico ico-grow size-3 fill-current" /></span>
            See it live
          </a>
        </motion.div>
        <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 1 }} className="mt-16 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-6">
          {[
            ['500', 'ms', 'Telemetry interval'],
            ['100', 'Hz', 'Vibration sampling'],
            ['0', '', 'Cloud services needed'],
          ].map(([v, u, l]) => (
            <div key={l}>
              <dt className="sr-only">{l}</dt>
              <dd className="font-mono text-[26px] font-medium tracking-[-0.04em] text-bone tnum sm:text-[30px]">
                <CountUp to={Number(v)} />
                <span className="ml-1 text-[14px] text-bone/45">{u}</span>
              </dd>
              <div className="mt-1 text-[12.5px] text-bone/50">{l}</div>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}

/* ─────────────────────────── MARQUEE ─────────────────────────── */
export function StackMarquee() {
  const items = [
    [Cpu, 'Arduino Uno'], [Thermometer, 'DHT11 climate'], [Waves, 'GY-61 accelerometer'], [Volume2, '1 kHz buzzer'], [Lightbulb, 'Status LED'],
    [Usb, 'USB serial · 9600 baud'], [Terminal, 'Python + pyserial'], [Lock, 'Localhost only'],
  ] as const
  return (
    <section aria-label="Built with" className="relative border-y border-line bg-bg py-7">
      <div className="mx-auto mb-5 max-w-6xl px-5 text-center sm:px-8"><Eyebrow>Built on hardware you can buy anywhere</Eyebrow></div>
      <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
          {[...items, ...items].map(([Icon, label], i) => (
            <span key={i} className="group inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-2 text-[13.5px] font-medium text-fg-2 shadow-xs">
              <Icon className="ico ico-pop size-4 text-honey-ink" /> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── STORY ─────────────────────────── */
export function Story() {
  const risks = [
    { icon: Thermometer, title: 'Heat stress', body: 'Brood is raised in a narrow band around 34–35 °C. Sustained heat above your limit triggers an alarm immediately.' },
    { icon: Waves, title: 'Knocks & raids', body: 'The accelerometer samples 100 times a second, so a tipped lid, an animal or a theft attempt shows up as a spike.' },
    { icon: Droplets, title: 'Damp & condensation', body: 'Relative humidity is tracked continuously so you can spot ventilation problems before they turn into mould.' },
  ]
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-28 sm:px-8 lg:grid-cols-[1fr_1.05fr]">
      <Reveal className="relative">
        <Tilt className="relative">
          <Photo src="/images/hero-bee.jpg" alt="Close-up of a honey bee working on honeycomb" caption="images/hero-bee.jpg" className="aspect-[4/5] rounded-[28px] shadow-pop" />
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.7 }} className="absolute bottom-6 right-3 w-56 rounded-2xl border border-line bg-surface/90 p-4 shadow-pop backdrop-blur-xl sm:-right-8 sm:bottom-8 sm:w-60">
            <div className="flex items-center justify-between"><Eyebrow>Inside the hive</Eyebrow><Badge tone="ok">Live</Badge></div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><div className="text-[11.5px] text-fg-3">Temp</div><div className="font-mono text-[20px] font-medium tnum">28.4°</div></div>
              <div><div className="text-[11.5px] text-fg-3">Humidity</div><div className="font-mono text-[20px] font-medium tnum">58%</div></div>
            </div>
          </motion.div>
        </Tilt>
      </Reveal>
      <div>
        <SectionHead
          eyebrow="Why it matters"
          title={<>A colony can be in trouble <Serif>long before</Serif> you lift the lid.</>}
          body="Hives are checked every week or two, but problems start in hours. Bee Guardian sits inside the hive and keeps watch between inspections."
        />
        <div className="mt-10 space-y-3">
          {risks.map((r, i) => (
            <Reveal key={r.title} delay={0.1 * i}>
              <div className="group flex gap-4 rounded-2xl border border-transparent p-4 transition-colors hover:border-line hover:bg-surface">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-honey-soft text-honey-ink"><r.icon className="ico ico-wiggle size-5" /></span>
                <div>
                  <h3 className="text-[15.5px] font-semibold tracking-[-0.01em]">{r.title}</h3>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-fg-2">{r.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── FEATURES (bento) ─────────────────────────── */
function Bento({ className, children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className={cn('group relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-xs transition-[box-shadow,border-color] duration-300 hover:border-line-strong hover:shadow-card', className)}>
      {children}
    </Reveal>
  )
}
function BentoTitle({ icon: Icon, title, body, anim = 'ico-pop' }: { icon: typeof Activity; title: string; body: string; anim?: string }) {
  return (
    <div className="relative">
      <span className="grid size-10 place-items-center rounded-xl border border-line bg-surface-2 text-fg"><Icon className={cn('ico size-[18px]', anim)} /></span>
      <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-1.5 max-w-[40ch] text-[14px] leading-relaxed text-fg-2">{body}</p>
    </div>
  )
}

function ThresholdToy() {
  const [v, setV] = useState(30)
  const temp = 31.2
  const over = temp >= v
  return (
    <div className="mt-6 rounded-2xl border border-line bg-surface-2 p-4">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-fg-2">Temperature limit</span>
        <span className="font-mono font-medium tnum">{v.toFixed(1)} °C</span>
      </div>
      <input aria-label="Demo temperature limit" type="range" min={25} max={36} step={0.5} value={v} onChange={(e) => setV(Number(e.target.value))} className="range mt-2" style={{ ['--p' as string]: `${((v - 25) / 11) * 100}%` }} />
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[12px] text-fg-3 tnum">Reading {temp} °C</span>
        <Badge tone={over ? 'alert' : 'ok'}>{over ? 'Alarm on' : 'Normal'}</Badge>
      </div>
    </div>
  )
}

function OutputsToy() {
  const [mode, setMode] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setMode((m) => (m + 1) % 4), 2600)
    return () => clearInterval(id)
  }, [])
  const modes = [
    { label: 'Normal', led: '', buzz: false },
    { label: 'Temperature', led: 'lamp-slow', buzz: true },
    { label: 'Vibration', led: 'lamp-fast', buzz: true },
    { label: 'Both', led: 'solid', buzz: true },
  ]
  const m = modes[mode]
  return (
    <div className="mt-6 grid grid-cols-4 gap-1.5">
      {modes.map((x, i) => (
        <div key={x.label} className={cn('rounded-xl border p-2.5 text-center transition-colors', i === mode ? 'border-line-strong bg-surface-2' : 'border-transparent')}>
          <span className={cn('mx-auto block size-3 rounded-full', i === 0 ? 'bg-line-strong' : 'bg-danger shadow-[0_0_12px_var(--danger)]', i === mode && x.led !== 'solid' && x.led)} />
          <div className="mt-2 text-[11px] text-fg-3">{x.label}</div>
        </div>
      ))}
      <div className="col-span-4 mt-2 flex items-center justify-between rounded-xl bg-sunken px-3 py-2 text-[12.5px]">
        <span className="flex items-center gap-2 text-fg-2"><Volume2 className="size-3.5" /> Buzzer</span>
        <span className="flex items-center gap-2 font-medium">
          <span className="flex h-3 items-end gap-[2px]">{[0, 1, 2, 3].map((i) => <i key={i} className={cn('w-[2px] rounded-sm', m.buzz ? 'bg-danger' : 'h-1 bg-line-strong')} style={m.buzz ? { animation: `eq .5s ${-i * 0.12}s ease-in-out infinite alternate` } : undefined} />)}</span>
          {m.buzz ? '1 kHz' : 'Silent'}
        </span>
      </div>
    </div>
  )
}

export function Features() {
  const { history } = useDemoFeed(50)
  return (
    <section id="features" className="scroll-mt-24 bg-bg py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead eyebrow="Features" title={<>Everything the hive is telling you, <Serif>in one place.</Serif></>} body="Three sensors, two alarms, one dashboard. Each part does one job well." />
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Bento className="md:col-span-4">
            <BentoTitle icon={Thermometer} title="Live hive climate" body="Temperature and relative humidity from the DHT11, refreshed every 2.2 s and streamed to the dashboard every 500 ms." anim="ico-pulse" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(['temperature', 'humidity'] as const).map((k) => (
                <div key={k} className="rounded-2xl border border-line bg-surface-2 p-4">
                  <div className="flex items-center justify-between text-[12.5px] text-fg-3">
                    <span className="flex items-center gap-2"><span className="size-2 rounded-[3px]" style={{ background: k === 'temperature' ? 'var(--temp)' : 'var(--hum)' }} />{k === 'temperature' ? 'Temperature' : 'Humidity'}</span>
                    <span className="font-mono tnum">{k === 'temperature' ? `${fmt(history.at(-1)?.temperature)} °C` : `${fmt(history.at(-1)?.humidity, 0)} %`}</span>
                  </div>
                  <Sparkline data={pts(history, k)} color={k === 'temperature' ? 'var(--temp)' : 'var(--hum)'} height={54} className="mt-3" />
                </div>
              ))}
            </div>
          </Bento>
          <Bento className="overflow-hidden p-0 md:col-span-2" delay={0.08}>
            <Photo src="/images/comb.jpg" alt="Capped honeycomb" caption="images/comb.jpg" className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="relative flex h-full min-h-72 flex-col justify-end p-6 text-bone">
              <Lock className="ico ico-shake size-5" />
              <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.02em]">Private by design</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-bone/75">The server listens on 127.0.0.1 only. Your readings never leave your computer.</p>
            </div>
          </Bento>
          <Bento className="md:col-span-2" delay={0.05}>
            <BentoTitle icon={Waves} title="Disturbance detection" body="Z-axis swing from the GY-61 is measured every 10 ms. Knocks show up instantly." anim="ico-shake" />
            <Sparkline data={pts(history, 'swing')} color="var(--vib)" height={64} className="mt-6" />
          </Bento>
          <Bento className="md:col-span-2" delay={0.1}>
            <BentoTitle icon={BellRing} title="Alarms at the hive" body="Buzzer and LED patterns tell you which limit tripped — even with no screen nearby." anim="ico-ring" />
            <OutputsToy />
          </Bento>
          <Bento className="md:col-span-2" delay={0.15}>
            <BentoTitle icon={SlidersHorizontal} title="Your limits, live" body="Set thresholds from the dashboard. The Uno confirms every change over serial." anim="ico-wiggle" />
            <ThresholdToy />
          </Bento>
          <Bento className="md:col-span-3" delay={0.05}>
            <BentoTitle icon={ChartLine} title="Session analytics" body="Min, max and averages for every sensor, an alert history with acknowledgements, and one-click CSV export." anim="ico-pop" />
            <div className="mt-6 flex flex-wrap gap-2">
              {['Min / avg / max', 'Alert timeline', 'CSV export', '30-min buffer'].map((t) => <span key={t} className="rounded-full border border-line px-3 py-1 text-[12.5px] text-fg-2">{t}</span>)}
            </div>
          </Bento>
          <Bento className="md:col-span-3" delay={0.1}>
            <BentoTitle icon={Zap} title="Plug in and go" body="The server finds the Arduino automatically, reconnects if the cable is pulled, and tells you exactly what’s wrong when it can’t." anim="ico-wiggle" />
            <div className="mt-6 flex items-center gap-2 font-mono text-[12.5px] text-fg-2">
              <span className="rounded-lg bg-sunken px-2.5 py-1.5">/dev/cu.usbserial-1410</span>
              <ArrowRight className="size-3.5 text-fg-3" />
              <Badge tone="ok">Connected</Badge>
            </div>
          </Bento>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── PRODUCT PREVIEW ─────────────────────────── */
export function Preview() {
  const { latest, history } = useDemoFeed(80)
  const [tab, setTab] = useState<'temperature' | 'humidity' | 'swing'>('temperature')
  const cfg = { temperature: { c: '#f0a43a', u: '°C', d: 1, thr: latest.tempThreshold }, humidity: { c: '#6b9bf2', u: '% RH', d: 0, thr: undefined }, swing: { c: '#2dc2b0', u: 'counts', d: 0, thr: latest.vibThreshold } }[tab]
  return (
    <section id="preview" className="dark relative scroll-mt-20 overflow-hidden bg-[#0d0c0a] py-28 text-fg">
      <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,rgb(232_163_23/.18),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead dark center eyebrow="The dashboard" title={<>Calm when it’s calm. <Serif>Loud when it isn’t.</Serif></>} body="This is the real dashboard, running on simulated readings. Hover the chart and switch sensors." />
        <Reveal delay={0.1} className="mt-14">
          <div className="rounded-[22px] border border-white/10 bg-white/[.03] p-2 shadow-[0_40px_120px_-40px_rgb(232_163_23/.35)]">
            <div className="overflow-hidden rounded-2xl border border-line bg-bg">
              <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
                <span className="flex gap-1.5">{['#f87171', '#f0b232', '#4ade80'].map((c) => <i key={c} className="size-2.5 rounded-full opacity-80" style={{ background: c }} />)}</span>
                <span className="mx-auto rounded-md bg-sunken px-3 py-1 font-mono text-[11px] text-fg-3">127.0.0.1:8765/app</span>
              </div>
              <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[1fr_280px]">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { k: 'temperature' as const, l: 'Temperature', v: fmt(latest.temperature), u: '°C', c: 'var(--temp)', icon: Thermometer },
                      { k: 'humidity' as const, l: 'Humidity', v: fmt(latest.humidity, 0), u: '%', c: 'var(--hum)', icon: Droplets },
                      { k: 'swing' as const, l: 'Vibration', v: String(latest.swing), u: 'ct', c: 'var(--vib)', icon: Activity },
                    ].map((m) => (
                      <button key={m.k} onClick={() => setTab(m.k)} className={cn('group rounded-xl border bg-surface p-3 text-left transition-colors', tab === m.k ? 'border-line-strong' : 'border-line hover:border-line-strong')}>
                        <div className="flex items-center gap-1.5 text-[11.5px] text-fg-3"><m.icon className="ico ico-pop size-3.5" style={{ color: m.c }} /> {m.l}</div>
                        <div className="mt-1.5 font-mono text-[20px] font-medium tracking-[-0.04em] tnum sm:text-[24px]">{m.v}<span className="ml-1 text-[11px] text-fg-3">{m.u}</span></div>
                        <Sparkline data={pts(history, m.k)} color={m.c} height={24} className="mt-1.5 hidden sm:block" />
                      </button>
                    ))}
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-3">
                    <AreaChart data={pts(history, tab)} color={cfg.c} unit={cfg.u} decimals={cfg.d} threshold={cfg.thr} height={230} band={tab === 'humidity' ? [50, 70] : undefined} />
                  </div>
                </div>
                <div className="hidden space-y-3 lg:block">
                  <div className="rounded-xl border border-line bg-surface p-4">
                    <Eyebrow>Status</Eyebrow>
                    <div className="mt-2 flex items-center gap-2 text-[15px] font-semibold">
                      <span className={cn('size-2 rounded-full', latest.vibAlert || latest.tempAlert ? 'bg-danger' : 'bg-ok')} />
                      {latest.vibAlert ? 'Vibration detected' : latest.tempAlert ? 'Temperature alert' : 'All normal'}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                      <div className="rounded-lg bg-sunken p-2"><div className="text-fg-3">Buzzer</div><div className="font-medium">{latest.vibAlert || latest.tempAlert ? 'Sounding' : 'Silent'}</div></div>
                      <div className="rounded-lg bg-sunken p-2"><div className="text-fg-3">LED</div><div className="font-medium">{latest.vibAlert && latest.tempAlert ? 'Solid' : latest.tempAlert ? 'Slow blink' : latest.vibAlert ? 'Fast blink' : 'Off'}</div></div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-4">
                    <Eyebrow>Limits</Eyebrow>
                    {[['Temperature', `${latest.tempThreshold.toFixed(1)} °C`, 0.24], ['Vibration', `${latest.vibThreshold} counts`, 0.23]].map(([l, v, p]) => (
                      <div key={l as string} className="mt-3">
                        <div className="flex justify-between text-[12.5px]"><span className="text-fg-2">{l}</span><span className="font-mono tnum">{v}</span></div>
                        <div className="mt-2 h-1 rounded-full bg-sunken"><div className="h-full rounded-full bg-fg" style={{ width: `${(p as number) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────── HOW IT WORKS ─────────────────────────── */
function CopyCmd({ cmd }: { cmd: string }) {
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(cmd).then(
          () => gooeyToast.success('Copied to clipboard', { description: cmd }),
          () => gooeyToast.error('Couldn’t copy', { description: 'Your browser blocked clipboard access.' }),
        )
      }}
      className="group flex w-full items-center justify-between gap-3 rounded-xl bg-[#16130c] px-3.5 py-2.5 text-left font-mono text-[12.5px] text-bone/85 dark:bg-black/40"
    >
      <span className="truncate"><span className="text-honey">$</span> {cmd}</span>
      <Copy className="ico ico-pop size-3.5 shrink-0 text-bone/45 group-hover:text-bone" />
    </button>
  )
}

export function HowItWorks() {
  const steps = [
    { n: '01', icon: Cable, title: 'Wire four parts', body: 'DHT11 on D2, GY-61 Z-out on A1 (powered from 3.3 V), buzzer on D8, LED on D9 through a 220 Ω resistor.', extra: <div className="mt-5 grid grid-cols-2 gap-1.5 font-mono text-[11.5px]">{[['DHT11', 'D2'], ['GY-61', 'A1'], ['Buzzer', 'D8'], ['LED', 'D9']].map(([a, b]) => <div key={a} className="flex justify-between rounded-lg bg-sunken px-2.5 py-1.5"><span className="text-fg-2">{a}</span><span className="text-honey-ink">{b}</span></div>)}</div> },
    { n: '02', icon: Cpu, title: 'Flash the firmware', body: 'Open the sketch in Arduino IDE, install the Adafruit DHT library and upload. Close Serial Monitor afterwards.', extra: <div className="mt-5"><CopyCmd cmd="arduino/BeeGuardianDashboard.ino" /></div> },
    { n: '03', icon: Gauge, title: 'Start the dashboard', body: 'Run the local server. It finds the Uno on USB and serves the dashboard at 127.0.0.1:8765.', extra: <div className="mt-5"><CopyCmd cmd="python3 server.py" /></div> },
  ]
  return (
    <section id="how" className="scroll-mt-24 bg-bg py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead eyebrow="How it works" title={<>From parts bin to live dashboard <Serif>in an afternoon.</Serif></>} />
        <div className="relative mt-14 grid gap-4 lg:grid-cols-3">
          <motion.div aria-hidden initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }} className="absolute left-[16%] right-[16%] top-[46px] hidden h-px origin-left bg-[linear-gradient(90deg,var(--honey),var(--border-strong))] lg:block" />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={0.15 * i}>
              <div className="group relative h-full rounded-3xl border border-line bg-surface p-6 shadow-xs transition-shadow hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span className="relative grid size-12 place-items-center rounded-2xl bg-fg text-bg"><s.icon className="ico ico-wiggle size-5" /></span>
                  <span className="font-mono text-[12px] text-fg-3">{s.n}</span>
                </div>
                <h3 className="mt-6 text-[18px] font-semibold tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-fg-2">{s.body}</p>
                {s.extra}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── HARDWARE / SPECS ─────────────────────────── */
export function Hardware() {
  const bom = [
    { part: 'Arduino Uno', role: 'Controller · USB serial', pin: '—' },
    { part: 'DHT11 module', role: 'Temperature + humidity', pin: 'D2' },
    { part: 'GY-61 (ADXL335)', role: 'Vibration, Z-axis', pin: 'A1 · 3.3 V' },
    { part: 'Buzzer', role: 'Audible alarm, 1 kHz', pin: 'D8' },
    { part: 'LED + 220–330 Ω', role: 'Visual alarm', pin: 'D9' },
  ]
  const specs = [
    ['Telemetry', 'JSON over USB every 500 ms'],
    ['Climate sampling', 'DHT11 every 2.2 s · 0–50 °C, 20–90 % RH'],
    ['Vibration sampling', 'Every 10 ms (100 Hz), 10-bit ADC'],
    ['Temperature limit', '15–80 °C, 0.5 °C steps'],
    ['Vibration limit', '1–150 counts in the UI (firmware accepts up to 500)'],
    ['LED patterns', 'Slow blink (temp) · fast blink (vibration) · solid (both)'],
  ]
  return (
    <section id="hardware" className="scroll-mt-24 border-t border-line bg-surface-2 py-28">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <SectionHead eyebrow="Hardware" title={<>Five parts. <Serif>No soldering required.</Serif></>} body="Everything runs on a stock Arduino Uno with breadboard-friendly modules. Thresholds live in the Uno’s RAM and reset to 30 °C / 35 counts after a reboot." />
          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
            <a href="https://github.com/usmanghanics/Bee-Guardian-2.0/blob/main/README.md" target="_blank" rel="noreferrer" className="group inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-sm font-medium shadow-xs hover:border-line-strong">
              <Download className="ico ico-float size-4" /> Wiring guide
            </a>
          </Reveal>
        </div>
        <div className="space-y-4">
          <Reveal className="overflow-hidden rounded-3xl border border-line bg-surface">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-sunken/60 text-[12px] text-fg-3"><tr><th className="px-5 py-3 font-medium">Part</th><th className="hidden px-5 py-3 font-medium sm:table-cell">Role</th><th className="px-5 py-3 text-right font-medium">Pin</th></tr></thead>
              <tbody>
                {bom.map((b) => (
                  <tr key={b.part} className="border-t border-line transition-colors hover:bg-surface-2">
                    <td className="px-5 py-3.5 font-medium">{b.part}<div className="text-[12.5px] font-normal text-fg-3 sm:hidden">{b.role}</div></td>
                    <td className="hidden px-5 py-3.5 text-fg-2 sm:table-cell">{b.role}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-[12.5px] text-honey-ink">{b.pin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <Reveal delay={0.1} className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="bg-surface p-5">
                <Eyebrow>{k}</Eyebrow>
                <div className="mt-2 text-[14px] leading-snug text-fg">{v}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── GALLERY ─────────────────────────── */
export function Gallery() {
  return (
    <section className="bg-bg py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead eyebrow="In the apiary" title={<>Made for the field, <Serif>not the lab.</Serif></>} />
        <div className="mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {[
            { src: '/images/apiary.jpg', alt: 'A row of beehives in a meadow', cls: 'md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto', label: 'One kit per hive' },
            { src: '/images/frame.jpg', alt: 'Beekeeper inspecting a brood frame', cls: 'aspect-[4/3]', label: 'Watch between inspections' },
            { src: '/images/flower.jpg', alt: 'Honey bee foraging on a flower', cls: 'aspect-[4/3]', label: 'Know when to open the hive' },
          ].map((g, i) => (
            <Reveal key={g.src} delay={i * 0.08} className={cn('group relative overflow-hidden rounded-3xl', g.cls)}>
              <Photo src={g.src} alt={g.alt} caption={g.src.slice(1)} className="absolute inset-0" imgClassName="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
              <span className="absolute bottom-4 left-4 rounded-full bg-black/35 px-3 py-1.5 text-[13px] font-medium text-bone backdrop-blur-md">{g.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── FAQ ─────────────────────────── */
export function Faq() {
  const items = [
    ['Does Bee Guardian need the internet or a cloud account?', 'No. The Arduino talks to your computer over USB, and the dashboard server only listens on 127.0.0.1. Nothing is uploaded anywhere.'],
    ['What happens if my computer is off?', 'The alarms still work. Thresholds are checked on the Arduino itself, so the buzzer and LED respond even without the dashboard. You’ll just miss the history while the computer is off.'],
    ['Why does the temperature say “sensor invalid”?', 'The DHT11 sometimes fails a reading, or reports values outside its rated 0–50 °C / 20–90 % range. The firmware discards those instead of inventing a number. If it persists, check the D2 wire, power and ground, and add a 4.7–10 kΩ pull-up if your module needs one.'],
    ['Will my thresholds survive a reboot?', 'Not yet. They’re stored in the Uno’s RAM and reset to 30 °C and 35 counts after power loss. The dashboard always shows the values the device has confirmed.'],
    ['Can I try it without the hardware?', 'Yes. Sign in with the demo account and choose “Simulated data” — the full dashboard runs on realistic readings that follow the same alarm rules as the firmware.'],
  ]
  return (
    <section id="faq" className="scroll-mt-24 border-t border-line bg-bg py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
        <SectionHead eyebrow="FAQ" title={<>Questions, <Serif>answered.</Serif></>} body={<>Something else? <a className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-honey" href="https://github.com/usmanghanics/Bee-Guardian-2.0/issues" target="_blank" rel="noreferrer">Open an issue on GitHub</a>.</>} />
        <Reveal delay={0.1} className="border-t border-line">
          {items.map(([q, a], i) => <AccordionItem key={q} q={q} defaultOpen={i === 0}>{a}</AccordionItem>)}
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────── CTA ─────────────────────────── */
export function Cta() {
  const { user } = useAuth()
  return (
    <section className="bg-bg px-3 pb-3 sm:px-5 sm:pb-5">
      <Reveal className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[32px] bg-honey px-6 py-20 text-center text-ink sm:py-28">
        <div className="absolute inset-0 bg-honeycomb opacity-60 mix-blend-multiply [mask-image:radial-gradient(60%_80%_at_50%_50%,transparent,black)]" />
        <motion.div aria-hidden animate={{ rotate: [0, 8, -6, 0], y: [0, -10, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} className="absolute -left-6 top-10 hidden w-28 sm:block"><BeeGlyph className="text-ink" /></motion.div>
        <motion.div aria-hidden animate={{ rotate: [0, -10, 6, 0], y: [0, 12, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-4 bottom-8 hidden w-20 sm:block"><BeeGlyph className="text-ink" /></motion.div>
        <div className="relative">
          <h2 className="mx-auto max-w-[16ch] text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[64px]">Give your hive <Serif>a voice.</Serif></h2>
          <p className="mx-auto mt-5 max-w-[44ch] text-[17px] leading-relaxed text-ink/70">Try the full dashboard on simulated data in under a minute — or plug in your Uno and watch your own hive.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink to={user ? '/app' : '/signup'} variant="primary" size="lg" className="bg-ink text-bone hover:bg-ink/90">{user ? 'Open dashboard' : 'Create free account'} <ArrowRight className="ico ico-nudge size-4" /></ButtonLink>
            <ButtonLink to="/login" variant="secondary" size="lg" className="border-ink/15 bg-white/40 text-ink hover:bg-white/60">Use demo account</ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px] text-ink/70">
            {['Free and open source', 'No cloud account', 'Works offline'].map((t) => <li key={t} className="flex items-center gap-1.5"><Check className="size-4" /> {t}</li>)}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}
