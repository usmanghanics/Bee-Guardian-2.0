import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  Activity, ArrowRight, ArrowUpRight, BellRing, ChartLine, Check, ChevronRight, Cpu,
  Droplets, Gauge, Menu, Radio, Settings2, ShieldCheck, Thermometer, Usb, Waves, X,
} from 'lucide-react'
import { LogoMark } from '@/components/ui/brand'
import { useAuth } from '@/lib/auth'
import { useDemoFeed } from '@/lib/telemetry'
import '@/apple-experience.css'

const QUESTIONS = [
  { q: 'Do I need an internet connection?', a: 'No. The Arduino communicates with your Mac through USB. The Python server hosts the monitoring application locally, and live telemetry works without a cloud service. The demonstration website photography may need an internet connection.' },
  { q: 'Which sensors are currently supported?', a: 'The DHT11 measures temperature and relative humidity, while the GY-61 measures vibration through its Z-axis output. The Arduino also controls a buzzer and an LED.' },
  { q: 'Can I change alarm thresholds?', a: 'Yes. Temperature and vibration limits can be changed in the dashboard and sent to the Arduino. The interface waits for confirmation. Because the values are stored in Arduino RAM, they reset after power loss.' },
  { q: 'Does it work without my Arduino connected?', a: 'Yes. Select simulated mode after signing into the demo. Simulated readings are clearly identified and never presented as live hardware measurements.' },
  { q: 'Is this a commercial cloud monitoring service?', a: 'Not yet. Bee Guardian 2.0 is currently a locally hosted hardware demonstration with browser-based demo authentication. Multi-hive and remote monitoring are possible future extensions, not existing features.' },
]

function BeeBrand({ invert = false }: { invert?: boolean }) {
  return (
    <Link to="/" className="ag-logo" style={invert ? { color: 'white' } : undefined} aria-label="Bee Guardian home">
      <LogoMark className="size-7" />
      Bee Guardian
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '-.02em', opacity: 0.6 }}>2.0</span>
    </Link>
  )
}

function TopNav() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  return (
    <header className="ag-nav">
      <div className="ag-container ag-nav-inner">
        <BeeBrand />
        <nav className="ag-navlinks" aria-label="Landing navigation">
          <a href="#discover">Discover</a>
          <a href="#hardware">Technology</a>
          <a href="#experience">The experience</a>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="ag-nav-cta">
          {!user && <Link to="/login" className="ag-signin" style={{ fontSize: 12, color: '#45454b', fontWeight: 550 }}>Sign in</Link>}
          <Link to={user ? '/app' : '/signup'} className="ag-pill ag-pill-dark">
            {user ? 'Dashboard' : 'Get started'} <ArrowUpRight size={13} />
          </Link>
          <button type="button" className="ag-menu-btn" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && <nav className="ag-mobilemenu" aria-label="Mobile navigation">
        {[['Discover', '#discover'], ['Technology', '#hardware'], ['The experience', '#experience'], ['How it works', '#how-it-works'], ['FAQ', '#faq']] .map(([name, url]) => <a key={url} href={url} onClick={() => setOpen(false)}>{name}</a>)}
        {!user && <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>}
      </nav>}
    </header>
  )
}

function LiveProductCard() {
  const { latest } = useDemoFeed(40)
  const t = latest?.tempValid && latest.temperature !== null ? Number(latest.temperature).toFixed(1) : '—'
  const h = latest?.tempValid && latest.humidity !== null ? Math.round(Number(latest.humidity)) : '—'
  const vibration = latest?.swing ?? '—'
  return (
    <div className="ag-device-preview" aria-label="Illustrative simulation of Bee Guardian telemetry">
      <div className="ag-preview-top">
        <div><strong>Hive 01</strong><div className="ag-preview-label" style={{ marginTop: 2 }}>Temperature</div></div>
        <div className="ag-preview-live"><span className="ag-preview-dot" /> SIMULATED</div>
      </div>
      <div className="ag-big-reading">{t}<small> °C</small></div>
      <div className="ag-preview-label" style={{ marginTop: 7 }}>Sensor readings · Example session</div>
      <svg className="ag-preview-chart" viewBox="0 0 310 95" role="img" aria-label="Illustrative temperature trend">
        <defs><linearGradient id="ag-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e2ba55" stopOpacity=".27"/><stop offset="1" stopColor="#e2ba55" stopOpacity="0"/></linearGradient></defs>
        <path d="M0 22H310 M0 49H310 M0 76H310" stroke="#d5d5d8" strokeWidth="1"/>
        <path d="M0 72C24 70 25 58 45 60S73 33 96 40 137 54 154 42 179 25 200 32 234 42 252 23 281 34 310 19V95H0Z" fill="url(#ag-grad)"/>
        <path d="M0 72C24 70 25 58 45 60S73 33 96 40 137 54 154 42 179 25 200 32 234 42 252 23 281 34 310 19" fill="none" stroke="#b78b2a" strokeWidth="2.8" strokeLinecap="round"/>
      </svg>
      <div className="ag-preview-pair">
        <div><span>Humidity</span><strong>{h}<small style={{ fontSize: 12, marginLeft: 3 }}>% RH</small></strong></div>
        <div><span>Vibration</span><strong>{vibration}<small style={{ fontSize: 12, marginLeft: 3 }}>counts</small></strong></div>
      </div>
    </div>
  )
}

