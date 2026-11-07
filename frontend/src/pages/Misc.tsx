import { useEffect } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, Compass } from 'lucide-react'
import { Logo, LogoMark } from '@/components/ui/brand'
import '@/apple-experience.css'

const LEGAL = {
  privacy: {
    title: 'Privacy notice',
    updated: 'November 2026',
    sections: [
      ['What we collect', 'Bee Guardian runs entirely on your own computer. Sensor readings travel from the Arduino to the local server over USB and are shown in your browser. Nothing is sent to us or to any third party.'],
      ['Accounts in this build', 'Sign-in is a front-end demo. Your name, email and password are saved in this browser’s local storage only, so they are not protected the way a real account would be. Don’t reuse a real password.'],
      ['Readings and history', 'The dashboard keeps up to 30 minutes of readings in memory for charts and analytics. The alert log is saved in local storage so it survives a reload. Clearing site data removes both.'],
      ['Exports', 'CSV exports are generated in your browser and saved straight to your device.'],
    ],
  },
  terms: {
    title: 'Terms of use',
    updated: 'November 2026',
    sections: [
      ['The software', 'Bee Guardian is provided as-is, without warranty of any kind. It’s a monitoring aid, not a substitute for regular hive inspections.'],
      ['Sensor accuracy', 'DHT11 and GY-61 modules are low-cost sensors with limited accuracy. Check that readings are accurate before relying on alarms, especially after changing the wiring.'],
      ['Electrical safety', 'Power the GY-61 from 3.3 V and use a current-limiting resistor on the LED. Keep electronics dry and away from the colony’s comb.'],
      ['Changes', 'These terms may change as the project develops. Continued use means you accept the current version.'],
    ],
  },
}

function MinimalNav() {
  return <header className="ag-simple-nav"><div className="ag-container ag-simple-nav-inner"><Logo /><Link to="/" className="ag-back-link"><ArrowLeft size={15}/> Back to Bee Guardian</Link></div></header>
}

export function Legal({ kind }: { kind: keyof typeof LEGAL }) {
  const doc = LEGAL[kind]
  useEffect(() => {
    document.title = doc.title + ' · Bee Guardian'
    window.scrollTo(0,0)
  },[doc.title])
  return (
    <div className="ag-site ag-legal">
      <MinimalNav />
      <main className="ag-legal-main ag-container">
        <div className="ag-overline">Bee Guardian · Policies</div>
        <h1>{doc.title}</h1>
        <p className="ag-legal-date">Last updated {doc.updated}</p>
        <div className="ag-legal-sections">{doc.sections.map(([heading,body])=><section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</div>
        <Link to="/" className="ag-legal-return">Return to home <ArrowRight size={16}/></Link>
      </main>
      <footer className="ag-footer"><div className="ag-container">© {new Date().getFullYear()} Bee Guardian. Local prototype.</div></footer>
    </div>
  )
}

export function NotFound() {
  useEffect(()=>{document.title='Page not found · Bee Guardian'},[])
  return (
    <div className="ag-site ag-notfound">
      <MinimalNav />
      <main className="ag-notfound-main">
        <div className="ag-notfound-graphic" aria-hidden><div className="ag-notfound-ring"><LogoMark className="size-20"/></div></div>
        <div className="ag-overline">404 · Page not found</div>
        <h1>Looks like this path<br/>isn't in the hive.</h1>
        <p>The page may have moved or the address may be incorrect. Here's a simple way back.</p>
        <div className="ag-notfound-actions"><Link to="/" className="ag-pill ag-pill-gold"><ArrowLeft size={16}/> Back to homepage</Link><Link to="/app" className="ag-pill ag-pill-dark"><Compass size={16}/> Dashboard</Link></div>
      </main>
    </div>
  )
}
