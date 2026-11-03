import { useEffect } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Compass } from 'lucide-react'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { ButtonLink } from '@/components/ui/button'
import { BeeGlyph } from '@/components/ui/brand'
import { Eyebrow } from '@/components/ui/primitives'

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

export function Legal({ kind }: { kind: keyof typeof LEGAL }) {
  const doc = LEGAL[kind]
  useEffect(() => {
    document.title = `${doc.title} · Bee Guardian`
    window.scrollTo(0, 0)
  }, [doc.title])
  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-[#0d0c0a] pb-16 pt-36 text-bone">
        <Navbar />
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Eyebrow className="text-bone/45">Last updated {doc.updated}</Eyebrow>
          <h1 className="mt-4 text-[44px] font-semibold tracking-[-0.04em]">{doc.title}</h1>
        </div>
      </div>
      <main className="mx-auto max-w-3xl space-y-10 px-5 py-16 sm:px-8">
        {doc.sections.map(([h, b]) => (
          <section key={h}>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{h}</h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-fg-2">{b}</p>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  )
}

export function NotFound() {
  useEffect(() => {
    document.title = 'Page not found · Bee Guardian'
  }, [])
  return (
    <div className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-bg px-5">
      <div className="absolute inset-0 bg-honeycomb opacity-40 [mask-image:radial-gradient(50%_50%_at_50%_50%,black,transparent)]" />
      <div className="relative text-center">
        <motion.div animate={{ x: [0, 30, -20, 0], y: [0, -16, 8, 0], rotate: [0, 12, -8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} className="mx-auto w-24">
          <BeeGlyph className="text-fg" />
        </motion.div>
        <Eyebrow className="mt-8 block">Error 404</Eyebrow>
        <h1 className="mt-3 text-[40px] font-semibold tracking-[-0.04em]">This bee wandered off.</h1>
        <p className="mx-auto mt-3 max-w-[40ch] text-[15px] text-fg-2">The page you’re looking for doesn’t exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink to="/" variant="secondary"><ArrowLeft className="ico ico-nudge size-4" /> Home</ButtonLink>
          <ButtonLink to="/app" variant="primary"><Compass className="ico ico-spin size-4" /> Dashboard</ButtonLink>
        </div>
        <p className="mt-10 text-[12.5px] text-fg-3">Lost? <Link to="/#faq" className="underline underline-offset-2">Read the FAQ</Link></p>
      </div>
    </div>
  )
}
