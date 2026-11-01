'use client'

import { useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'

const defaultAccent = '#6d28d9'

function hexToHsl(hex: string) {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16) / 255
  const g = parseInt(value.slice(2, 4), 16) / 255
  const b = parseInt(value.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  if (max === min) return `0 0% ${Math.round(lightness * 100)}%`
  const difference = max - min
  const saturation = lightness > 0.5 ? difference / (2 - max - min) : difference / (max + min)
  let hue = max === r ? (g - b) / difference + (g < b ? 6 : 0) : max === g ? (b - r) / difference + 2 : (r - g) / difference + 4
  hue /= 6
  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`
}

export default function PreferencesProvider() {
  const user = useAuthStore(state => state.user)

  useEffect(() => {
    const root = document.documentElement
    const theme = user?.theme || 'light'
    root.lang = user?.language || 'ru'
    const applyTheme = (mode: string) => {
      const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.toggle('dark', dark)
    }
    applyTheme(theme)
    const accent = hexToHsl(user?.accentColor || defaultAccent)
    root.style.setProperty('--primary', accent)
    root.style.setProperty('--ring', accent)

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme(theme)
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
  }, [user?.theme, user?.accentColor, user?.language])

  return null
}

export async function savePreferences(preferences: { theme: 'light' | 'dark' | 'system'; accentColor: string | null; language: 'ru' | 'en' | 'be' }) {
  const response = await apiClient.put('/auth/preferences', preferences)
  const current = useAuthStore.getState().user
  if (current) useAuthStore.getState().setUser({ ...current, ...preferences })
  return response
}
