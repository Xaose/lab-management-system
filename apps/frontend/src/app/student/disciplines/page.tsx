'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { slugify } from '@/lib/slug'
import { Card, CardHover } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useProgressiveItems } from '@/lib/use-progressive-items'

interface Discipline {
  id: string
  name: string
  description: string | null
  semester: number
  year: number
  status: string
  _count: {
    labWorks: number
  }
}

export default function StudentDisciplinesPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [loading, setLoading] = useState(true)
  const visibleDisciplines = useProgressiveItems(disciplines)

  useEffect(() => {
    loadDisciplines()
  }, [])

  const loadDisciplines = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/disciplines')
      setDisciplines(response.data?.disciplines || [])
    } catch (error) {
      console.error('Failed to load disciplines:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
          <div className="mb-10">
            <Skeleton className="mb-4 h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="mb-10 animate-fade-in">
          <Badge variant="secondary" className="mb-3 shadow-soft">Учебные материалы</Badge>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-950">Мои дисциплины</h1>
          <p className="text-base text-[hsl(var(--foreground-secondary))]">
            Список доступных дисциплин с лабораторными работами
          </p>
        </div>

        {disciplines.length === 0 ? (
          <Card className="p-12 animate-fade-in stagger-1">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lavender-50">
                <svg className="h-8 w-8 text-lavender-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-base font-medium text-slate-700">Нет доступных дисциплин</p>
              <p className="mt-1 text-sm text-[hsl(var(--foreground-secondary))]">
                Дисциплины появятся здесь, когда вы будете зачислены в группу
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {disciplines.length > 0 && visibleDisciplines.length === 0 && [1, 2, 3].map(item => <Skeleton key={item} className="h-56" />)}
            {visibleDisciplines.map((discipline, index) => (
              <Link
                key={discipline.id}
                href={`/student/disciplines/${slugify(discipline.name)}`}
                className={`group animate-fade-in stagger-${Math.min(index + 1, 6)}`}
              >
                <CardHover className="p-6 transition-all duration-200">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-lavender-500 to-purple-600 text-white shadow-soft-md transition-transform duration-200 group-hover:scale-110 group-hover:shadow-soft-lg">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <Badge className="shadow-soft">
                      {discipline.semester} семестр
                    </Badge>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-[hsl(var(--primary))]">
                    {discipline.name}
                  </h3>
                  {discipline.description && (
                    <p className="mb-4 text-sm text-[hsl(var(--foreground-secondary))] line-clamp-2">
                      {discipline.description}
                    </p>
                  )}
                  <div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--border-light))] pt-4">
                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--foreground-secondary))]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">{discipline._count?.labWorks || 0} работ</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--primary))] transition-transform group-hover:translate-x-1">
                      Открыть
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardHover>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
