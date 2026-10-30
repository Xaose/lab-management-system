'use client'

import { FormEvent, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth.store'

interface ProfileStats {
  submissions: number
  reviewed: number
  pending: number
}

export default function ProfilePage() {
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', patronymic: '', phone: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const setUser = useAuthStore(state => state.setUser)

  useEffect(() => {
    apiClient.get('/auth/me').then(response => {
      const user = response.data?.user
      if (user) setForm({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        patronymic: user.patronymic || '',
        phone: user.phone || ''
      })
      setAvatarUrl(user.avatarUrl || null)
      setUser(user)
      if (user.role === 'STUDENT' || user.role === 'TEACHER') {
        apiClient.get('/submissions').then(submissionResponse => {
          const submissions = submissionResponse.data?.submissions || []
          setStats({
            submissions: submissions.length,
            reviewed: submissions.filter((item: { status: string }) => item.status === 'REVIEWED').length,
            pending: submissions.filter((item: { status: string }) => item.status === 'SUBMITTED' || item.status === 'IN_REVIEW').length
          })
        })
      }
    })
  }, [setUser])

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Выберите изображение PNG, JPEG или WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Размер изображения не должен превышать 2 МБ.')
      return
    }
    setAvatarLoading(true)
    setError('')
    try {
      const data = new FormData()
      data.append('avatar', file)
      const response = await apiClient.upload<{ user: { avatarUrl: string } }>('/auth/avatar', data)
      const nextAvatar = response.data?.user.avatarUrl
      setAvatarUrl(nextAvatar || null)
      const currentUser = useAuthStore.getState().user
      if (currentUser) setUser({ ...currentUser, avatarUrl: nextAvatar })
      setMessage('Фото профиля обновлено.')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось загрузить фото')
    } finally {
      setAvatarLoading(false)
    }
  }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await apiClient.put('/auth/profile', form)
      setMessage('Данные профиля сохранены.')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось сохранить профиль')
    }
  }

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await apiClient.put('/auth/password', passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      setMessage('Пароль изменён.')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось изменить пароль')
    }
  }

  return (
    <div className="dashboard-page min-h-screen">
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
        <div><h1 className="text-3xl font-bold text-slate-950">Мой профиль</h1><p className="mt-2 text-slate-600">Личные данные и настройки доступа.</p></div>
        {stats && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Всего работ', stats.submissions],
              ['Проверено', stats.reviewed],
              ['На проверке', stats.pending]
            ].map(([label, value]) => (
              <Card key={label} className="p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
              </Card>
            ))}
          </div>
        )}
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-lavender-300 to-lavender-200 text-center text-2xl font-bold leading-[5rem] text-lavender-900">
              {avatarUrl ? <img src={avatarUrl} alt="Фото профиля" className="h-full w-full object-cover" /> : `${form.firstName[0] || ''}${form.lastName[0] || ''}`}
            </div>
            <div>
              <h2 className="font-semibold">Фото профиля</h2>
              <p className="mb-2 text-sm text-slate-500">PNG, JPEG или WebP до 2 МБ</p>
              <label className="inline-flex cursor-pointer rounded-lg border border-lavender-300 px-3 py-2 text-sm font-medium text-lavender-800 transition hover:bg-lavender-100">
                {avatarLoading ? 'Загрузка...' : 'Загрузить фото'}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={avatarLoading} onChange={event => {
                  const file = event.target.files?.[0]
                  if (file) void uploadAvatar(file)
                  event.target.value = ''
                }} />
              </label>
            </div>
          </div>
          <h2 className="mb-5 text-lg font-semibold">Личные данные</h2>
          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Имя" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
            <Input placeholder="Фамилия" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
            <Input placeholder="Отчество" value={form.patronymic} onChange={e => setForm({ ...form, patronymic: e.target.value })} />
            <Input placeholder="Телефон" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input className="sm:col-span-2" type="email" placeholder="Email / логин" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <Button className="sm:col-span-2">Сохранить данные</Button>
          </form>
        </Card>
        <Card className="p-6">
          <h2 className="mb-5 text-lg font-semibold">Смена пароля</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <Input type="password" placeholder="Текущий пароль" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
            <Input type="password" placeholder="Новый пароль (не менее 6 символов)" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} minLength={6} required />
            <Button variant="outline">Изменить пароль</Button>
          </form>
        </Card>
        {(message || error) && <p className={error ? 'text-sm text-red-600' : 'text-sm text-emerald-700'}>{error || message}</p>}
      </div>
    </div>
  )
}
