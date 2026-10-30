'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@lab/types'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatarUrl?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

// Синхронизация с cookies для работы middleware
const syncWithCookies = (token: string | null, user: User | null) => {
  if (typeof window !== 'undefined') {
    if (token && user) {
      document.cookie = `auth-token=${token}; path=/; max-age=604800; samesite=lax`
      document.cookie = `auth-user=${JSON.stringify(user)}; path=/; max-age=604800; samesite=lax`
    } else {
      document.cookie = 'auth-token=; path=/; max-age=0'
      document.cookie = 'auth-user=; path=/; max-age=0'
    }
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: true,
      setUser: (user) => {
        set({ user })
        syncWithCookies(useAuthStore.getState().token, user)
      },
      setToken: (token) => {
        set({ token })
        syncWithCookies(token, useAuthStore.getState().user)
      },
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        set({ user: null, token: null })
        syncWithCookies(null, null)
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Синхронизировать cookies после восстановления из localStorage
        if (state) {
          syncWithCookies(state.token, state.user)
        }
        useAuthStore.setState({ isLoading: false })
      },
    }
  )
)
