import { forwardRef, useEffect, useRef, useState, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/telemetry'

/* Card */
export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0 rounded-2xl border border-line bg-surface shadow-xs', className)} {...p} />
}
export function CardHeader({ title, description, action, className, icon }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon}
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold tracking-[-0.01em]">{title}</h3>
          {description && <p className="mt-0.5 text-[12.5px] text-fg-3">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

/* Badge */
const toneCls: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok',
  alert: 'bg-danger-soft text-danger',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
  neutral: 'bg-sunken text-fg-2',
}
export function Badge({ tone = 'neutral', dot = true, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[11.5px] font-medium', toneCls[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/* Kbd */
export const Kbd = ({ children, className }: { children: ReactNode; className?: string }) => (
  <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line bg-surface-2 px-1 font-mono text-[10.5px] text-fg-3', className)}>{children}</kbd>
)

/* Eyebrow */
export const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-fg-3', className)}>{children}</span>
)

/* Input */
type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: ReactNode; icon?: ReactNode; trailing?: ReactNode; labelAction?: ReactNode }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, icon, trailing, labelAction, className, id, ...rest }, ref) => {
  const fid = id ?? rest.name
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor={fid} className="text-[13px] font-medium text-fg">{label}</label>
          {labelAction}
        </div>
      )}
      <div
        className={cn(
          'group/input flex h-11 items-center gap-2.5 rounded-[10px] border bg-surface px-3 shadow-xs transition-[border-color,box-shadow] focus-within:border-honey focus-within:shadow-[0_0_0_4px_var(--ring)]',
          error ? 'border-danger/70' : 'border-line hover:border-line-strong',
        )}
      >
        {icon && <span className="text-fg-3 transition-colors group-focus-within/input:text-fg">{icon}</span>}
        <input
          ref={ref}
          id={fid}
          aria-invalid={!!error}
          aria-describedby={error ? `${fid}-err` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-3 focus-visible:outline-none"
          {...rest}
        />
        {trailing}
      </div>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p key="e" id={`${fid}-err`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-[12px] text-danger">
            {error}
          </motion.p>
        ) : hint ? (
          <p className="mt-1.5 text-[12px] text-fg-3">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  )
})
Input.displayName = 'Input'

/* Switch */
export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors', checked ? 'border-fg bg-fg' : 'border-line-strong bg-sunken')}
    >
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} className={cn('ml-0.5 size-[18px] rounded-full bg-surface shadow-xs', checked && 'ml-[18px] bg-bg')} />
    </button>
  )
}

/* Segmented control */
export function Segmented<T extends string>({ value, onChange, options, layoutId, size = 'md' }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; layoutId: string; size?: 'sm' | 'md' }) {
  return (
    <div role="tablist" className="inline-flex gap-0.5 rounded-[10px] border border-line bg-sunken p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn('relative flex items-center gap-1.5 rounded-[7px] font-medium transition-colors', size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3 py-1.5 text-[12.5px]', o.value === value ? 'text-fg' : 'text-fg-3 hover:text-fg')}
        >
          {o.value === value && <motion.span layoutId={layoutId} transition={{ type: 'spring', stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-[7px] bg-surface shadow-xs ring-1 ring-line" />}
          <span className="relative flex items-center gap-1.5">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/* Popover / dropdown */
export function Popover({ trigger, children, align = 'end', className, open: controlled, onOpenChange }: { trigger: (p: { open: boolean; toggle: () => void }) => ReactNode; children: ReactNode | ((close: () => void) => ReactNode); align?: 'start' | 'end'; className?: string; open?: boolean; onOpenChange?: (o: boolean) => void }) {
  const [inner, setInner] = useState(false)
  const open = controlled ?? inner
  const set = (o: boolean) => (onOpenChange ? onOpenChange(o) : setInner(o))
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && set(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && set(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  })
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => set(!open) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn('absolute top-[calc(100%+8px)] z-50 origin-top rounded-xl border border-line bg-surface p-1.5 shadow-pop', align === 'end' ? 'right-0' : 'left-0', className)}
          >
            {typeof children === 'function' ? children(() => set(false)) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
export function MenuItem({ icon, children, onClick, danger, shortcut, anim = 'ico-pop' }: { icon?: ReactNode; children: ReactNode; onClick?: () => void; danger?: boolean; shortcut?: ReactNode; anim?: string }) {
  return (
    <button onClick={onClick} className={cn('group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-sunken', danger ? 'text-danger' : 'text-fg-2 hover:text-fg')}>
      {icon && <span className={cn('ico flex size-4 items-center', anim)}>{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut}
    </button>
  )
}

/* Accordion */
export function AccordionItem({ q, children, defaultOpen = false }: { q: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[16px] font-medium tracking-[-0.01em]">
        {q}
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-full border border-line transition-all group-hover:border-line-strong', open && 'rotate-180 bg-fg text-bg')}>
          <ChevronDown className="size-4" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }} className="overflow-hidden">
            <div className="max-w-[62ch] pb-6 text-[14.5px] leading-relaxed text-fg-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
