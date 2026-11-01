'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { slugify } from '@/lib/slug'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Group {
  id: string
  name: string
  course: number
  program: string
  faculty: string
  year: number
  students: Array<{ id: string; user: { firstName: string; lastName: string; email: string; status: string } }>
  disciplines: Array<{ discipline: { id: string; name: string; semester: number; year: number; status: string } }>
}

export default function AdminGroupDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [studentData, setStudentData] = useState({ email: '', password: '', firstName: '', lastName: '', studentIdNumber: '', course: 1, program: '', faculty: '' })
  const [savingStudent, setSavingStudent] = useState(false)

  useEffect(() => {
    apiClient.get(`/groups/${id}`)
      .then(response => setGroup(response.data?.group || null))
      .catch(err => setError(err.response?.data?.error || 'Не удалось загрузить группу'))
  }, [id])

  const removeStudent = async (studentId: string) => {
    setRemoving(studentId)
    try {
      await apiClient.delete(`/groups/${id}/students/${studentId}`)
      setGroup(current => current ? { ...current, students: current.students.filter(student => student.id !== studentId) } : current)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось удалить студента из группы')
    } finally {
      setRemoving(null)
    }

  }

  const createStudent = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!group) return
    setSavingStudent(true)
    setError('')
    try {
      await apiClient.post('/users', { ...studentData, role: 'STUDENT', studentData: { studentIdNumber: studentData.studentIdNumber, groupId: group.id, course: studentData.course, program: studentData.program || group.program, faculty: studentData.faculty || group.faculty } })
      const response = await apiClient.get(`/groups/${id}`)
      setGroup(response.data?.group || null)
      setShowStudentModal(false)
      setStudentData({ email: '', password: '', firstName: '', lastName: '', studentIdNumber: '', course: group.course, program: group.program, faculty: group.faculty })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось создать студента')
    } finally {
      setSavingStudent(false)
    }
  }

  if (error) return <div className="dashboard-page flex min-h-screen items-center justify-center text-red-600">{error}</div>
  if (!group) return <div className="dashboard-page flex min-h-screen items-center justify-center text-slate-600">Загрузка...</div>

  return (
    <div className="dashboard-page min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <Link href="/admin/groups" className="text-sm font-medium text-lavender-700">← Все группы</Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">{group.name}</h1>
            <p className="mt-2 text-slate-600">{group.program} · {group.faculty}</p>
          </div>
          <Badge variant="secondary">{group.course} курс · {group.year}</Badge>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Дисциплины ({group.disciplines.length})</h2>
            <div className="space-y-2">
              {group.disciplines.map(({ discipline }) => (
                <Link key={discipline.id} href={`/admin/disciplines/${slugify(discipline.name)}`} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 hover:bg-lavender-50">
                  <span className="font-medium text-slate-800">{discipline.name}</span>
                  <Badge variant="secondary">{discipline.status === 'PUBLISHED' ? 'Опубликована' : 'Черновик'}</Badge>
                </Link>
              ))}
              {group.disciplines.length === 0 && <p className="text-sm text-slate-500">Дисциплины не назначены.</p>}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Студенты ({group.students.length})</h2><Button size="sm" onClick={() => { setStudentData(current => ({ ...current, course: group.course, program: group.program, faculty: group.faculty })); setShowStudentModal(true) }}>+ Добавить</Button></div>
            <div className="space-y-2">
              {group.students.map(student => (
                <div key={student.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                  <div><p className="font-medium text-slate-800">{student.user.lastName} {student.user.firstName}</p><p className="text-xs text-slate-500">{student.user.email}</p></div>
                  <button onClick={() => removeStudent(student.id)} disabled={removing === student.id} className="text-xs font-medium text-red-600 hover:text-red-800">{removing === student.id ? '...' : 'Удалить'}</button>
                </div>
              ))}
              {group.students.length === 0 && <p className="text-sm text-slate-500">Студенты не назначены.</p>}
            </div>
          </Card>
        </div>
        {showStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <form onSubmit={createStudent} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="mb-5 text-2xl font-bold">Новый студент группы</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input required type="email" placeholder="Email *" value={studentData.email} onChange={e => setStudentData({ ...studentData, email: e.target.value })} />
                <Input required minLength={6} type="password" placeholder="Пароль *" value={studentData.password} onChange={e => setStudentData({ ...studentData, password: e.target.value })} />
                <Input required placeholder="Имя *" value={studentData.firstName} onChange={e => setStudentData({ ...studentData, firstName: e.target.value })} />
                <Input required placeholder="Фамилия *" value={studentData.lastName} onChange={e => setStudentData({ ...studentData, lastName: e.target.value })} />
                <Input required placeholder="Номер зачётной книжки *" value={studentData.studentIdNumber} onChange={e => setStudentData({ ...studentData, studentIdNumber: e.target.value })} />
                <Input required type="number" min={1} max={6} placeholder="Курс" value={studentData.course} onChange={e => setStudentData({ ...studentData, course: Number(e.target.value) })} />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><Input placeholder={`Направление (${group.program})`} value={studentData.program} onChange={e => setStudentData({ ...studentData, program: e.target.value })} /><Input placeholder={`Факультет (${group.faculty})`} value={studentData.faculty} onChange={e => setStudentData({ ...studentData, faculty: e.target.value })} /></div>
              <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowStudentModal(false)}>Отмена</Button><Button type="submit" disabled={savingStudent}>{savingStudent ? 'Создание...' : 'Создать студента'}</Button></div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
