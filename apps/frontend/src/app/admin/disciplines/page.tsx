'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { slugify } from '@/lib/slug'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

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
  const [createData, setCreateData] = useState({ name: '', description: '', semester: 1, year: new Date().getFullYear(), hours: 36, teacherId: '' })

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
      await apiClient.post('/disciplines', createData)
      setShowCreateModal(false)
      setCreateData({ name: '', description: '', semester: 1, year: new Date().getFullYear(), hours: 36, teacherId: '' })
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
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
          {disciplines.map((discipline) => (
            <div key={discipline.id} className="dashboard-card-hover p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{discipline.name}</h3>
                    {getStatusBadge(discipline.status)}
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
                <ConfirmDialog
                  open={Boolean(deleteDisciplineId)}
                  title="Удалить дисциплину?"
                  message="Дисциплина будет удалена. Убедитесь, что в ней нет лабораторных работ."
                  confirmLabel="Удалить"
                  danger
                  onCancel={() => setDeleteDisciplineId(null)}
                  onConfirm={() => {
                    if (deleteDisciplineId) void handleDeleteDiscipline(deleteDisciplineId)
                    setDeleteDisciplineId(null)
                  }}
                />
                {showCreateModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <form onSubmit={handleCreateDiscipline} className="dashboard-card w-full max-w-xl bg-white/95 p-6">
                      <h2 className="text-2xl font-bold text-slate-950">Создать дисциплину</h2>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <input required placeholder="Название" value={createData.name} onChange={event => setCreateData({ ...createData, name: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2" />
                        <textarea placeholder="Описание" value={createData.description} onChange={event => setCreateData({ ...createData, description: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2" />
                        <input required type="number" min="1" placeholder="Семестр" value={createData.semester} onChange={event => setCreateData({ ...createData, semester: Number(event.target.value) })} className="rounded-xl border border-slate-200 px-4 py-3" />
                        <input required type="number" min="2000" placeholder="Год" value={createData.year} onChange={event => setCreateData({ ...createData, year: Number(event.target.value) })} className="rounded-xl border border-slate-200 px-4 py-3" />
                        <input required type="number" min="1" placeholder="Часы" value={createData.hours} onChange={event => setCreateData({ ...createData, hours: Number(event.target.value) })} className="rounded-xl border border-slate-200 px-4 py-3" />
                        <Select required value={createData.teacherId} onChange={value => setCreateData({ ...createData, teacherId: value })} placeholder="Ответственный преподаватель" options={teachers.map(teacher => ({ value: teacher.id, label: `${teacher.lastName} ${teacher.firstName}` }))} />
                      </div>
                      <div className="mt-6 flex gap-3">
                        <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700">Отмена</button>
                        <button type="submit" className="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 font-semibold text-white">Создать</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {disciplines.length === 0 && !loading && (
          <div className="dashboard-card p-12 text-center">
            <p className="text-gray-500">Дисциплины не найдены</p>
          </div>
        )}
      </div>
    </div>
  )
}
