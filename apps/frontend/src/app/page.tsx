'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function Home() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      // Перенаправить авторизованного пользователя в его кабинет
      if (user.role === 'STUDENT') {
        router.push('/student/dashboard')
      } else if (user.role === 'TEACHER') {
        router.push('/teacher/dashboard')
      } else {
        router.push('/admin/dashboard')
      }
    } else {
      // Перенаправить неавторизованного на страницу входа
      router.push('/auth/login')
    }
  }, [user, router])

  return null
}
