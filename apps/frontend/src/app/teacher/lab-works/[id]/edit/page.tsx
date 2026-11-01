'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import DateTimePicker from '@/components/DateTimePicker'

export default function EditLabWorkPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({ number: 1, section: '', title: '', description: '', requirements: '', dueDate: '', maxScore: 100, status: 'DRAFT' })
  const [sectionOptions, setSectionOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiClient.get(`/lab-works/${id}`)
        const item = response.data?.labWork
        if (item) {
          setForm({
            number: item.number, section: item.section || '', title: item.title, description: item.description || '',
            requirements: item.requirements || '', dueDate: item.dueDate ? item.dueDate.slice(0, 16) : '',
            maxScore: item.maxScore, status: item.status
          })
          if (item.discipline?.id) {
            const disciplineResponse = await apiClient.get(`/disciplines/${item.discipline.id}`)
          const sections = (disciplineResponse.data?.discipline?.labWorks || [])
            .map((lab: { section: string | null }) => lab.section?.trim())
            .filter((section: string | undefined): section is string => Boolean(section))
          setSectionOptions(Array.from(new Set<string>(sections)))
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Не удалось загрузить лабораторную')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  const update = (key: string, value: string | number) => setForm(current => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiClient.put(`/lab-works/${id}`, { ...form, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null })
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
        <label className="text-sm">Раздел<Select value={sectionOptions.includes(form.section) ? form.section : ''} onChange={value => update('section', value)} placeholder="Выберите существующий раздел" options={sectionOptions.map(section => ({ value: section, label: section }))} /><input value={form.section} onChange={e => update('section', e.target.value)} placeholder="Или введите новый раздел" className="mt-2 w-full rounded-lg border p-2" /></label>
      </div>
      <label className="block text-sm">Тема<input required value={form.title} onChange={e => update('title', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm">Описание<textarea value={form.description} onChange={e => update('description', e.target.value)} className="mt-1 min-h-28 w-full rounded-lg border p-2" /></label>
      <label className="block text-sm">Требования<textarea value={form.requirements} onChange={e => update('requirements', e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border p-2" /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">Срок<DateTimePicker value={form.dueDate} onChange={value => update('dueDate', value)} /></label>
        <label className="text-sm">Макс. балл<input type="number" min="1" value={form.maxScore} onChange={e => update('maxScore', Number(e.target.value))} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm">Статус<Select value={form.status} onChange={value => update('status', value)} options={[{ value: 'DRAFT', label: 'Черновик' }, { value: 'PUBLISHED', label: 'Показывать' }, { value: 'HIDDEN', label: 'Скрыта' }, { value: 'ARCHIVED', label: 'Архив' }]} /></label>
      </div>
      <Button type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
    </form>
  </div></div>
}
