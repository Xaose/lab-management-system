'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface Submission {
  id: string
  status: string
  attemptNumber: number
  submittedAt: string | null
  isLate: boolean
  student: { user: { firstName: string; lastName: string; email: string }; group: { name: string } }
  labWork: { id: string; number: number; title: string; maxScore: number; discipline: { name: string } }
  reviews: Array<{ score: number | null; result: string }>
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Отправлена',
  IN_REVIEW: 'На проверке',
  REVIEWED: 'Проверена',
  REVISION: 'На доработку'
}

const statusVariants: Record<string, 'secondary' | 'review' | 'accepted' | 'pending' | 'rejected'> = {
  DRAFT: 'secondary',
  SUBMITTED: 'review',
  IN_REVIEW: 'pending',
  REVIEWED: 'accepted',
  REVISION: 'pending'
}

export default function TeacherSubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    const loadSubmissions = async () => {
      try {
        setLoading(true)
        const labWorkId = new URLSearchParams(window.location.search).get('labWorkId')
        const response = await apiClient.get(labWorkId
          ? `/submissions?labWorkId=${encodeURIComponent(labWorkId)}`
          : '/submissions')
        if (active) setSubmissions(response.data?.submissions || [])
      } catch {
        if (active) setError('Не удалось загрузить список работ. Попробуйте обновить страницу.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadSubmissions()
    return () => { active = false }
  }, [])

  const counts = useMemo(() => ({
    all: submissions.length,
    pending: submissions.filter(item => item.status === 'SUBMITTED' || item.status === 'IN_REVIEW').length,
    reviewed: submissions.filter(item => item.status === 'REVIEWED').length
  }), [submissions])

  const filteredSubmissions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU')
    return submissions.filter(submission => {
      const matchesFilter = filter === 'all' ||
        (filter === 'pending' && (submission.status === 'SUBMITTED' || submission.status === 'IN_REVIEW')) ||
        (filter === 'reviewed' && submission.status === 'REVIEWED')
      const searchableText = [
        submission.student.user.lastName,
        submission.student.user.firstName,
        submission.student.user.email,
        submission.student.group.name,
        submission.labWork.title,
        submission.labWork.discipline.name
      ].join(' ').toLocaleLowerCase('ru-RU')
      return matchesFilter && searchableText.includes(normalizedQuery)
    })
  }, [filter, query, submissions])

  if (loading) {
    return (
      <div className="dashboard-page min-h-screen">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
          <Skeleton className="mb-3 h-4 w-36" />
          <Skeleton className="mb-8 h-10 w-72" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">Рабочее пространство преподавателя</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Проверка работ</h1>
            <p className="mt-2 text-slate-600">Сданные работы студентов и текущий статус проверки.</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>Обновить</Button>
        </div>

        <Card className="mb-6 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {([
                ['all', `Все (${counts.all})`],
                ['pending', `На проверке (${counts.pending})`],
                ['reviewed', `Проверено (${counts.reviewed})`]
              ] as const).map(([value, label]) => (
                <Button key={value} size="sm" variant={filter === value ? 'default' : 'secondary'} onClick={() => setFilter(value)}>
                  {label}
                </Button>
              ))}
            </div>
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Поиск по студенту, группе или работе"
              className="lg:max-w-sm"
              aria-label="Поиск работ"
            />
          </div>
        </Card>

        {error && <Card className="mb-6 border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>}

        {filteredSubmissions.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender-50 text-2xl">✓</div>
            <p className="font-medium text-slate-700">{query ? 'По вашему запросу ничего не найдено' : 'Нет работ для отображения'}</p>
            {query && <button className="mt-2 text-sm text-lavender-700 hover:text-lavender-900" onClick={() => setQuery('')}>Очистить поиск</button>}
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full">
                <thead className="bg-white/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>{['Студент', 'Работа', 'Статус', 'Оценка', 'Сдано', ''].map((heading, index) => <th key={index} className="px-5 py-4">{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map(submission => (
                    <tr key={submission.id} className="transition hover:bg-lavender-50/40">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{submission.student.user.lastName} {submission.student.user.firstName}</p>
                        <p className="text-xs text-slate-500">{submission.student.group.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{submission.labWork.discipline.name}</p>
                        <p className="text-xs text-slate-500">ЛР №{submission.labWork.number}: {submission.labWork.title}</p>
                      </td>
                      <td className="px-5 py-4"><Badge variant={statusVariants[submission.status] || 'secondary'}>{statusLabels[submission.status] || submission.status}</Badge>{submission.isLate && <p className="mt-1 text-xs text-red-600">Просрочено</p>}</td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">{submission.reviews[0]?.score ?? '—'}{submission.reviews[0]?.score !== undefined && ` / ${submission.labWork.maxScore}`}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('ru-RU') : '—'}</td>
                      <td className="px-5 py-4 text-right"><Button size="sm" variant="outline" onClick={() => router.push(`/teacher/submissions/${submission.id}`)}>{submission.status === 'REVIEWED' ? 'Открыть' : 'Проверить'}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 md:hidden">
              {filteredSubmissions.map(submission => (
                <button key={submission.id} onClick={() => router.push(`/teacher/submissions/${submission.id}`)} className="w-full rounded-2xl border border-slate-100 bg-white/70 p-4 text-left shadow-soft transition hover:border-lavender-200 hover:bg-lavender-50/40">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{submission.student.user.lastName} {submission.student.user.firstName}</p><p className="mt-1 text-xs text-slate-500">{submission.student.group.name} · ЛР №{submission.labWork.number}</p></div><Badge variant={statusVariants[submission.status] || 'secondary'}>{statusLabels[submission.status] || submission.status}</Badge></div>
                  <p className="mt-3 text-sm text-slate-700">{submission.labWork.title}</p>
                  <p className="mt-2 text-xs text-slate-500">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('ru-RU') : 'Дата не указана'}</p>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
