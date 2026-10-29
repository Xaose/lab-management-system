import { cn } from '@/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const variants = {
  default: 'bg-[hsl(var(--primary))] text-white shadow-soft hover:bg-[hsl(var(--primary-dark))] hover:shadow-soft-md active:scale-[0.98]',
  secondary: 'bg-lavender-100 text-lavender-800 shadow-soft hover:bg-lavender-200 hover:shadow-soft-md active:scale-[0.98]',
  outline: 'border-2 border-lavender-200/80 bg-white/70 text-lavender-800 hover:bg-lavender-50 hover:border-lavender-300 backdrop-blur-sm',
  ghost: 'text-slate-600 hover:bg-lavender-50/80 hover:text-lavender-800',
}

const sizes = {
  default: 'h-11 px-5 py-2.5',
  sm: 'h-9 rounded-lg px-3.5 text-xs',
  lg: 'h-12 px-6 py-3 text-base',
  icon: 'h-11 w-11',
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:saturate-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
