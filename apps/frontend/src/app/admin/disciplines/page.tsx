'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'

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

  const handleDeleteDiscipline = async (disciplineId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту дисциплину? В ней не должно быть лабораторных работ.')) return

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Управление дисциплинами</h1>
          <a
            href="/teacher/disciplines/create"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            + Создать дисциплину
          </a>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
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
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Все статусы</option>
                <option value="DRAFT">Черновик</option>
                <option value="PUBLISHED">Опубликована</option>
                <option value="ARCHIVED">Архивная</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Учебный год
              </label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Все годы</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Семестр
              </label>
              <select
                value={filters.semester}
                onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Все семестры</option>
                <option value="1">1 семестр</option>
                <option value="2">2 семестр</option>
                <option value="3">3 семестр</option>
                <option value="4">4 семестр</option>
                <option value="5">5 семестр</option>
                <option value="6">6 семестр</option>
                <option value="7">7 семестр</option>
                <option value="8">8 семестр</option>
              </select>
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
            <div key={discipline.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
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
                  <a
                    href={`/admin/disciplines/${discipline.id}`}
                    className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                  >
                    Подробнее
                  </a>
                  <button
                    onClick={() => handleDeleteDiscipline(discipline.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {disciplines.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Дисциплины не найдены</p>
          </div>
        )}
      </div>
    </div>
  )
}
