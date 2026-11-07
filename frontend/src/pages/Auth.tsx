import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Home, KeyRound, Lock, Mail, MailCheck, Sparkles, Thermometer, User } from 'lucide-react'
import { gooeyToast } from 'goey-toast'
import { Logo } from '@/components/ui/brand'
import '@/apple-experience.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/primitives'
import { GithubIcon, GoogleIcon } from '@/components/ui/icons'
import { DEMO_ACCOUNT, useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const EMAIL_RE = /^\S+@\S+\.\S+$/

function Shell({ children, title }: { children: ReactNode; title: string }) {
  useEffect(() => { document.title = title + ' · Bee Guardian' }, [title])
  return (
    <div className="ag-auth-root">
      <div className="ag-auth-navigation">
        <Logo />
        <Link to="/" className="ag-auth-back"><ArrowLeft size={15} /> Back to website</Link>
      </div>
      <main className="ag-auth-main">
        <section className="ag-auth-content" aria-label={title}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease: [.2,.8,.2,1] }}>
            {children}
          </motion.div>
          <p className="ag-auth-notice">Demo access only. Accounts are stored in this browser, not on a remote service.</p>
        </section>
        <aside className="ag-auth-showcase" aria-label="Discover Bee Guardian">
          <div className="ag-auth-photo" role="img" aria-label="Beekeeper caring for a hive"/>
          <div className="ag-auth-shade" />
          <div className="ag-auth-showcase-top"><span className="ag-auth-dot" /> A closer connection to your hive</div>
          <div className="ag-auth-showcase-content">
            <div className="ag-auth-eyebrow">BEE GUARDIAN 2.0</div>
            <h2>Every hive has<br/>a <em>story to tell.</em></h2>
            <p>From the smallest change in temperature to an unexpected disturbance, find clarity in every signal.</p>
            <div className="ag-auth-mini-card">
              <div className="ag-auth-mini-icon"><Thermometer size={19}/></div>
              <div><strong>Real-time awareness</strong><span>Temperature · Humidity · Vibration</span></div>
              <Check size={18} style={{ marginLeft: 'auto', color: '#8dc99f' }}/>
            </div>
          </div>
        </aside>
      </main>
      <div className="ag-auth-bottom"><span>© {new Date().getFullYear()} Bee Guardian</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div></div>
    </div>
  )
}

function Social() {
  const soon = (p: string) => gooeyToast.info(`${p} sign-in isn’t available in the demo`, { description: 'Use email and password, or the demo account.' })
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <Button type="button" variant="secondary" onClick={() => soon('Google')} className="h-11"><GoogleIcon className="ico ico-pop size-4" /> Google</Button>
        <Button type="button" variant="secondary" onClick={() => soon('GitHub')} className="h-11"><GithubIcon className="ico ico-pop size-4" /> GitHub</Button>
      </div>
      <div className="my-6 flex items-center gap-3 text-[12px] text-fg-3"><span className="h-px flex-1 bg-line" />or with email<span className="h-px flex-1 bg-line" /></div>
    </>
  )
}

function PasswordInput(props: { value: string; onChange: (v: string) => void; error?: string; label?: string; name?: string; autoComplete?: string; labelAction?: ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <Input
      label={props.label ?? 'Password'}
      name={props.name ?? 'password'}
      type={show ? 'text' : 'password'}
      autoComplete={props.autoComplete ?? 'current-password'}
      placeholder="••••••••"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      error={props.error}
      labelAction={props.labelAction}
      icon={<Lock className="size-4" />}
      trailing={
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="group grid size-7 place-items-center rounded-md text-fg-3 hover:bg-sunken hover:text-fg">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={String(show)} initial={{ opacity: 0, scale: 0.6, rotate: -30 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.15 }}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </motion.span>
          </AnimatePresence>
        </button>
      }
    />
  )
}

