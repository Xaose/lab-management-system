'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { slugify } from '@/lib/slug'
import { Select } from '@/components/ui/select'

interface Group {
  id: string
  name: string
  course: number
  program: string
  faculty: string
  year: number
  _count: {
    students: number
    disciplines: number
  }
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    course: 1,
    program: '',
    faculty: '',
    year: new Date().getFullYear()
  })

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/groups')
      setGroups(response.data.groups)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки групп')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post('/groups', formData)
      setShowCreateModal(false)
      setFormData({
        name: '',
        course: 1,
        program: '',
        faculty: '',
        year: new Date().getFullYear()
      })
      fetchGroups()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка создания группы')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту группу? В ней не должно быть студентов.')) return

    try {
      await apiClient.delete(`/groups/${groupId}`)
      fetchGroups()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления группы')
    }
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Управление группами</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            + Создать группу
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Сетка групп */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-500">Курс {group.course}</p>
                </div>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                  {group.year}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Программа:</span>
                  <p className="text-gray-600">{group.program}</p>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Факультет:</span>
                  <p className="text-gray-600">{group.faculty}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">{group._count.students}</span> студентов
                  </div>
                  <div>
                    <span className="font-medium">{group._count.disciplines}</span> дисциплин
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/admin/groups/${slugify(group.name)}`} className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                    Подробнее
                  </Link>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Группы не найдены</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Создать первую группу
            </button>
          </div>
        )}
      </div>

      {/* Модальное окно создания группы */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Создать группу</h2>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название группы *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ИС-21"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Курс *
                </label>
                <Select required value={String(formData.course)} onChange={value => setFormData({ ...formData, course: Number(value) })} options={[1, 2, 3, 4, 5, 6].map(course => ({ value: String(course), label: `${course} курс` }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Направление подготовки *
                </label>
                <input
                  type="text"
                  required
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  placeholder="Информационные системы и технологии"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Факультет *
                </label>
                <input
                  type="text"
                  required
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                  placeholder="Факультет информационных технологий"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Год начала обучения *
                </label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  min={2020}
                  max={2030}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
