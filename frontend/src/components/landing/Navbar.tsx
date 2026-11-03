import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react'
import { Logo } from '@/components/ui/brand'
import { ButtonLink } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#hardware', label: 'Hardware' },
  { href: '#faq', label: 'FAQ' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { resolved, toggle } = useTheme()
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  // Hero is dark; nav text stays light until it gets a background.
  const onDark = !scrolled && !open
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className={cn(
          'mx-auto flex h-14 max-w-6xl items-center gap-6 rounded-2xl border px-3 pl-4 transition-all duration-300',
          scrolled || open ? 'border-line bg-surface/80 shadow-card backdrop-blur-xl backdrop-saturate-150' : 'border-transparent',
        )}
      >
        <Logo inverse={onDark} />
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={cn('rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors', onDark ? 'text-bone/70 hover:bg-white/10 hover:text-bone' : 'text-fg-2 hover:bg-sunken hover:text-fg')}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <button onClick={toggle} aria-label="Toggle theme" className={cn('group grid size-9 place-items-center rounded-lg transition-colors', onDark ? 'text-bone/70 hover:bg-white/10 hover:text-bone' : 'text-fg-2 hover:bg-sunken hover:text-fg')}>
            {resolved === 'dark' ? <Sun className="ico ico-spin size-[17px]" /> : <Moon className="ico ico-tilt size-[17px]" />}
          </button>
          {!user && (
            <ButtonLink to="/login" variant="ghost" size="sm" className={cn('hidden sm:inline-flex', onDark && 'text-bone/80 hover:bg-white/10 hover:text-bone')}>
              Sign in
            </ButtonLink>
          )}
          <ButtonLink to={user ? '/app' : '/signup'} variant="honey" size="sm" className="hidden sm:inline-flex">
            {user ? 'Open dashboard' : 'Get started'}
            <ArrowRight className="ico ico-nudge size-3.5" />
          </ButtonLink>
          <button onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} className={cn('grid size-9 place-items-center rounded-lg md:hidden', onDark ? 'text-bone' : 'text-fg')}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto mt-2 max-w-6xl rounded-2xl border border-line bg-surface p-2 shadow-pop md:hidden">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-fg-2 hover:bg-sunken hover:text-fg">
                {l.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line p-1 pt-3">
              <ButtonLink to="/login" variant="secondary">Sign in</ButtonLink>
              <ButtonLink to={user ? '/app' : '/signup'} variant="honey">{user ? 'Dashboard' : 'Get started'}</ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
