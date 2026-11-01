'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { slugify } from '@/lib/slug'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

interface Discipline {
  id: string
  name: string
  description: string | null
  semester: number
  year: number
  hours: number
  status: string
  createdBy: { user: { firstName: string; lastName: string; email: string } }
  teachers: Array<{ teacher: { id: string; user: { firstName: string; lastName: string; email: string } } }>
  groups: Array<{ group: { id: string; name: string; course: number }; semester: number; year: number }>
  labWorks: Array<{ id: string; number: number; title: string; status: string; dueDate: string | null }>
}

interface GroupOption {
  id: string
  name: string
}

export default function AdminDisciplineDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [discipline, setDiscipline] = useState<Discipline | null>(null)
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [groupId, setGroupId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [teachers, setTeachers] = useState<Array<{ id: string; label: string }>>([])
  const [teacherId, setTeacherId] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [disciplineResponse, groupsResponse, teachersResponse] = await Promise.all([
        apiClient.get(`/disciplines/${id}`),
        apiClient.get('/groups'),
        apiClient.get('/users?role=TEACHER')
      ])
      setDiscipline(disciplineResponse.data?.discipline || null)
      setGroups(groupsResponse.data?.groups || [])
      setTeachers((teachersResponse.data?.users || []).filter((user: any) => user.teacher?.id).map((user: any) => ({ id: user.teacher.id, label: `${user.lastName} ${user.firstName}` })))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось загрузить дисциплину')
    }

  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const assignGroup = async () => {
    if (!groupId || !discipline) return
    setSaving(true)
    setError('')
    try {
      await apiClient.post(`/disciplines/${discipline.id}/groups`, {
        groups: [{ groupId, semester: discipline.semester, year: discipline.year }]
      })
      setGroupId('')
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось назначить группу')
    } finally {
      setSaving(false)
    }

  }

  const assignTeacher = async () => {
    if (!teacherId || !discipline) return
    setSaving(true)
    setError('')
    try {
      await apiClient.post(`/disciplines/${discipline.id}/teachers`, { teacherIds: [teacherId] })
      setTeacherId('')
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось назначить преподавателя')
    } finally {
      setSaving(false)
    }
  }

  if (error && !discipline) return <div className="dashboard-page flex min-h-screen items-center justify-center text-red-600">{error}</div>
  if (!discipline) return <div className="dashboard-page flex min-h-screen items-center justify-center text-slate-600">Загрузка...</div>

  return (
    <div className="dashboard-page min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <Link href="/admin/disciplines" className="text-sm font-medium text-lavender-700">← Все дисциплины</Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">{discipline.name}</h1>
            {discipline.description && <p className="mt-2 max-w-2xl text-slate-600">{discipline.description}</p>}
          </div>
          <Badge variant={discipline.status === 'PUBLISHED' ? 'accepted' : 'secondary'}>{discipline.status === 'PUBLISHED' ? 'Опубликована' : 'Черновик'}</Badge>
        </div>

        {error && <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Информация</h2>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-slate-500">Семестр</dt><dd className="font-medium">{discipline.semester}</dd></div>
              <div><dt className="text-slate-500">Учебный год</dt><dd className="font-medium">{discipline.year}</dd></div>
              <div><dt className="text-slate-500">Часы</dt><dd className="font-medium">{discipline.hours}</dd></div>
              <div><dt className="text-slate-500">Создатель</dt><dd className="font-medium">{discipline.createdBy.user.lastName} {discipline.createdBy.user.firstName}</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Ответственные преподаватели</h2>
            <div className="mb-4 space-y-2">
              {discipline.teachers.map(({ teacher }) => <div key={teacher.id} className="rounded-xl bg-slate-50 p-3 font-medium">{teacher.user.lastName} {teacher.user.firstName}</div>)}
              {discipline.teachers.length === 0 && <p className="text-sm text-slate-500">Преподаватели не назначены.</p>}
            </div>
            <div className="flex gap-2"><Select value={teacherId} onChange={setTeacherId} placeholder="Выберите преподавателя" className="min-w-0 flex-1" options={teachers.filter(teacher => !discipline.teachers.some(item => item.teacher.id === teacher.id)).map(teacher => ({ value: teacher.id, label: teacher.label }))} /><Button size="sm" onClick={assignTeacher} disabled={!teacherId || saving}>Назначить</Button></div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Назначенные группы</h2>
            <div className="mb-4 space-y-2">
              {discipline.groups.map(({ group }) => (
                <Link key={group.id} href={`/admin/groups/${slugify(group.name)}`} className="block rounded-xl bg-slate-50 p-3 font-medium hover:bg-lavender-50">{group.name} · {group.course} курс</Link>
              ))}
              {discipline.groups.length === 0 && <p className="text-sm text-slate-500">Группы не назначены. Без назначения студенты не увидят работу.</p>}
            </div>
            <div className="flex gap-2">
              <Select value={groupId} onChange={setGroupId} placeholder="Выберите группу" className="min-w-0 flex-1" options={groups.filter(group => !discipline.groups.some(item => item.group.id === group.id)).map(group => ({ value: group.id, label: group.name }))} />
              <Button size="sm" onClick={assignGroup} disabled={!groupId || saving}>{saving ? '...' : 'Назначить'}</Button>
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-5">
          <h2 className="mb-4 text-lg font-semibold">Лабораторные работы ({discipline.labWorks.length})</h2>
          <div className="space-y-2">
            {discipline.labWorks.map(lab => (
              <div key={lab.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <span className="font-medium">ЛР №{lab.number} · {lab.title}</span>
                <Badge variant={lab.status === 'PUBLISHED' ? 'accepted' : 'secondary'}>{lab.status === 'PUBLISHED' ? 'Опубликована' : 'Черновик'}</Badge>
              </div>
            ))}
            {discipline.labWorks.length === 0 && <p className="text-sm text-slate-500">Лабораторных работ пока нет.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
