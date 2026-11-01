'use client'

import { useEffect, useRef, useState } from 'react'
import { savePreferences } from './PreferencesProvider'
import { useAuthStore } from '@/store/auth.store'
import { Select } from '@/components/ui/select'

export default function PreferencesMenu({ collapsed }: { collapsed: boolean }) {
  const user = useAuthStore(state => state.user)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(user?.theme || 'light')
  const [language, setLanguage] = useState<'ru' | 'en' | 'be'>(user?.language || 'ru')
  const [accentColor, setAccentColor] = useState(user?.accentColor || '#6d28d9')
  const locale = user?.language || 'ru'
  const labels = locale === 'en'
    ? { interface: 'Interface', appearance: 'Appearance', saved: 'Saved to profile', saving: 'Saving...', theme: 'Theme', light: 'Light', dark: 'Dark', system: 'System', language: 'Language', accent: 'Accent color', russian: 'Russian', belarusian: 'Belarusian' }
    : locale === 'be'
      ? { interface: 'Інтэрфейс', appearance: 'Выгляд інтэрфейсу', saved: 'Налады захоўваюцца ў профілі', saving: 'Захаванне...', theme: 'Тэма', light: 'Светлая', dark: 'Цёмная', system: 'Сістэмная', language: 'Мова', accent: 'Колер акцэнту', russian: 'Руская', belarusian: 'Беларуская' }
      : { interface: 'Интерфейс', appearance: 'Вид интерфейса', saved: 'Настройки сохраняются в профиле', saving: 'Сохранение...', theme: 'Тема', light: 'Светлая', dark: 'Тёмная', system: 'Системная', language: 'Язык', accent: 'Цвет акцента', russian: 'Русский', belarusian: 'Беларуская' }
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTheme(user?.theme || 'light')
    setLanguage(user?.language || 'ru')
    setAccentColor(user?.accentColor || '#6d28d9')
  }, [user?.theme, user?.language, user?.accentColor])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const save = async (next: Partial<{ theme: typeof theme; language: typeof language; accentColor: string | null }>) => {
    const values = { theme, language, accentColor, ...next }
    setTheme(values.theme)
    setLanguage(values.language)
    setAccentColor(values.accentColor || '#6d28d9')
    setSaving(true)
    try {
      await savePreferences(values)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={menuRef} className={`relative ${collapsed ? 'lg:w-12' : ''}`}>
      <button type="button" onClick={() => setOpen(value => !value)} className={`flex w-full items-center gap-3 rounded-xl border border-white/30 bg-white/15 px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white/40 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`} title="Настройки интерфейса">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/60 text-base text-lavender-700 shadow-sm">◐</span>
        <span className={collapsed ? 'hidden' : 'lg:block'}>{labels.interface}</span>
      </button>
      {open && (
        <div className={`absolute bottom-full z-[80] mb-3 w-72 rounded-2xl border border-white/70 bg-white/95 p-4 text-slate-800 shadow-2xl backdrop-blur-xl ${collapsed ? 'left-0 lg:left-full lg:ml-3' : 'left-0'}`}>
          <div className="mb-4 flex items-center justify-between"><div><strong className="block text-sm">{labels.appearance}</strong><span className="text-xs text-slate-500">{labels.saved}</span></div>{saving && <span className="text-xs text-slate-500">{labels.saving}</span>}</div>
          <label className="mb-3 block text-xs font-semibold">{labels.theme}<Select value={theme} onChange={value => void save({ theme: value as typeof theme })} options={[{ value: 'light', label: labels.light }, { value: 'dark', label: labels.dark }, { value: 'system', label: labels.system }]} /></label>
          <label className="mb-3 block text-xs font-semibold">{labels.language}<Select value={language} onChange={value => void save({ language: value as typeof language })} options={[{ value: 'ru', label: labels.russian }, { value: 'en', label: 'English' }, { value: 'be', label: labels.belarusian }]} /></label>
          <label className="flex items-center justify-between text-xs font-semibold">{labels.accent}<input type="color" value={accentColor} onChange={event => void save({ accentColor: event.target.value })} className="h-8 w-12 cursor-pointer rounded border-0 p-0" /></label>
        </div>
      )}
    </div>
  )
}
