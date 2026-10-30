'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { slugify } from '@/lib/slug'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Group {
  name: string
  students: Array<{ id: string; user: { firstName: string; lastName: string; email: string } }>
  disciplines: Array<{ discipline: { id: string; name: string; semester: number; year: number } }>
}

export default function TeacherGroupPage() {
  const { id } = useParams<{ id: string }>()
  const [group, setGroup] = useState<Group | null>(null)
  useEffect(() => {
    apiClient.get(`/groups/${id}`).then(response => setGroup(response.data?.group || null))
  }, [id])

  if (!group) return <div className="dashboard-page flex min-h-screen items-center justify-center text-slate-600">Загрузка...</div>
  return (
    <div className="dashboard-page min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <Link href="/teacher/groups" className="text-sm font-medium text-lavender-700">← Все группы</Link>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">{group.name}</h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Дисциплины группы</h2>
            <div className="space-y-2">
              {group.disciplines.map(({ discipline }) => (
                <Link key={discipline.id} href={`/teacher/disciplines/${slugify(discipline.name)}`} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 hover:bg-lavender-50">
                  <span className="font-medium text-slate-800">{discipline.name}</span>
                  <Badge variant="secondary">Семестр {discipline.semester}</Badge>
                </Link>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Студенты ({group.students.length})</h2>
            <div className="space-y-2">
              {[...group.students].sort((a, b) => a.user.lastName.localeCompare(b.user.lastName, 'ru')).map(student => (
                <div key={student.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="font-medium text-slate-800">{student.user.lastName} {student.user.firstName}</p>
                  <p className="text-xs text-slate-500">{student.user.email}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
