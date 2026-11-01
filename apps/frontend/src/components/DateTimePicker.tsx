'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  min?: string
}

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]
const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const parseValue = (value: string) => {
  const [date = '', time = ''] = value.split('T')
  const [year, month, day] = date.split('-').map(Number)
  return {
    date: Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
      ? new Date(year, month - 1, day)
      : new Date(),
    time: /^\d{2}:\d{2}$/.test(time) ? time : '23:59'
  }
}

const toDateValue = (date: Date, time: string) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}T${time}`
}

export default function DateTimePicker({ value, onChange, min }: DateTimePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const parsed = useMemo(() => parseValue(value), [value])
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(parsed.date.getFullYear(), parsed.date.getMonth(), 1)
  )

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const updatePosition = () => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return
    const desiredHeight = 420
    const openUp = window.innerHeight - rect.bottom < desiredHeight
    const maxHeight = Math.min(desiredHeight, Math.max(240, openUp ? rect.top - 16 : window.innerHeight - rect.bottom - 16))
    setMenuStyle({
      position: 'fixed',
      left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 304) - 8)),
      top: openUp ? Math.max(8, rect.top - maxHeight - 8) : rect.bottom + 8,
      width: Math.max(rect.width, 304),
      maxHeight
    })
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

  const days = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const offset = (firstDay.getDay() + 6) % 7
    const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
    return Array.from({ length: offset + lastDay }, (_, index) =>
      index < offset ? null : index - offset + 1
    )
  }, [visibleMonth])

  const formattedValue = value
    ? parsed.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Выберите дату и время'

  const selectDate = (day: number) => {
    const selected = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)
    onChange(toDateValue(selected, parsed.time))
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) {
            updatePosition()
          }
          setOpen(current => !current)
        }}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-white/90 px-4 text-left shadow-soft transition hover:border-lavender-400 focus:outline-none focus:ring-2 focus:ring-lavender-300"
        aria-expanded={open}
      >
        <span className={value ? 'text-sm text-slate-800' : 'text-sm text-slate-400'}>
          {formattedValue}{value ? `, ${parsed.time}` : ''}
        </span>
        <svg className="h-5 w-5 text-lavender-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 2v3m8-3v3M4.5 9.5h15M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div ref={menuRef} onMouseDown={event => event.stopPropagation()} style={menuStyle} className="z-[1000] overflow-auto rounded-2xl border border-white/80 bg-white p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} className="rounded-lg p-2 text-slate-500 hover:bg-lavender-50 hover:text-lavender-700" aria-label="Предыдущий месяц">←</button>
            <strong className="text-sm text-slate-900">{monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</strong>
            <button type="button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} className="rounded-lg p-2 text-slate-500 hover:bg-lavender-50 hover:text-lavender-700" aria-label="Следующий месяц">→</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
            {weekDays.map(day => <span key={day} className="py-1">{day}</span>)}
            {days.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} />
              const selected = parsed.date.getFullYear() === visibleMonth.getFullYear() &&
                parsed.date.getMonth() === visibleMonth.getMonth() &&
                parsed.date.getDate() === day
              return (
                <button key={day} type="button" onClick={() => selectDate(day)} className={`rounded-lg py-2 text-sm transition ${selected ? 'bg-lavender-600 font-semibold text-white shadow-soft' : 'text-slate-700 hover:bg-lavender-50 hover:text-lavender-800'}`}>
                  {day}
                </button>
              )
            })}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Время</label>
            <input
              type="time"
              value={parsed.time}
              min={min && value.slice(0, 10) === min.slice(0, 10) ? min.slice(11, 16) : undefined}
              onChange={event => onChange(toDateValue(parsed.date, event.target.value))}
              className="h-11 w-full rounded-xl border border-[hsl(var(--border))] px-3 text-sm text-slate-800 outline-none focus:border-lavender-500 focus:ring-2 focus:ring-lavender-200"
            />
          </div>
          <div className="mt-4 flex justify-between">
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="text-sm font-medium text-slate-500 hover:text-red-600">Очистить</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-lavender-600 px-4 py-2 text-sm font-semibold text-white hover:bg-lavender-700">Готово</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
