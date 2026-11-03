import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden>
      <path d="M16 1.5l12.6 7.25v14.5L16 30.5 3.4 23.25V8.75z" fill="var(--honey)" />
      <path d="M16 8.5l6.5 3.75v7.5L16 23.5l-6.5-3.75v-7.5z" fill="var(--fg)" />
      <path d="M16 12.6l2.9 1.65v3.3L16 19.3l-2.9-1.75v-3.3z" fill="var(--honey)" />
    </svg>
  )
}

export function Logo({ to = '/', className, inverse }: { to?: string; className?: string; inverse?: boolean }) {
  return (
    <Link to={to} className={cn('group flex items-center gap-2.5 font-semibold tracking-[-0.02em]', inverse ? 'text-bone' : 'text-fg', className)} aria-label="Bee Guardian home">
      <motion.span whileHover={{ rotate: 60 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="flex">
        <LogoMark />
      </motion.span>
      <span className="text-[17px]">Bee Guardian</span>
    </Link>
  )
}

/** Stylised honey bee, used in fallbacks and decoration. */
export function BeeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden fill="none">
      <ellipse cx="44" cy="40" rx="22" ry="13" transform="rotate(-28 44 40)" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" />
      <ellipse cx="72" cy="38" rx="20" ry="12" transform="rotate(24 72 38)" fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.5" />
      <ellipse cx="60" cy="70" rx="20" ry="27" fill="#E8A317" />
      <path d="M41 62h38M40.5 74h39M44 86h32" stroke="#16130C" strokeWidth="7" strokeLinecap="round" />
      <circle cx="60" cy="40" r="11" fill="#16130C" />
      <path d="M55 31c-3-7-8-10-13-10M65 31c3-7 8-10 13-10" stroke="#16130C" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M60 97v7" stroke="#16130C" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Photo with a designed fallback. Photos live in /public/images (see README there).
 */
export function Photo({ src, alt, className, imgClassName, caption, priority }: { src: string; alt: string; className?: string; imgClassName?: string; caption?: string; priority?: boolean }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  return (
    <div className={cn('relative overflow-hidden bg-[#2a2010]', className)}>
      {state !== 'ok' && (
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_10%,#f3c35a_0%,#c98a0c_38%,#5a3a06_78%,#2a1c05_100%)]">
          <div className="absolute inset-0 bg-honeycomb opacity-70 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_80%,rgb(255_220_140/.35),transparent)]" />
          <BeeGlyph className="absolute right-[12%] top-[16%] w-[22%] min-w-14 max-w-32 rotate-[18deg] text-bone drop-shadow-[0_8px_24px_rgb(0_0_0/.35)]" />
          {import.meta.env.DEV && caption && state === 'error' && (
            <span className="absolute bottom-3 left-3 rounded-md bg-black/30 px-2 py-1 font-mono text-[10.5px] text-bone/80 backdrop-blur-sm">{caption}</span>
          )}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setState('ok')}
        onError={() => setState('error')}
        className={cn('relative h-full w-full object-cover transition-opacity duration-700', state === 'ok' ? 'opacity-100' : 'opacity-0', imgClassName)}
      />
    </div>
  )
}
