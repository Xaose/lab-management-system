'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setLoading } = useAuthStore()

  useEffect(() => {
    // Инициализация завершена
    setLoading(false)
  }, [setLoading])

  return <>{children}</>
}