export function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from ?? '/app'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address.'
    if (!password) errs.password = 'Enter your password.'
    setErrors(errs)
    if (Object.keys(errs).length) return setShake((n) => n + 1)
    setBusy(true)
    try {
      const u = await signIn(email, password, remember)
      gooeyToast.success(`Welcome back, ${u.name.split(' ')[0]}`, { description: 'Connecting to your hive…' })
      nav(from, { replace: true })
    } catch (err) {
      setShake((n) => n + 1)
      gooeyToast.error('Sign-in failed', { description: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }
  function useDemo() {
    setEmail(DEMO_ACCOUNT.email)
    setPassword(DEMO_ACCOUNT.password)
    setErrors({})
  }

  return (
    <Shell title="Sign in">
      <h1 className="ag-auth-heading">Welcome back</h1>
      <p className="ag-auth-subtitle">Sign in to check on your hives.</p>
      <button onClick={useDemo} className="group mt-6 flex w-full items-center gap-3 rounded-xl border border-dashed border-honey/60 bg-honey-soft/60 px-4 py-3 text-left transition-colors hover:bg-honey-soft">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-honey text-ink"><Sparkles className="ico ico-pop size-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-medium">Use the demo account</span>
          <span className="block truncate font-mono text-[11.5px] text-fg-2">{DEMO_ACCOUNT.email} · {DEMO_ACCOUNT.password}</span>
        </span>
        <ArrowRight className="ico ico-nudge size-4 text-fg-2" />
      </button>
      <div className="mt-6"><Social /></div>
      <motion.form key={shake} animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : undefined} transition={{ duration: 0.4 }} onSubmit={submit} noValidate className="space-y-4">
        <Input label="Email" name="email" type="email" autoComplete="email" placeholder="you@apiary.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} icon={<Mail className="size-4" />} />
        <PasswordInput value={password} onChange={setPassword} error={errors.password} labelAction={<Link to="/forgot-password" className="text-[12.5px] text-fg-2 hover:text-fg">Forgot password?</Link>} />
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-fg-2 select-none">
          <span className={cn('grid size-[18px] place-items-center rounded-[5px] border transition-colors', remember ? 'border-fg bg-fg text-bg' : 'border-line-strong bg-surface')}>
            {remember && <Check className="size-3" strokeWidth={3} />}
          </span>
          <input type="checkbox" className="sr-only" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Keep me signed in
        </label>
        <Button type="submit" size="lg" loading={busy} className="w-full">{busy ? 'Signing in…' : 'Sign in'} {!busy && <ArrowRight className="ico ico-nudge size-4" />}</Button>
      </motion.form>
      <p className="mt-8 text-center text-[13.5px] text-fg-2">New to Bee Guardian? <Link to="/signup" className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-honey">Create an account</Link></p>
    </Shell>
  )
}

function strength(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw) || /[^\w]/.test(pw)) s++
  return s
}

