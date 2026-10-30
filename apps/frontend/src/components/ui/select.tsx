'use client'

import { useEffect, useRef, useState } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export function Select({ value, options, onChange, placeholder = 'Выберите вариант', disabled = false, required = false, className = '' }: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(option => option.value === value)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      {required && <input tabIndex={-1} required value={value} onChange={() => undefined} className="pointer-events-none absolute h-0 w-0 opacity-0" aria-hidden="true" />}
      <button type="button" disabled={disabled} onClick={() => setOpen(current => !current)} className="flex h-11 w-full items-center justify-between rounded-xl border border-white/70 bg-white/65 px-4 text-left text-sm text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-lavender-300 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 disabled:cursor-not-allowed disabled:opacity-60">
        <span className={selected ? '' : 'text-slate-400'}>{selected?.label || placeholder}</span>
        <svg className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
      </button>
      {open && (
        <div className="custom-scrollbar absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-white/70 bg-white/95 p-1.5 shadow-soft-lg backdrop-blur-xl animate-fade-in-scale">
          {options.map(option => (
            <button type="button" key={option.value} onClick={() => { onChange(option.value); setOpen(false) }} className={`mb-1.5 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition last:mb-0 hover:bg-lavender-100 ${option.value === value ? 'bg-lavender-100 font-semibold text-lavender-900' : 'text-slate-700'}`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
