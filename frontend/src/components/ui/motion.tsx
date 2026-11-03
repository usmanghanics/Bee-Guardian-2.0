import { motion, useInView, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'

export function Reveal({ children, delay = 0, y = 18, className, ...rest }: { children: ReactNode; delay?: number; y?: number; className?: string } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function CountUp({ to, decimals = 0, suffix = '', className }: { to: number; decimals?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 60, damping: 20 })
  const text = useTransform(spring, (v) => v.toFixed(decimals) + suffix)
  useEffect(() => {
    if (inView) mv.set(to)
  }, [inView, to, mv])
  return <motion.span ref={ref} className={className}>{text}</motion.span>
}

/** Card that tilts slightly toward the pointer. */
export function Tilt({ children, className, max = 6 }: { children: ReactNode; className?: string; max?: number }) {
  const rx = useMotionValue(0), ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 200, damping: 20 }), sry = useSpring(ry, { stiffness: 200, damping: 20 })
  return (
    <motion.div
      className={className}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        ry.set(((e.clientX - r.left) / r.width - 0.5) * max * 2)
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 2)
      }}
      onPointerLeave={() => {
        rx.set(0)
        ry.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}
