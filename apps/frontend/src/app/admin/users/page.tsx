'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FieldHint } from '@/components/ui/field-hint'

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
  programId: string
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
    position?: string | null
    department: string
    disciplinesTeaching?: Array<{ discipline: { name: string } }>
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
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editData, setEditData] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [creating, setCreating] = useState(false)
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([])
  const [createError, setCreateError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'block' | 'delete'; userId: string } | null>(null)
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
    programId: '',
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
    apiClient.get('/faculties/programs').then(response => setPrograms(response.data?.programs || []))
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
      programId: '',
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
    try {
      await apiClient.delete(`/users/${userId}`)
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка блокировки пользователя')
    }
  }

  const handleEditUser = async (user: User) => {
    setEditUser(user)
    setEditData({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone || '' })
  }

  const saveEditedUser = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editUser) return
    try {
      await apiClient.put(`/users/${editUser.id}`, editData)
      setEditUser(null)
      await fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка редактирования пользователя')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiClient.delete(`/users/${userId}?permanent=true`)
      await fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления пользователя')
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
          <div className="custom-scrollbar overflow-x-auto overscroll-x-contain">
            <table className="w-full table-fixed divide-y divide-[hsl(var(--border-light))]">
              <thead className="bg-lavender-50/50">
                <tr>
                  <th className="w-[22%] px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="w-[20%] px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="w-[13%] px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="w-[20%] px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Доп. информация
                  </th>
                  <th className="w-[12%] px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="w-[13%] px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                          <div className="font-medium text-slate-900">Группа: {user.student.group?.name || 'Без группы'}</div>
                          <div className="text-[hsl(var(--foreground-secondary))]">Курс: {user.student.course}</div>
                          <div className="text-[hsl(var(--foreground-secondary))]">№ {user.student.studentIdNumber}</div>
                        </div>
                      )}
                      {user.teacher && (
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">
                            {user.teacher.disciplinesTeaching?.length
                              ? `Преподаватель: ${user.teacher.disciplinesTeaching.map(item => item.discipline.name).join(', ')}`
                              : 'Преподаватель'}
                          </div>
                          <div className="text-[hsl(var(--foreground-secondary))]">{user.teacher.department}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
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
                            onClick={() => setConfirmAction({ type: 'block', userId: user.id })}
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
                        <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: 'delete', userId: user.id })} className="text-red-700 hover:bg-red-100 hover:text-red-800">
                          Удалить
                        </Button>
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

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.type === 'delete' ? 'Удалить пользователя?' : 'Заблокировать пользователя?'}
        message={confirmAction?.type === 'delete' ? 'Удаление будет постоянным и восстановить пользователя будет невозможно.' : 'Пользователь потеряет доступ к системе до разблокировки.'}
        confirmLabel={confirmAction?.type === 'delete' ? 'Удалить навсегда' : 'Заблокировать'}
        danger
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return
          if (confirmAction.type === 'delete') void handleDeleteUser(confirmAction.userId)
          else void handleBlockUser(confirmAction.userId)
          setConfirmAction(null)
        }}
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !creating) { setShowCreateModal(false); resetCreateForm() }
        }}>
          <div className="custom-scrollbar max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Создать пользователя</h2>
                <p className="mt-1 text-sm text-slate-500">Заполните данные новой учётной записи</p>
              </div>
              <button type="button" onClick={() => { setShowCreateModal(false); resetCreateForm() }} disabled={creating} className="text-2xl leading-none text-slate-400 hover:text-slate-700" aria-label="Закрыть">
                ×
              </button>
            </div>

            {createError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{createError}</div>}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-1 block text-sm font-medium">Email * <FieldHint text="Используется для входа в систему." /></span><Input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></label>
                <label><span className="mb-1 block text-sm font-medium">Пароль * <FieldHint text="Не менее 6 символов." /></span><Input required minLength={6} type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} /></label>
                <label><span className="mb-1 block text-sm font-medium">Имя * <FieldHint text="Имя пользователя." /></span><Input required value={formData.firstName} onChange={(event) => setFormData({ ...formData, firstName: event.target.value })} /></label>
                <label><span className="mb-1 block text-sm font-medium">Фамилия * <FieldHint text="Фамилия пользователя." /></span><Input required value={formData.lastName} onChange={(event) => setFormData({ ...formData, lastName: event.target.value })} /></label>
                <Input placeholder="Отчество" value={formData.patronymic} onChange={(event) => setFormData({ ...formData, patronymic: event.target.value })} />
                <Input placeholder="Телефон" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Роль *</label>
                <Select required value={formData.role} onChange={value => setFormData({ ...formData, role: value as CreateUserRole })} options={[{ value: 'STUDENT', label: 'Студент' }, { value: 'TEACHER', label: 'Преподаватель' }, { value: 'ADMIN', label: 'Администратор' }]} />
              </div>

              {formData.role === 'STUDENT' && (
                <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <label><span className="mb-1 block text-sm font-medium">Номер зачётной книжки * <FieldHint text="Уникальный номер студенческого документа." /></span><Input required value={formData.studentIdNumber} onChange={(event) => setFormData({ ...formData, studentIdNumber: event.target.value })} /></label>
                  <Select required value={formData.groupId} onChange={value => setFormData({ ...formData, groupId: value })} placeholder="Выберите группу *" options={groups.map(group => ({ value: group.id, label: group.name }))} />
                  <Select required value={String(formData.course)} onChange={value => setFormData({ ...formData, course: Number(value) })} options={[1, 2, 3, 4, 5, 6].map(course => ({ value: String(course), label: `${course} курс` }))} />
                  <label className="block"><span className="mb-1 block text-sm font-medium">Направление подготовки * <FieldHint text="Выберите образовательную программу студента." /></span><Select required value={formData.programId} onChange={value => { const program = programs.find(item => item.id === value); setFormData({ ...formData, programId: value, program: program?.name || '' }) }} placeholder="Выберите направление" options={programs.map(program => ({ value: program.id, label: program.name }))} /></label>
                  <label><span className="mb-1 block text-sm font-medium">Факультет * <FieldHint text="Факультет, на котором обучается студент." /></span><Input required value={formData.faculty} onChange={(event) => setFormData({ ...formData, faculty: event.target.value })} /></label>
                </div>
              )}

              {editUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => event.target === event.currentTarget && setEditUser(null)}>
                  <form onSubmit={saveEditedUser} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                    <h2 className="mb-5 text-2xl font-bold text-slate-950">Редактирование пользователя</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium">Имя<Input required value={editData.firstName} onChange={event => setEditData({ ...editData, firstName: event.target.value })} /></label>
                      <label className="text-sm font-medium">Фамилия<Input required value={editData.lastName} onChange={event => setEditData({ ...editData, lastName: event.target.value })} /></label>
                      <label className="text-sm font-medium sm:col-span-2">Email<Input required type="email" value={editData.email} onChange={event => setEditData({ ...editData, email: event.target.value })} /></label>
                      <label className="text-sm font-medium sm:col-span-2">Телефон<Input value={editData.phone} onChange={event => setEditData({ ...editData, phone: event.target.value })} /></label>
                    </div>
                    <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setEditUser(null)}>Отмена</Button><Button type="submit">Сохранить</Button></div>
                  </form>
                </div>
              )}
              {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => event.target === event.currentTarget && setEditUser(null)}>
                  <form onSubmit={saveEditedUser} className="dashboard-card w-full max-w-lg bg-white/95 p-6 animate-fade-in-scale">
                    <h2 className="mb-5 text-2xl font-bold text-slate-950">Редактировать пользователя</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input required placeholder="Имя" value={editData.firstName} onChange={event => setEditData({ ...editData, firstName: event.target.value })} />
                      <Input required placeholder="Фамилия" value={editData.lastName} onChange={event => setEditData({ ...editData, lastName: event.target.value })} />
                      <Input required type="email" placeholder="Email" value={editData.email} onChange={event => setEditData({ ...editData, email: event.target.value })} />
                      <Input placeholder="Телефон" value={editData.phone} onChange={event => setEditData({ ...editData, phone: event.target.value })} />
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setEditUser(null)}>Отмена</Button>
                      <Button type="submit" className="flex-1">Сохранить</Button>
                    </div>
                  </form>
                </div>
              )}

              {formData.role === 'TEACHER' && (
                <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <Input placeholder="Должность (не заполняется)" value={formData.position} onChange={(event) => setFormData({ ...formData, position: event.target.value })} />
                  <label><span className="mb-1 block text-sm font-medium">Кафедра * <FieldHint text="Кафедра преподавателя." /></span><Input required value={formData.department} onChange={(event) => setFormData({ ...formData, department: event.target.value })} /></label>
                  <Input placeholder="Учёная степень" value={formData.degree} onChange={(event) => setFormData({ ...formData, degree: event.target.value })} />
                  <Input placeholder="Учёное звание" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} />
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); resetCreateForm() }} disabled={creating}>Отмена</Button>
                <Button type="submit" disabled={creating}>{creating ? 'Создание...' : 'Создать пользователя'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
