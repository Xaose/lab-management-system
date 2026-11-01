'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { slugify } from '@/lib/slug'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FieldHint } from '@/components/ui/field-hint'
import { Skeleton } from '@/components/ui/skeleton'
import { useProgressiveItems } from '@/lib/use-progressive-items'

type DisciplineStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

interface Discipline {
  id: string
  name: string
  description?: string
  semester: number
  year: number
  hours: number
  status: DisciplineStatus
  createdBy: {
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
  _count: {
    teachers: number
    groups: number
    labWorks: number
  }
}

export default function DisciplinesPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    year: '',
    semester: '',
    search: ''
  })
  const [deleteDisciplineId, setDeleteDisciplineId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [createData, setCreateData] = useState({ name: '', description: '', semester: 1, year: new Date().getFullYear(), hours: 36, teacherIds: [] as string[] })
  const visibleDisciplines = useProgressiveItems(disciplines)

  const fetchDisciplines = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.year) params.append('year', filters.year)
      if (filters.semester) params.append('semester', filters.semester)
      if (filters.search) params.append('search', filters.search)

      const response = await apiClient.get(`/disciplines?${params.toString()}`)
      setDisciplines(response.data.disciplines)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки дисциплин')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchDisciplines()
  }, [fetchDisciplines])

  useEffect(() => {
    apiClient.get('/users?role=TEACHER').then(response => {
      setTeachers((response.data?.users || []).map((user: any) => ({ id: user.teacher?.id, firstName: user.firstName, lastName: user.lastName })).filter((teacher: { id?: string }): teacher is { id: string; firstName: string; lastName: string } => Boolean(teacher.id)))
    })
  }, [])

  const handleCreateDiscipline = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await apiClient.post('/disciplines', { ...createData, teacherIds: createData.teacherIds })
      setShowCreateModal(false)
      setCreateData({ name: '', description: '', semester: 1, year: new Date().getFullYear(), hours: 36, teacherIds: [] })
      await fetchDisciplines()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания дисциплины')
    }
  }

  const handleDeleteDiscipline = async (disciplineId: string) => {
    try {
      await apiClient.delete(`/disciplines/${disciplineId}`)
      fetchDisciplines()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления дисциплины')
    }
  }

  const getStatusBadge = (status: DisciplineStatus) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-yellow-100 text-yellow-800'
    }
    const labels = {
      DRAFT: 'Черновик',
      PUBLISHED: 'Опубликована',
      ARCHIVED: 'Архивная'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (loading && disciplines.length === 0) {
    return (
      <div className="dashboard-page min-h-screen p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between"><Skeleton className="h-10 w-80" /><Skeleton className="h-11 w-48 rounded-lg" /></div>
          <Skeleton className="mb-6 h-36 w-full rounded-[1.25rem]" />
          <div className="space-y-4">{[1, 2, 3].map(item => <Skeleton key={item} className="h-40 w-full rounded-[1.25rem]" />)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Управление дисциплинами</h1>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            + Создать дисциплину
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Фильтры */}
        <div className="dashboard-card mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Поиск
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Название дисциплины"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <Select value={filters.status} onChange={value => setFilters({ ...filters, status: value })} options={[{ value: '', label: 'Все статусы' }, { value: 'DRAFT', label: 'Черновик' }, { value: 'PUBLISHED', label: 'Опубликована' }, { value: 'ARCHIVED', label: 'Архивная' }]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Учебный год
              </label>
              <Select value={filters.year} onChange={value => setFilters({ ...filters, year: value })} options={[{ value: '', label: 'Все годы' }, { value: '2024', label: '2024' }, { value: '2025', label: '2025' }, { value: '2026', label: '2026' }]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Семестр
              </label>
              <Select value={filters.semester} onChange={value => setFilters({ ...filters, semester: value })} options={[{ value: '', label: 'Все семестры' }, ...Array.from({ length: 8 }, (_, index) => ({ value: String(index + 1), label: `${index + 1} семестр` }))]} />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setFilters({ status: '', year: '', semester: '', search: '' })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>

        {/* Список дисциплин */}
        <div className="space-y-4">
          {disciplines.length > 0 && visibleDisciplines.length === 0 && [1, 2].map(item => <Skeleton key={item} className="h-40 w-full rounded-[1.25rem]" />)}
          {visibleDisciplines.map((discipline) => (
            <div key={discipline.id} className="dashboard-card-hover p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{discipline.name}</h3>
                    {getStatusBadge(discipline.status)}
                    {discipline.status === 'DRAFT' && (
                      <button onClick={() => apiClient.put(`/disciplines/${discipline.id}`, { status: 'PUBLISHED' }).then(fetchDisciplines).catch(() => setError('Ошибка публикации дисциплины'))} className="text-xs font-semibold text-green-700 hover:underline">
                        Опубликовать
                      </button>
                    )}
                  </div>

                  {discipline.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{discipline.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Семестр:</span> {discipline.semester}
                    </div>
                    <div>
                      <span className="font-medium">Год:</span> {discipline.year}
                    </div>
                    <div>
                      <span className="font-medium">Часов:</span> {discipline.hours}
                    </div>
                    <div>
                      <span className="font-medium">Преподавателей:</span> {discipline._count.teachers}
                    </div>
                    <div>
                      <span className="font-medium">Групп:</span> {discipline._count.groups}
                    </div>
                    <div>
                      <span className="font-medium">Лабораторных:</span> {discipline._count.labWorks}
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-500">
                    Создал: {discipline.createdBy.user.lastName} {discipline.createdBy.user.firstName}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/admin/disciplines/${slugify(discipline.name)}`}
                    className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                  >
                    Подробнее
                  </Link>
                  <button
                    onClick={() => setDeleteDisciplineId(discipline.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ConfirmDialog
          open={Boolean(deleteDisciplineId)}
          title="Удалить дисциплину?"
          message="Дисциплина будет удалена. Убедитесь, что в ней нет лабораторных работ."
          confirmLabel="Удалить"
          danger
          onCancel={() => setDeleteDisciplineId(null)}
          onConfirm={() => { if (deleteDisciplineId) void handleDeleteDiscipline(deleteDisciplineId); setDeleteDisciplineId(null) }}
        />
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={event => event.target === event.currentTarget && setShowCreateModal(false)}>
            <form onSubmit={handleCreateDiscipline} className="dashboard-card max-h-[90vh] w-full max-w-xl overflow-y-auto bg-white/95 p-6">
              <h2 className="text-2xl font-bold text-slate-950">Создать дисциплину</h2>
              <p className="mt-1 text-sm text-slate-500">Заполните основные сведения и назначьте преподавателей.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="mb-1 block text-sm font-medium">Название <FieldHint text="Название дисциплины, которое увидят студенты." /></span><input required value={createData.name} onChange={event => setCreateData({ ...createData, name: event.target.value })} className="w-full px-4 py-3" /></label>
                <label className="sm:col-span-2"><span className="mb-1 block text-sm font-medium">Описание <FieldHint text="Кратко опишите содержание дисциплины." /></span><textarea value={createData.description} onChange={event => setCreateData({ ...createData, description: event.target.value })} className="w-full px-4 py-3" /></label>
                <label><span className="mb-1 block text-sm font-medium">Семестр <FieldHint text="Номер семестра, в котором изучается дисциплина." /></span><input required type="number" min="1" value={createData.semester} onChange={event => setCreateData({ ...createData, semester: Number(event.target.value) })} className="w-full px-4 py-3" /></label>
                <label><span className="mb-1 block text-sm font-medium">Учебный год <FieldHint text="Год начала учебного периода." /></span><input required type="number" min="2000" value={createData.year} onChange={event => setCreateData({ ...createData, year: Number(event.target.value) })} className="w-full px-4 py-3" /></label>
                <label><span className="mb-1 block text-sm font-medium">Количество часов <FieldHint text="Общее количество часов по дисциплине." /></span><input required type="number" min="1" value={createData.hours} onChange={event => setCreateData({ ...createData, hours: Number(event.target.value) })} className="w-full px-4 py-3" /></label>
                <label><span className="mb-1 block text-sm font-medium">Преподаватели <FieldHint text="Можно выбрать нескольких преподавателей." /></span><select required multiple value={createData.teacherIds} onChange={event => setCreateData({ ...createData, teacherIds: Array.from(event.target.selectedOptions, option => option.value) })} className="h-28 w-full px-3 py-2">{teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.lastName} {teacher.firstName}</option>)}</select></label>
              </div>
              <div className="mt-6 flex gap-3"><button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-xl border px-4 py-2.5 font-semibold text-slate-700">Отмена</button><button type="submit" className="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 font-semibold text-white">Создать</button></div>
            </form>
          </div>
        )}

        {disciplines.length === 0 && !loading && (
          <div className="dashboard-card p-12 text-center">
            <p className="text-gray-500">Дисциплины не найдены</p>
          </div>
        )}
      </div>
    </div>
  )
}
