'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select } from '@/components/ui/select'

type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'
type UserStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE'
type CreateUserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

interface CreateUserForm {
  email: string
  password: string
  firstName: string
  lastName: string
  patronymic: string
  phone: string
  role: CreateUserRole
  studentIdNumber: string
  groupId: string
  course: number
  program: string
  faculty: string
  position: string
  department: string
  degree: string
  title: string
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  patronymic?: string
  phone?: string
  role: UserRole
  status: UserStatus
  createdAt: string
  student?: {
    id: string
    studentIdNumber: string
    course: number
    group: {
      id: string
      name: string
    }
  }
  teacher?: {
    id: string
    position: string
    department: string
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [createError, setCreateError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    patronymic: '',
    phone: '',
    role: 'STUDENT',
    studentIdNumber: '',
    groupId: '',
    course: 1,
    program: '',
    faculty: '',
    position: '',
    department: '',
    degree: '',
    title: ''
  })

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.role) params.append('role', filters.role)
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      const response = await apiClient.get(`/users?${params.toString()}`)
      setUsers(response.data.users)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка загрузки пользователей')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (!showCreateModal || formData.role !== 'STUDENT') return

    apiClient.get('/groups').then((response) => {
      setGroups(response.data?.groups || [])
    }).catch((err: any) => {
      setCreateError(err.response?.data?.error || 'Ошибка загрузки групп')
    })
  }, [showCreateModal, formData.role])

  const resetCreateForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      patronymic: '',
      phone: '',
      role: 'STUDENT',
      studentIdNumber: '',
      groupId: '',
      course: 1,
      program: '',
      faculty: '',
      position: '',
      department: '',
      degree: '',
      title: ''
    })
    setCreateError(null)
  }

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreating(true)
    setCreateError(null)

    const data = {
      email: formData.email.trim(),
      password: formData.password,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      patronymic: formData.patronymic.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      role: formData.role,
      ...(formData.role === 'STUDENT'
        ? {
            studentData: {
              studentIdNumber: formData.studentIdNumber.trim(),
              groupId: formData.groupId,
              course: formData.course,
              program: formData.program.trim(),
              faculty: formData.faculty.trim()
            }
          }
        : {}),
      ...(formData.role === 'TEACHER'
        ? {
            teacherData: {
              position: formData.position.trim(),
              department: formData.department.trim(),
              degree: formData.degree.trim() || undefined,
              title: formData.title.trim() || undefined
            }
          }
        : {})
    }

    try {
      await apiClient.post('/users', data)
      setShowCreateModal(false)
      resetCreateForm()
      await fetchUsers()
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Ошибка создания пользователя')
    } finally {
      setCreating(false)
    }
  }

  const handleBlockUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите заблокировать этого пользователя?')) return

    try {
      await apiClient.delete(`/users/${userId}`)
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка блокировки пользователя')
    }
  }

  const handleEditUser = async (user: User) => {
    const firstName = window.prompt('Имя', user.firstName)
    if (firstName === null) return
    const lastName = window.prompt('Фамилия', user.lastName)
    if (lastName === null) return

    try {
      await apiClient.put(`/users/${user.id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      })
      await fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка редактирования пользователя')
    }
  }

  const handleUnblockUser = async (userId: string) => {
    try {
      await apiClient.put(`/users/${userId}`, { status: 'ACTIVE' })
      await fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка разблокировки пользователя')
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      STUDENT: { variant: 'review' as const, label: 'Студент' },
      TEACHER: { variant: 'accepted' as const, label: 'Преподаватель' },
      ADMIN: { variant: 'default' as const, label: 'Администратор' }
    }
    const config = variants[role]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusBadge = (status: UserStatus) => {
    const variants = {
      ACTIVE: { variant: 'accepted' as const, label: 'Активен' },
      BLOCKED: { variant: 'rejected' as const, label: 'Заблокирован' },
      INACTIVE: { variant: 'secondary' as const, label: 'Неактивен' }
    }
    const config = variants[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading && users.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
          <div className="mb-10">
            <Skeleton className="mb-4 h-10 w-80" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Card className="p-6">
            <Skeleton className="mb-4 h-40" />
            <Skeleton className="h-96" />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between animate-fade-in">
          <div>
            <Badge variant="secondary" className="mb-3 shadow-soft">Управление системой</Badge>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-950">Пользователи</h1>
            <p className="text-base text-[hsl(var(--foreground-secondary))]">
              Управление учётными записями студентов, преподавателей и администраторов
            </p>
          </div>
          <Button size="lg" onClick={() => { setCreateError(null); setShowCreateModal(true) }} className="gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Создать пользователя
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-soft animate-fade-in">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <Card className="mb-6 p-6 animate-fade-in stagger-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Поиск</label>
              <Input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Email, имя или фамилия"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Роль</label>
              <Select value={filters.role} onChange={value => setFilters({ ...filters, role: value })} options={[{ value: '', label: 'Все роли' }, { value: 'STUDENT', label: 'Студент' }, { value: 'TEACHER', label: 'Преподаватель' }, { value: 'ADMIN', label: 'Администратор' }]} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Статус</label>
              <Select value={filters.status} onChange={value => setFilters({ ...filters, status: value })} options={[{ value: '', label: 'Все статусы' }, { value: 'ACTIVE', label: 'Активен' }, { value: 'BLOCKED', label: 'Заблокирован' }, { value: 'INACTIVE', label: 'Неактивен' }]} />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ role: '', status: '', search: '' })}
                className="w-full"
              >
                Сбросить
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden animate-fade-in stagger-2">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[hsl(var(--border-light))]">
              <thead className="bg-lavender-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Доп. информация
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border-light))]">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-lavender-50/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">
                        {user.lastName} {user.firstName} {user.patronymic}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-[hsl(var(--foreground-secondary))]">{user.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {user.student && (
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">Группа: {user.student.group.name}</div>
                          <div className="text-[hsl(var(--foreground-secondary))]">Курс: {user.student.course}</div>
                          <div className="text-[hsl(var(--foreground-secondary))]">№ {user.student.studentIdNumber}</div>
                        </div>
                      )}
                      {user.teacher && (
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">{user.teacher.position}</div>
                          <div className="text-[hsl(var(--foreground-secondary))]">{user.teacher.department}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          Редактировать
                        </Button>
                        {user.status === 'ACTIVE' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBlockUser(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Заблокировать
                          </Button>
                        )}
                        {user.status === 'BLOCKED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnblockUser(user.id)}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            Разблокировать
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lavender-50">
                  <svg className="h-8 w-8 text-lavender-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-base font-medium text-slate-700">Пользователи не найдены</p>
                <p className="mt-1 text-sm text-[hsl(var(--foreground-secondary))]">
                  Попробуйте изменить параметры фильтрации
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !creating) setShowCreateModal(false)
        }}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Создать пользователя</h2>
                <p className="mt-1 text-sm text-slate-500">Заполните данные новой учётной записи</p>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} disabled={creating} className="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Закрыть">
                ×
              </button>
            </div>

            {createError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{createError}</div>}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input required type="email" placeholder="Email *" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} />
                <Input required minLength={6} type="password" placeholder="Пароль *" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} />
                <Input required placeholder="Имя *" value={formData.firstName} onChange={(event) => setFormData({ ...formData, firstName: event.target.value })} />
                <Input required placeholder="Фамилия *" value={formData.lastName} onChange={(event) => setFormData({ ...formData, lastName: event.target.value })} />
                <Input placeholder="Отчество" value={formData.patronymic} onChange={(event) => setFormData({ ...formData, patronymic: event.target.value })} />
                <Input placeholder="Телефон" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Роль *</label>
                <Select required value={formData.role} onChange={value => setFormData({ ...formData, role: value as CreateUserRole })} options={[{ value: 'STUDENT', label: 'Студент' }, { value: 'TEACHER', label: 'Преподаватель' }, { value: 'ADMIN', label: 'Администратор' }]} />
              </div>

              {formData.role === 'STUDENT' && (
                <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <Input required placeholder="Номер зачётной книжки *" value={formData.studentIdNumber} onChange={(event) => setFormData({ ...formData, studentIdNumber: event.target.value })} />
                  <Select required value={formData.groupId} onChange={value => setFormData({ ...formData, groupId: value })} placeholder="Выберите группу *" options={groups.map(group => ({ value: group.id, label: group.name }))} />
                  <Select required value={String(formData.course)} onChange={value => setFormData({ ...formData, course: Number(value) })} options={[1, 2, 3, 4, 5, 6].map(course => ({ value: String(course), label: `${course} курс` }))} />
                  <Input required placeholder="Направление подготовки *" value={formData.program} onChange={(event) => setFormData({ ...formData, program: event.target.value })} />
                  <Input required placeholder="Факультет *" value={formData.faculty} onChange={(event) => setFormData({ ...formData, faculty: event.target.value })} />
                </div>
              )}

              {formData.role === 'TEACHER' && (
                <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <Input required placeholder="Должность *" value={formData.position} onChange={(event) => setFormData({ ...formData, position: event.target.value })} />
                  <Input required placeholder="Кафедра *" value={formData.department} onChange={(event) => setFormData({ ...formData, department: event.target.value })} />
                  <Input placeholder="Учёная степень" value={formData.degree} onChange={(event) => setFormData({ ...formData, degree: event.target.value })} />
                  <Input placeholder="Учёное звание" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} />
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={creating}>Отмена</Button>
                <Button type="submit" disabled={creating}>{creating ? 'Создание...' : 'Создать пользователя'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
