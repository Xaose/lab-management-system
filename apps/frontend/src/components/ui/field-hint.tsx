'use client'

interface FieldHintProps {
  text: string
}

export function FieldHint({ text }: FieldHintProps) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[10px] font-bold text-white" aria-label={text}>i</span>
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal text-white shadow-lg group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  )
}