export function Signup() {
  const { signUp } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', apiary: '', password: '' })
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof f | 'agree', string>>>({})
  const [busy, setBusy] = useState(false)
  const s = strength(f.password)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (f.name.trim().length < 2) errs.name = 'Tell us your name.'
    if (!EMAIL_RE.test(f.email)) errs.email = 'Enter a valid email address.'
    if (f.password.length < 8) errs.password = 'Use at least 8 characters.'
    if (!agree) errs.agree = 'Please accept the terms to continue.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const u = await signUp(f)
      gooeyToast.success('Account created', { description: `Welcome to Bee Guardian, ${u.name.split(' ')[0]}.` })
      nav('/app', { replace: true })
    } catch (err) {
      gooeyToast.error('Couldn’t create account', { description: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Shell title="Create account">
      <h1 className="ag-auth-heading">Create your account</h1>
      <p className="ag-auth-subtitle">Set up monitoring for your first hive.</p>
      <div className="mt-6"><Social /></div>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" name="name" autoComplete="name" placeholder="Ayesha Khan" value={f.name} onChange={set('name')} error={errors.name} icon={<User className="size-4" />} />
          <Input label="Apiary name" name="apiary" placeholder="Meadow Apiary" value={f.apiary} onChange={set('apiary')} icon={<Home className="size-4" />} hint="Optional" />
        </div>
        <Input label="Email" name="email" type="email" autoComplete="email" placeholder="you@apiary.com" value={f.email} onChange={set('email')} error={errors.email} icon={<Mail className="size-4" />} />
        <div>
          <PasswordInput value={f.password} onChange={(v) => setF({ ...f, password: v })} error={errors.password} autoComplete="new-password" />
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <motion.span key={i} className="h-1 flex-1 rounded-full bg-sunken" animate={{ backgroundColor: i < s ? (s <= 1 ? 'var(--danger)' : s <= 2 ? 'var(--warn)' : 'var(--ok)') : 'var(--sunken)' }} />
            ))}
          </div>
          <p className="mt-1.5 text-[12px] text-fg-3">{f.password ? ['Too weak', 'Weak', 'Okay', 'Strong', 'Very strong'][s] : 'At least 8 characters.'}</p>
        </div>
        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-fg-2 select-none">
            <span className={cn('mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors', agree ? 'border-fg bg-fg text-bg' : errors.agree ? 'border-danger' : 'border-line-strong bg-surface')}>
              {agree && <Check className="size-3" strokeWidth={3} />}
            </span>
            <input type="checkbox" className="sr-only" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>I agree to the <Link to="/terms" className="text-fg underline underline-offset-2">Terms</Link> and <Link to="/privacy" className="text-fg underline underline-offset-2">Privacy notice</Link>.</span>
          </label>
          {errors.agree && <p className="mt-1.5 text-[12px] text-danger">{errors.agree}</p>}
        </div>
        <Button type="submit" size="lg" loading={busy} className="w-full">{busy ? 'Creating account…' : 'Create account'}</Button>
      </form>
      <p className="mt-8 text-center text-[13.5px] text-fg-2">Already have an account? <Link to="/login" className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-honey">Sign in</Link></p>
    </Shell>
  )
}

export function ForgotPassword() {
  const { requestReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) return setError('Enter a valid email address.')
    setError(undefined)
    setBusy(true)
    await requestReset(email)
    setBusy(false)
    setSent(true)
    gooeyToast.success('Reset link sent', { description: `If ${email} has an account, a link is on its way.` })
  }
  return (
    <Shell title="Reset password">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="grid size-12 place-items-center rounded-2xl bg-ok-soft text-ok"><MailCheck className="size-6" /></span>
            <h1 className="mt-6 ag-auth-heading">Check your inbox</h1>
            <p className="ag-auth-subtitle">We sent a reset link to <span className="font-medium text-fg">{email}</span>. In this demo no email is actually sent — the demo password is <span className="font-mono">{DEMO_ACCOUNT.password}</span>.</p>
            <Link to="/login" className="group mt-8 inline-flex items-center gap-2 text-[14px] font-medium"><ArrowLeft className="size-4" /> Back to sign in</Link>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }}>
            <span className="grid size-12 place-items-center rounded-2xl bg-honey-soft text-honey-ink"><KeyRound className="size-6" /></span>
            <h1 className="mt-6 ag-auth-heading">Forgot your password?</h1>
            <p className="ag-auth-subtitle">Enter your email and we’ll send you a reset link.</p>
            <form onSubmit={submit} noValidate className="mt-8 space-y-4">
              <Input label="Email" name="email" type="email" autoComplete="email" placeholder="you@apiary.com" value={email} onChange={(e) => setEmail(e.target.value)} error={error} icon={<Mail className="size-4" />} />
              <Button type="submit" size="lg" loading={busy} className="w-full">Send reset link</Button>
            </form>
            <Link to="/login" className="group mt-8 inline-flex items-center gap-2 text-[13.5px] text-fg-2 hover:text-fg"><ArrowLeft className="size-4" /> Back to sign in</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  )
}
