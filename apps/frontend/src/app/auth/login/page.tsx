'use client'

import { useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthScene from '@/components/AuthScene'

export default function LoginPage() {
  const { setAuth } = useAuthStore()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resetMode, setResetMode] = useState<'login' | 'request' | 'verify' | 'password'>('login')
  const [resetId, setResetId] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetAvailable, setResetAvailable] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const resetAfterRestore = () => {
      setFormData({ email: '', password: '' })
      setError('')
      setResetMode('login')
      setResetId('')
      setResetCode('')
      setNewPassword('')
    }
    window.addEventListener('pageshow', resetAfterRestore)
    resetAfterRestore()
    return () => window.removeEventListener('pageshow', resetAfterRestore)
  }, [])

  useEffect(() => {
    const email = formData.email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResetAvailable(false)
      return
    }
    let active = true
    apiClient.get<{ available: boolean }>(`/auth/password-reset-availability?email=${encodeURIComponent(email)}`)
      .then(response => {
        if (active) setResetAvailable(response.data?.available === true)
      })
      .catch(() => {
        if (active) setResetAvailable(false)
      })
    return () => { active = false }
  }, [formData.email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await apiClient.login(formData)
      if (!response.success || !response.data?.token || !response.data?.user?.role) {
        throw new Error('Сервер не вернул данные авторизации')
      }
      if (response.success && response.data) {
        setAuth(response.data.token, response.data.user)
        const role = response.data.user.role
        const redirect = new URLSearchParams(window.location.search).get('redirect')
        const roleHome = role === 'STUDENT' ? '/student/dashboard' : role === 'TEACHER' ? '/teacher/dashboard' : '/admin/dashboard'
        const rolePrefix = role === 'STUDENT' ? '/student/' : role === 'TEACHER' ? '/teacher/' : '/admin/'
        const destination = redirect?.startsWith(rolePrefix) && !redirect.startsWith('//') ? redirect : roleHome
        window.location.replace(destination)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Ошибка входа. Проверьте данные.')
      window.setTimeout(() => errorRef.current?.focus(), 0)
    } finally {
      setIsLoading(false)
    }
  }

    const handleResetRequest = async () => {
      setError('')
      setIsLoading(true)
      try {
        const response = await apiClient.post('/auth/forgot-password', { email: formData.email })
        if (!response.data?.resetId) throw new Error('Восстановление для этого аккаунта недоступно')
        setResetId(response.data.resetId)
        setResetMode('verify')
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Не удалось отправить код')
      } finally {
        setIsLoading(false)
      }
    }

    const handleResetVerify = async () => {
      setError('')
      setIsLoading(true)
      try {
        await apiClient.post('/auth/verify-reset-code', { resetId, code: resetCode })
        setResetMode('password')
      } catch (err: any) {
        setError(err.response?.data?.error || 'Неверный код')
      } finally {
        setIsLoading(false)
      }
    }

    const handleResetPassword = async () => {
      setError('')
      setIsLoading(true)
      try {
        await apiClient.post('/auth/reset-password', { resetId, code: resetCode, newPassword })
        setResetMode('login')
        setFormData(current => ({ ...current, password: '' }))
        setError('Пароль изменён. Теперь войдите с новым паролем.')
      } catch (err: any) {
        setError(err.response?.data?.error || 'Не удалось изменить пароль')
      } finally {
        setIsLoading(false)
      }
    }
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f5ff] px-4 py-10">
      <AuthScene />
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-lavender-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-purple-200/50 blur-3xl" />
      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-[0_30px_90px_rgba(74,54,145,0.18)] backdrop-blur-2xl md:grid-cols-[1.05fr_0.95fr] animate-fade-in-scale">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-[#21134f] p-12 text-white md:flex md:flex-col md:justify-between">
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

          {resetMode === 'login' ? <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <Input
                id="email"
                name="login-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Пароль
              </label>
              <Input
                id="password"
                name="login-password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            {resetAvailable && (
              <button type="button" className="text-sm font-medium text-lavender-700 hover:underline" onClick={() => setResetMode('request')}>
                Забыли пароль?
              </button>
            )}
            {error && (
              <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-200/60 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-soft animate-fade-in">
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
          </form> : (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-slate-950">
                {resetMode === 'request' ? 'Восстановление пароля' : resetMode === 'verify' ? 'Введите код из письма' : 'Новый пароль'}
              </h2>
              {resetMode === 'request' && (
                <>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Ваш email" />
                  <Button type="button" disabled={isLoading} onClick={handleResetRequest} className="w-full">Отправить код</Button>
                </>
              )}
              {resetMode === 'verify' && (
                <>
                  <Input inputMode="numeric" maxLength={6} value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))} placeholder="6-значный код" />
                  <Button type="button" disabled={isLoading} onClick={handleResetVerify} className="w-full">Проверить код</Button>
                </>
              )}
              {resetMode === 'password' && (
                <>
                  <Input type="password" minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Новый пароль" />
                  <Button type="button" disabled={isLoading} onClick={handleResetPassword} className="w-full">Сохранить пароль</Button>
                </>
              )}
              {error && <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-200/60 bg-red-50 px-4 py-3.5 text-sm text-red-700">{error}</div>}
              <button type="button" className="w-full text-sm text-slate-600 hover:underline" onClick={() => { setResetMode('login'); setError('') }}>Вернуться ко входу</button>
            </div>
          )}
          <p className="mt-6 text-center text-sm text-[hsl(var(--foreground-secondary))]">
            Нет аккаунта? Обратитесь к администратору
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}
