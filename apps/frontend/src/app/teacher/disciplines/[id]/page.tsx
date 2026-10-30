'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Discipline {
  id: string
  name: string
  description: string | null
  teachers: Array<{ teacher: { user: { firstName: string; lastName: string } } }>
  labWorks: Array<{
    id: string
    number: number
    title: string
    status: string
    dueDate: string | null
    _count: { submissions: number }
  }>
}

export default function TeacherDisciplinePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [discipline, setDiscipline] = useState<Discipline | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get(`/disciplines/${id}`)
      .then(response => setDiscipline(response.data?.discipline || null))
      .catch(() => setDiscipline(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="dashboard-page flex min-h-screen items-center justify-center text-slate-600">Загрузка...</div>
  if (!discipline) {
    return (
      <div className="dashboard-page flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-slate-600">Дисциплина не найдена</p>
          <Button onClick={() => router.push('/teacher/disciplines')}>К списку дисциплин</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <Link href="/teacher/disciplines" className="mb-6 inline-flex text-sm font-medium text-lavender-700 hover:text-lavender-900">
          ← Все дисциплины
        </Link>
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">Дисциплина</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">{discipline.name}</h1>
            {discipline.description && <p className="mt-2 max-w-2xl text-slate-600">{discipline.description}</p>}
            <p className="mt-3 text-sm text-slate-500">
              Преподаватели: {discipline.teachers.map(({ teacher }) => `${teacher.user.lastName} ${teacher.user.firstName}`).join(', ') || 'не указаны'}
            </p>
          </div>
          <Link href={`/teacher/lab-works/create?disciplineId=${discipline.id}`}>
            <Button className="gap-2">+ Создать лабораторную</Button>
          </Link>
        </div>

        {discipline.labWorks.length === 0 ? (
          <Card className="p-12 text-center text-slate-500">В этой дисциплине пока нет лабораторных работ.</Card>
        ) : (
          <div className="space-y-4">
            {discipline.labWorks.map(lab => (
              <Card key={lab.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <Badge>ЛР №{lab.number}</Badge>
                    <Badge variant={lab.status === 'PUBLISHED' ? 'accepted' : 'secondary'}>
                      {lab.status === 'PUBLISHED' ? 'Опубликована' : 'Черновик'}
                    </Badge>
                  </div>
                  <h2 className="font-semibold text-slate-900">{lab.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Сдано работ: {lab._count.submissions}
                    {lab.dueDate ? ` · срок ${new Date(lab.dueDate).toLocaleDateString('ru-RU')}` : ' · без срока'}
                  </p>
                </div>
                <Link href={`/teacher/submissions?labWorkId=${lab.id}`}>
                  <Button variant="outline">Открыть работы</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
