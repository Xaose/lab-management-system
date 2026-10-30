'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthScene from '@/components/AuthScene'

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f5ff] px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-lavender-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-purple-200/50 blur-3xl" />
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-[0_30px_90px_rgba(74,54,145,0.18)] backdrop-blur-2xl md:grid-cols-[1.05fr_0.95fr] animate-fade-in-scale">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-[#21134f] p-12 text-white md:flex md:flex-col md:justify-between">
          <AuthScene />
          <div className="relative z-10">
            <div className="mb-20 flex items-center gap-3 animate-slide-in">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-bold text-lavender-700 shadow-soft-lg">L</div>
              <span className="text-2xl font-bold tracking-tight">LabFlow</span>
            </div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-lavender-200 animate-fade-in stagger-1">Laboratory workspace</p>
            <h1 className="max-w-md text-5xl font-bold leading-[1.08] animate-fade-in stagger-2">Все лабораторные - в одном ритме.</h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-lavender-100/80 animate-fade-in stagger-3">Создавайте задания, сдавайте работы и отслеживайте результат без лишних шагов.</p>
          </div>
          <p className="relative z-10 text-sm text-lavender-200/70 animate-fade-in stagger-4">Единое пространство для студентов и преподавателей.</p>
        </div>

        <div className="flex items-center p-8 sm:p-14 animate-fade-in stagger-1">
          <div className="w-full">
          <div className="mb-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-lavender-100 font-bold text-lavender-700 shadow-soft md:hidden">
              L
            </div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-lavender-700">Добро пожаловать</p>
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-950">С возвращением</h1>
            <p className="text-base leading-6 text-[hsl(var(--foreground-secondary))]">Войдите в рабочее пространство LabFlow.</p>
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
    </div>
  )
}
