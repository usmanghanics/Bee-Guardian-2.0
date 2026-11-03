import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'honey' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'inverse'
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const base =
  'group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium transition-[background,color,border-color,box-shadow,transform] duration-200 active:scale-[.98] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-honey'
const variants: Record<Variant, string> = {
  primary: 'bg-fg text-bg shadow-xs hover:bg-fg/88',
  honey: 'bg-honey text-ink shadow-[inset_0_1px_0_rgb(255_255_255/.35),0_1px_2px_rgb(22_19_12/.15)] hover:bg-honey-strong dark:hover:bg-honey-strong',
  secondary: 'border border-line bg-surface text-fg shadow-xs hover:border-line-strong hover:bg-surface-2',
  outline: 'border border-line-strong bg-transparent text-fg hover:bg-sunken',
  ghost: 'text-fg-2 hover:bg-sunken hover:text-fg',
  danger: 'bg-danger text-white hover:bg-danger/90',
  inverse: 'bg-bone text-ink hover:bg-white',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px] rounded-xl',
  icon: 'size-9',
  'icon-sm': 'size-8 rounded-lg',
}
export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) => cn(base, variants[variant], sizes[size], className)

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean; children?: ReactNode }
export const Button = forwardRef<HTMLButtonElement, Props>(({ variant, size, loading, className, children, disabled, ...rest }, ref) => (
  <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
    {loading && <LoaderCircle className="size-4 animate-spin" />}
    {children}
  </button>
))
Button.displayName = 'Button'

export function ButtonLink({ variant, size, className, ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />
}
