'use client'

import { useAuthStore } from '@/store/auth.store'

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuthStore()

  return <>{children}</>
}