function AppPreview() {
  const { latest } = useDemoFeed(20)
  const temp = latest?.tempValid && latest.temperature != null ? Number(latest.temperature).toFixed(1) : '—'
  const hum = latest?.tempValid && latest.humidity != null ? Number(latest.humidity).toFixed(0) : '—'
  return (
    <div className="ag-product-window" role="img" aria-label="Product interface preview, showing simulated sensor metrics">
      <div className="ag-window-bar">
        <span className="ag-traffic"/><span className="ag-traffic"/><span className="ag-traffic"/>
        <div className="ag-window-address">Bee Guardian · Example dashboard</div>
      </div>
      <div className="ag-window-body">
        <aside className="ag-window-side">
          <strong>⬡ &nbsp;Bee Guardian</strong>
          {[[Gauge,'Overview'],[ChartLine,'Analytics'],[BellRing,'Alerts'],[Cpu,'Devices'],[Settings2,'Settings']].map(([Icon,label],i) => {
            const I = Icon as typeof Gauge
            return <div key={label as string} className={'ag-window-nav'+(i===0?' active':'')}><I size={15}/>{label as string}</div>
          })}
        </aside>
        <div className="ag-window-main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
            <div><div className="ag-window-title">Hive overview</div><div className="ag-window-sub">Hive 01 · Simulated session</div></div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#257752', fontSize: 12, fontWeight: 600 }}><span className="ag-preview-dot"/> Demo active</div>
          </div>
          <div className="ag-window-grid">
            <div className="ag-window-tile"><span>Temperature</span><strong>{temp}°</strong></div>
            <div className="ag-window-tile"><span>Humidity</span><strong>{hum}%</strong></div>
            <div className="ag-window-tile"><span>Vibration</span><strong>{latest?.swing ?? '—'}</strong></div>
          </div>
          <div className="ag-window-graph">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h4>Temperature trend</h4><span style={{ color: '#99999f', fontSize: 11 }}>Example measurements</span></div>
            <svg viewBox="0 0 600 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 19H600 M0 50H600 M0 81H600" stroke="#eeeeef" strokeWidth="1"/>
              <path d="M0 70C35 71 40 55 75 53S115 68 145 59 195 42 220 49 270 65 302 50 350 34 390 44 430 55 462 37 500 29 535 37 579 32 600 23" fill="none" stroke="#be9a39" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <div style={{ borderTop: '1px solid #ededf0', paddingTop: 10, fontSize: 11, color: '#77777e' }}>Live mode connects to your Arduino through the local Python server.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  useEffect(() => { document.title = 'Bee Guardian — Understand your hive, in real time' }, [])
  return (
    <div className="ag-site">
      <TopNav />
      <main>
        <section className="ag-hero" aria-labelledby="ag-headline">
          <div className="ag-container ag-reveal">
            <div className="ag-overline">Bee Guardian 2.0 · Sensor monitoring</div>
            <h1 id="ag-headline">A clearer view<br/>of <span>your hive.</span></h1>
            <p>Understand the conditions inside your colony. Live measurements, meaningful alerts, and the confidence to act—all in one place.</p>
            <div className="ag-hero-actions">
              <Link to={user ? '/app' : '/signup'} className="ag-pill ag-pill-gold">Explore Bee Guardian <ArrowRight size={16}/></Link>
              <a href="#experience" style={{ color: '#776024', fontWeight: 560, fontSize: 14, padding: 10 }}>See the platform <ChevronRight size={14} style={{ display: 'inline' }}/></a>
            </div>
          </div>
          <div className="ag-photo-stage">
            <div className="ag-photo" role="img" aria-label="Beekeeper inspecting a honeycomb frame outdoors"/>
            <div className="ag-stage-caption"><div className="cap">BETTER INSIGHT. HEALTHIER HIVES.</div><h2>Nature never stops.<br/>Neither should your awareness.</h2><p>See what is happening inside your hive, without opening it every time.</p></div>
            <LiveProductCard/>
          </div>
        </section>

        <section id="discover" className="ag-section ag-intro">
          <div className="ag-container">
            <div className="ag-overline">The essentials, beautifully clear</div>
            <h2 className="ag-section-title">Every signal tells<br/>a story.</h2>
            <p className="ag-section-lead">Bee Guardian turns raw readings into a simple, useful picture of your hive's environment.</p>
            <div className="ag-metrics">
              {[
                { Icon: Thermometer, title: 'Know the temperature.', body: 'Follow changes inside the hive and choose when to sound the alarm.' },
                { Icon: Droplets, title: 'Understand humidity.', body: 'See relative humidity from your DHT11 sensor as it changes.' },
                { Icon: Activity, title: 'Notice disturbances.', body: 'Detect vibration and knocks through the GY-61 accelerometer.' }
              ].map(({Icon,title,body})=><div className="ag-metric" key={title}><div className="ag-icon"><Icon size={21}/></div><h3>{title}</h3><p>{body}</p></div>)}
            </div>
          </div>
        </section>

        <section id="hardware" className="ag-dark-section">
          <div className="ag-container ag-hardware-layout">
            <div className="ag-hardware-visual" aria-label="Abstract illustration of the Bee Guardian monitoring node">
              <div className="ag-hardware-ring"><div className="ag-hardware-core"><LogoMark className="size-24"/></div></div>
              <div className="ag-hardware-chip ag-chip-a">DHT11<span>Temperature &amp; humidity</span></div>
              <div className="ag-hardware-chip ag-chip-b">GY-61<span>Movement &amp; vibration</span></div>
              <div className="ag-hardware-chip ag-chip-c">Arduino Uno<span>Local processing</span></div>
            </div>
            <div>
              <div className="ag-overline" style={{ color: '#e6bd59' }}>Thoughtfully engineered</div>
              <h2 className="ag-section-title">Real hardware.<br/>Useful intelligence.</h2>
              <p className="ag-section-lead">A practical embedded system built around accessible components. Sensor readings travel over USB to a private local dashboard.</p>
              <div className="ag-hardware-list">
                <div className="ag-hardware-row"><span className="num">01</span><div><h3>Measure what matters</h3><p>DHT11 climate readings and GY-61 vibration samples, captured by Arduino Uno.</p></div></div>
                <div className="ag-hardware-row"><span className="num">02</span><div><h3>Understand it instantly</h3><p>Python receives serial telemetry and serves it to your browser locally.</p></div></div>
                <div className="ag-hardware-row"><span className="num">03</span><div><h3>Respond without delay</h3><p>Set thresholds for local LED and buzzer alarms, independent of the dashboard.</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="ag-product">
          <div className="ag-container">
            <div className="ag-product-head">
              <div className="ag-overline">The experience</div>
              <h2 className="ag-section-title">Complex data.<br/>Remarkably simple.</h2>
              <p className="ag-section-lead">Explore environmental readings, monitor your device, review alerts, and adjust thresholds—all from one purpose-built workspace.</p>
            </div>
            <AppPreview/>
            <div style={{ textAlign:'center',marginTop:35 }}><Link className="ag-pill ag-pill-dark" to={user ? '/app' : '/login'}>{user ? 'Open your dashboard' : 'Try the dashboard'} <ArrowUpRight size={15}/></Link></div>
          </div>
        </section>

        <section id="how-it-works" className="ag-process">
          <div className="ag-container">
            <div className="ag-process-head"><div className="ag-overline">Simple from the start</div><h2 className="ag-section-title">From sensor to insight.</h2></div>
            <div className="ag-process-grid">
              <div className="ag-step"><div className="stepnum">01 / CONNECT</div><h3>Wire the sensors.</h3><p>Connect DHT11 to D2, GY-61 ZOUT to A1, and your LED and buzzer to the Uno.</p></div>
              <div className="ag-step"><div className="stepnum">02 / LAUNCH</div><h3>Start monitoring.</h3><p>Upload the firmware, connect the USB cable, and launch the local Python server.</p></div>
              <div className="ag-step"><div className="stepnum">03 / LEARN</div><h3>See the bigger picture.</h3><p>Review trends, adjust limits, and respond to alerts with confidence.</p></div>
            </div>
          </div>
        </section>

        <section className="ag-photo-story">
          <div className="ag-container">
            <div className="ag-overline" style={{ color:'#f5cb63' }}>Built for the people behind the hives</div>
            <h2>Your colony is extraordinary.<br/>Your tools should be too.</h2>
            <p>Make better-informed decisions with an interface that makes the technical feel effortless.</p>
            <Link to={user ? '/app' : '/signup'} className="ag-pill ag-pill-gold">{user ? 'Go to dashboard' : 'Get started'} <ArrowRight size={16}/></Link>
          </div>
        </section>

        <section id="faq" className="ag-faq">
          <div className="ag-container ag-faq-grid">
            <div><div className="ag-overline">Good to know</div><h2 className="ag-section-title" style={{ fontSize:'clamp(37px,4vw,57px)' }}>Questions,<br/>answered.</h2><p className="ag-section-lead" style={{ fontSize:15 }}>Clear answers about the hardware and the current local version.</p></div>
            <div>{QUESTIONS.map(({q,a})=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
          </div>
        </section>
      </main>
      <footer className="ag-footer">
        <div className="ag-container ag-footer-row">
          <BeeBrand/>
          <span>© {new Date().getFullYear()} Bee Guardian. Independently designed and developed.</span>
          <div className="ag-footer-links"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href="#hardware">Hardware</a><Link to="/login">Dashboard</Link></div>
        </div>
        <div className="ag-container" style={{ marginTop:18,fontSize:11,color:'#94949b' }}>Photography: Dmytro Glazunov and Jade / Pexels. Example telemetry is simulated; hardware metrics require a connected Arduino.</div>
      </footer>
    </div>
  )
}
