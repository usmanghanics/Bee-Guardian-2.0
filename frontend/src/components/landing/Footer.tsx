import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, Mail } from 'lucide-react'
import { gooeyToast } from 'goey-toast'
import { Logo } from '@/components/ui/brand'
import { GithubIcon } from '@/components/ui/icons'
import { sleep } from '@/lib/utils'

const REPO = 'https://github.com/usmanghanics/Bee-Guardian-2.0'
const COLS: { title: string; links: { label: string; to: string; ext?: boolean }[] }[] = [
  { title: 'Product', links: [{ label: 'Features', to: '/#features' }, { label: 'Live dashboard', to: '/app' }, { label: 'Hardware', to: '/#hardware' }, { label: 'Try the demo', to: '/login' }] },
  { title: 'Resources', links: [{ label: 'Setup guide', to: '/#how' }, { label: 'FAQ', to: '/#faq' }, { label: 'Firmware source', to: `${REPO}/tree/main/arduino`, ext: true }, { label: 'GitHub', to: REPO, ext: true }] },
  { title: 'Legal', links: [{ label: 'Privacy', to: '/privacy' }, { label: 'Terms', to: '/terms' }] },
]

export function Footer() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  async function subscribe(e: FormEvent) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      gooeyToast.error('Enter a valid email', { description: 'We need an address like you@example.com.' })
      return
    }
    setBusy(true)
    await sleep(700)
    setBusy(false)
    setEmail('')
    gooeyToast.success('You’re on the list', { description: 'We’ll send build notes and firmware updates — nothing else.' })
  }
  return (
    <footer className="relative overflow-hidden bg-[#0d0c0a] text-bone">
      <div className="absolute inset-0 bg-honeycomb opacity-[.12]" />
      <div className="relative mx-auto max-w-6xl px-5 pt-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo inverse />
            <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-bone/60">Open hardware hive monitoring. Temperature, humidity and disturbance — measured at the hive, alarmed locally, shown live.</p>
            <form onSubmit={subscribe} className="mt-7 flex max-w-sm items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] p-1.5 focus-within:border-honey/60">
              <Mail className="ml-2 size-4 shrink-0 text-bone/40" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@apiary.com" aria-label="Email for updates" className="h-9 min-w-0 flex-1 bg-transparent text-[14px] text-bone outline-none placeholder:text-bone/35 focus-visible:outline-none" />
              <button disabled={busy} className="group inline-flex h-9 items-center gap-1.5 rounded-lg bg-honey px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-honey-strong disabled:opacity-60">
                Subscribe <ArrowRight className="ico ico-nudge size-3.5" />
              </button>
            </form>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map((c) => (
              <div key={c.title}>
                <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/40">{c.title}</h4>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      {l.ext ? (
                        <a href={l.to} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1 text-[14px] text-bone/70 transition-colors hover:text-bone">
                          {l.label} <ArrowUpRight className="ico ico-nudge-up size-3.5 opacity-50" />
                        </a>
                      ) : l.to.startsWith('/#') ? (
                        <a href={l.to} className="text-[14px] text-bone/70 transition-colors hover:text-bone">{l.label}</a>
                      ) : (
                        <Link to={l.to} className="text-[14px] text-bone/70 transition-colors hover:text-bone">{l.label}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 py-6 text-[12.5px] text-bone/45 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Bee Guardian. Built for beekeepers.</span>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#4ade80]" /> Runs 100% on your network</span>
            <a href={REPO} target="_blank" rel="noreferrer" aria-label="GitHub" className="group text-bone/60 hover:text-bone"><GithubIcon className="ico ico-pop size-[18px]" /></a>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none -mb-[3vw] select-none text-center font-serif text-[21vw] leading-[0.8] tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_rgb(247_245_240/.14)] lg:text-[15.5rem]">
          Bee Guardian
        </div>
      </div>
    </footer>
  )
}
