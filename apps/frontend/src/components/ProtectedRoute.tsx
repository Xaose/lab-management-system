'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@lab/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, token, isLoading } = useAuthStore()

  useEffect(() => {
    // Если нет токена, перенаправляем на логин
    if (!isLoading && !token) {
      router.replace('/auth/login')
      return
    }

    // Если указаны разрешённые роли, проверяем доступ
    if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/unauthorized')
    }
  }, [user, token, isLoading, allowedRoles, router])

  useEffect(() => {
    const handlePageShow = () => {
      if (!useAuthStore.getState().token) {
        router.replace('/auth/login')
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [router])

  // Показываем loader пока проверяем авторизацию
  if (isLoading || !user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Если роль не подходит, показываем loader (редирект произойдёт в useEffect)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <>{children}</>
}
