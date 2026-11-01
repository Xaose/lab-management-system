'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'

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
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selected = options.find(option => option.value === value)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const updatePosition = () => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < 260
    const maxHeight = Math.min(240, Math.max(120, openUp ? rect.top - 16 : spaceBelow - 16))
    setMenuStyle({
      position: 'fixed',
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      top: openUp ? Math.max(8, rect.top - maxHeight - 8) : rect.bottom + 8,
      width: rect.width,
      maxHeight
    })
  }

  const toggleMenu = () => {
    if (disabled) return
    if (!open) {
      updatePosition()
    }
    setOpen(current => !current)
  }

  useEffect(() => {
    if (!open) return
    const update = () => updatePosition()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  const menu = open && typeof document !== 'undefined' ? createPortal(
    <div ref={menuRef} onMouseDown={event => event.stopPropagation()} style={menuStyle} className="custom-scrollbar z-[1000] overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-fade-in-scale">
      {options.map(option => (
        <button type="button" key={option.value} onClick={() => { onChange(option.value); setOpen(false) }} className={`mb-1.5 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition last:mb-0 hover:bg-lavender-100 ${option.value === value ? 'bg-lavender-100 font-semibold text-lavender-900' : 'text-slate-700'}`}>
          {option.label}
        </button>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <div ref={ref} className={`relative ${className}`}>
      {required && <input tabIndex={-1} required value={value} onChange={() => undefined} className="pointer-events-none absolute h-0 w-0 opacity-0" aria-hidden="true" />}
      <button type="button" disabled={disabled} onClick={toggleMenu} className="flex h-11 w-full items-center justify-between rounded-xl border border-white/70 bg-white/65 px-4 text-left text-sm text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-lavender-300 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/20 disabled:cursor-not-allowed disabled:opacity-60">
        <span className={selected ? '' : 'text-slate-400'}>{selected?.label || placeholder}</span>
        <svg className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
      </button>
      {menu}
    </div>
  )
}
