import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'pending' | 'accepted' | 'rejected' | 'review' | 'secondary'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-lavender-50 text-lavender-700 border-lavender-200/60',
  secondary: 'bg-slate-100 text-slate-700 border-slate-200/60',
  pending: 'badge-pending',
  accepted: 'badge-accepted',
  rejected: 'badge-rejected',
  review: 'badge-review',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-soft transition-colors-smooth',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
