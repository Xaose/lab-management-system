'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await apiClient.login(formData)
      if (response.success && response.data) {
        setToken(response.data.token)
        setUser(response.data.user)
        const role = response.data.user.role
        router.push(role === 'STUDENT' ? '/student/dashboard' : role === 'TEACHER' ? '/teacher/dashboard' : '/admin/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка входа. Проверьте данные.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="dashboard-page flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[hsl(var(--border-light))] bg-white/80 shadow-soft-xl backdrop-blur-xl md:grid md:grid-cols-2 animate-fade-in-scale">
        <div className="hidden bg-gradient-to-br from-lavender-600 to-purple-700 p-12 text-white md:flex md:flex-col md:justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
          <div className="relative z-10">
            <div className="mb-12 flex items-center gap-3 animate-slide-in">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-white text-lg font-bold text-lavender-700 shadow-soft-lg">
                L
              </div>
              <span className="text-2xl font-bold">LabFlow</span>
            </div>
            <p className="mb-4 text-sm text-lavender-100 animate-fade-in stagger-1">Сдача и проверка лабораторных работ</p>
            <h1 className="max-w-sm text-4xl font-bold leading-tight animate-fade-in stagger-2">
              Учитесь. Сдавайте. Развивайтесь.
            </h1>
          </div>
          <p className="text-sm text-lavender-100 relative z-10 animate-fade-in stagger-3">
            Единое пространство для студентов и преподавателей.
          </p>
        </div>

        <div className="p-8 sm:p-12 animate-fade-in stagger-1">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-lavender-100 font-bold text-lavender-700 shadow-soft md:hidden">
              L
            </div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-950">С возвращением</h1>
            <p className="text-base text-[hsl(var(--foreground-secondary))]">Войдите, чтобы продолжить работу.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="rounded-xl border border-red-200/60 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-soft animate-fade-in">
                {error}
              </div>
            )}
            <Button type="submit" disabled={isLoading} size="lg" className="w-full">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Вход...
                </span>
              ) : (
                'Войти'
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[hsl(var(--foreground-secondary))]">
            Нет аккаунта? Обратитесь к администратору
          </p>
        </div>
      </div>
    </div>
  )
}
