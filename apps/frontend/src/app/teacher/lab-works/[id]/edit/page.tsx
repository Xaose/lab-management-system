'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'

export default function EditLabWorkPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({ number: 1, section: '', title: '', description: '', requirements: '', dueDate: '', maxScore: 100, status: 'DRAFT' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient.get(`/lab-works/${id}`).then(response => {
      const item = response.data?.labWork
      if (item) setForm({
        number: item.number, section: item.section || '', title: item.title, description: item.description || '',
        requirements: item.requirements || '', dueDate: item.dueDate ? item.dueDate.slice(0, 16) : '',
        maxScore: item.maxScore, status: item.status
      })
    }).catch(err => setError(err.response?.data?.error || 'Не удалось загрузить лабораторную')).finally(() => setLoading(false))
  }, [id])

  const update = (key: string, value: string | number) => setForm(current => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiClient.put(`/lab-works/${id}`, { ...form, dueDate: form.dueDate || null })
      router.back()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось сохранить изменения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="dashboard-page flex min-h-screen items-center justify-center">Загрузка...</div>
  return <div className="dashboard-page min-h-screen"><div className="mx-auto max-w-3xl px-5 py-8">
    <Link href="/teacher/disciplines" className="text-sm text-lavender-700">← К дисциплинам</Link>
    <form onSubmit={submit} className="dashboard-card mt-5 space-y-5 p-6">
      <h1 className="text-2xl font-bold">Редактирование лабораторной</h1>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Номер<input type="number" min="1" value={form.number} onChange={e => update('number', Number(e.target.value))} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm">Раздел<input value={form.section} onChange={e => update('section', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      </div>
      <label className="block text-sm">Тема<input required value={form.title} onChange={e => update('title', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm">Описание<textarea value={form.description} onChange={e => update('description', e.target.value)} className="mt-1 min-h-28 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm">Требования<textarea value={form.requirements} onChange={e => update('requirements', e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border p-2" /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">Срок<input type="datetime-local" value={form.dueDate} onChange={e => update('dueDate', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm">Макс. балл<input type="number" min="1" value={form.maxScore} onChange={e => update('maxScore', Number(e.target.value))} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm">Статус<select value={form.status} onChange={e => update('status', e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="DRAFT">Черновик</option><option value="PUBLISHED">Показывать</option><option value="HIDDEN">Скрыта</option><option value="ARCHIVED">Архив</option></select></label>
      </div>
      <Button type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
    </form>
  </div></div>
}
