'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { slugify } from '@/lib/slug'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

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

  useEffect(() => {
    apiClient.get(`/groups/${id}`)
      .then(response => setGroup(response.data?.group || null))
      .catch(err => setError(err.response?.data?.error || 'Не удалось загрузить группу'))
  }, [id])

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
            <h2 className="mb-4 text-lg font-semibold">Студенты ({group.students.length})</h2>
            <div className="space-y-2">
              {group.students.map(student => (
                <div key={student.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="font-medium text-slate-800">{student.user.lastName} {student.user.firstName}</p>
                  <p className="text-xs text-slate-500">{student.user.email}</p>
                </div>
              ))}
              {group.students.length === 0 && <p className="text-sm text-slate-500">Студенты не назначены.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
