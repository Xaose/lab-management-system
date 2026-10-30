'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { labWorkSlug } from '@/lib/slug'

interface LabWork {
  id: string
  number: number
  title: string
  description: string
  dueDate: string | null
  maxScore: number
  status: string
}
interface Discipline {
  id: string
  name: string
  description: string | null
}

export default function StudentDisciplinePage() {
  const params = useParams()
  const router = useRouter()
  const [discipline, setDiscipline] = useState<Discipline | null>(null)
  const [labWorks, setLabWorks] = useState<LabWork[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const disciplineRes = await apiClient.get(`/disciplines/${params.id}`)
      const loadedDiscipline = disciplineRes.data?.discipline || null
      setDiscipline(loadedDiscipline)
      if (loadedDiscipline) {
        const labWorksRes = await apiClient.get(`/lab-works?disciplineId=${loadedDiscipline.id}`)
        setLabWorks(labWorksRes.data?.labWorks || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      loadData()
    }
  }, [params.id, loadData])

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="dashboard-page flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (!discipline) {
    return (
      <div className="dashboard-page flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Дисциплина не найдена</p>
          <button
            onClick={() => router.push('/student/disciplines')}
            className="text-primary-600 hover:text-primary-700"
          >
            ← Назад к дисциплинам
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 animate-fade-in">
          <Link
            href="/student/disciplines"
            className="mb-4 inline-flex items-center text-lavender-700 transition hover:text-lavender-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к дисциплинам
          </Link>
          <h1 className="text-3xl font-bold text-slate-950 mb-2">{discipline.name}</h1>
          {discipline.description && (
            <p className="text-gray-600">{discipline.description}</p>
          )}
        </div>

        {labWorks.length === 0 ? (
          <div className="dashboard-card p-12 text-center animate-fade-in-scale">
            <p className="text-gray-500">Нет доступных лабораторных работ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {labWorks.map((labWork) => (
              <Link
                key={labWork.id}
                href={`/student/lab-works/${labWorkSlug(labWork.number, labWork.title)}`}
                className="dashboard-card-hover block p-6 animate-fade-in-scale"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                        ЛР №{labWork.number}
                      </span>
                      {labWork.dueDate && isOverdue(labWork.dueDate) && (
                        <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                          Просрочено
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{labWork.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{labWork.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {labWork.dueDate
                          ? `Срок: ${new Date(labWork.dueDate).toLocaleDateString('ru-RU')}`
                          : 'Без срока'}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Макс. балл: {labWork.maxScore}
                      </div>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
