'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { slugify } from '@/lib/slug'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FieldHint } from '@/components/ui/field-hint'
import { Skeleton } from '@/components/ui/skeleton'
import { useProgressiveItems } from '@/lib/use-progressive-items'

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
  const [faculties, setFaculties] = useState<Array<{ id: string; name: string }>>([])
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([])
  const [showFacultyModal, setShowFacultyModal] = useState(false)
  const [showProgramModal, setShowProgramModal] = useState(false)
  const [facultyName, setFacultyName] = useState('')
  const [programName, setProgramName] = useState('')
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    course: 1,
    program: '',
    programId: '',
    faculty: '',
    facultyId: '',
    year: new Date().getFullYear()
  })
  const visibleGroups = useProgressiveItems(groups)

  useEffect(() => {
    fetchGroups()
    apiClient.get('/faculties').then(response => setFaculties(response.data?.faculties || []))
    apiClient.get('/faculties/programs').then(response => setPrograms(response.data?.programs || []))
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

  const handleCreateProgram = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const response = await apiClient.post('/faculties/programs', { name: programName })
      setPrograms(current => [...current, response.data.program].sort((a, b) => a.name.localeCompare(b.name)))
      setProgramName('')
      setShowProgramModal(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания направления')
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const selectedFaculty = faculties.find(faculty => faculty.id === formData.facultyId)
      await apiClient.post('/groups', { ...formData, faculty: selectedFaculty?.name || formData.faculty })
      setShowCreateModal(false)
      setFormData({
        name: '',
        course: 1,
        program: '',
        programId: '',
        faculty: '',
        facultyId: '',
        year: new Date().getFullYear()
      })
      fetchGroups()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка создания группы')
    }

  }

  const handleCreateFaculty = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const response = await apiClient.post('/faculties', { name: facultyName })
      setFaculties(current => [...current, response.data.faculty].sort((a, b) => a.name.localeCompare(b.name)))
      setFacultyName('')
      setShowFacultyModal(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания факультета')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await apiClient.delete(`/groups/${groupId}`)
      fetchGroups()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления группы')
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page min-h-screen p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between"><Skeleton className="h-10 w-72" /><Skeleton className="h-11 w-40 rounded-lg" /></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map(item => <Skeleton key={item} className="h-64 rounded-[1.25rem]" />)}</div>
        </div>
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
        {showFacultyModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => event.target === event.currentTarget && setShowFacultyModal(false)}>
            <form onSubmit={handleCreateFaculty} className="dashboard-card w-full max-w-md bg-white/95 p-6">
              <h2 className="mb-4 text-xl font-bold text-slate-950">Новый факультет</h2>
              <input required value={facultyName} onChange={event => setFacultyName(event.target.value)} placeholder="Название факультета" className="w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3" />
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setShowFacultyModal(false)} className="flex-1 rounded-xl border border-white/70 px-4 py-2.5 text-slate-700 hover:bg-white">Отмена</button>
                <button type="submit" className="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 font-semibold text-white hover:bg-[hsl(var(--primary-dark))]">Создать</button>
              </div>
            </form>
          </div>
        )}
        {showProgramModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => event.target === event.currentTarget && setShowProgramModal(false)}>
            <form onSubmit={handleCreateProgram} className="dashboard-card w-full max-w-md bg-white/95 p-6">
              <h2 className="mb-4 text-xl font-bold text-slate-950">Новое направление подготовки</h2>
              <input required value={programName} onChange={event => setProgramName(event.target.value)} placeholder="Название направления" className="w-full px-4 py-3" />
              <div className="mt-5 flex gap-3"><button type="button" onClick={() => setShowProgramModal(false)} className="flex-1 rounded-xl border px-4 py-2.5">Отмена</button><button type="submit" className="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 font-semibold text-white">Создать</button></div>
            </form>
          </div>
        )}

        {/* Сетка групп */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length > 0 && visibleGroups.length === 0 && [1, 2, 3].map(item => <Skeleton key={item} className="h-64 rounded-[1.25rem]" />)}
          {visibleGroups.map((group) => (
            <div key={group.id} className="dashboard-card-hover p-6">
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
                    onClick={() => setDeleteGroupId(group.id)}
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
          <div className="dashboard-card p-12 text-center">
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

      <ConfirmDialog
        open={Boolean(deleteGroupId)}
        title="Удалить группу?"
        message="Группа будет удалена. Убедитесь, что в ней нет студентов."
        confirmLabel="Удалить"
        danger
        onCancel={() => setDeleteGroupId(null)}
        onConfirm={() => {
          if (deleteGroupId) void handleDeleteGroup(deleteGroupId)
          setDeleteGroupId(null)
        }}
      />

      {/* Модальное окно создания группы */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6">
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
                  Направление подготовки * <FieldHint text="Выберите образовательную программу, по которой обучается группа." />
                </label>
                <div className="flex gap-2">
                  <Select required value={formData.programId} onChange={value => { const program = programs.find(item => item.id === value); setFormData({ ...formData, programId: value, program: program?.name || '' }) }} placeholder="Выберите направление" className="flex-1" options={programs.map(program => ({ value: program.id, label: program.name }))} />
                  <button type="button" onClick={() => setShowProgramModal(true)} className="rounded-xl border border-lavender-300 px-3 text-sm font-semibold text-lavender-800">+</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Факультет *
                </label>
                <div className="flex gap-2">
                  <Select required value={formData.facultyId} onChange={value => setFormData({ ...formData, facultyId: value })} placeholder="Выберите факультет" className="flex-1" options={faculties.map(faculty => ({ value: faculty.id, label: faculty.name }))} />
                  <button type="button" onClick={() => setShowFacultyModal(true)} className="rounded-xl border border-lavender-300 px-3 text-sm font-semibold text-lavender-800 transition hover:bg-lavender-100">+</button>
                </div>
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
