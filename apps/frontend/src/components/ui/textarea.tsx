import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-[120px] w-full rounded-xl border border-[hsl(var(--border))] bg-white/90 px-4 py-3 text-sm shadow-soft backdrop-blur-sm transition-all duration-200 placeholder:text-slate-400 focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 resize-y',
        className
      )}
      {...props}
    />
  )
}
