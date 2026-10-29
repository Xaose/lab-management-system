'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

interface Submission {
  id: string
  status: string
  attemptNumber: number
  submittedAt: string | null
  isLate: boolean
  labWork: {
    id: string
    number: number
    title: string
    maxScore: number
    discipline: {
      id: string
      name: string
    }
  }
  reviews: Array<{
    id: string
    score: number | null
    result: string
    reviewedAt: string
  }>
}

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/submissions')
      setSubmissions(response.data?.submissions || [])
    } catch (error) {
      console.error('Failed to load submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-700',
      SUBMITTED: 'bg-blue-100 text-blue-700',
      IN_REVIEW: 'bg-yellow-100 text-yellow-700',
      REVIEWED: 'bg-green-100 text-green-700',
      REVISION: 'bg-orange-100 text-orange-700',
    }
    const labels = {
      DRAFT: 'Черновик',
      SUBMITTED: 'Отправлена',
      IN_REVIEW: 'На проверке',
      REVIEWED: 'Проверена',
      REVISION: 'На доработку',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои работы</h1>
          <p className="text-gray-600">История сдач и оценок</p>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">Нет сданных работ</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дисциплина</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Работа</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Попытка</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Оценка</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата сдачи</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.labWork.discipline.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ЛР №{submission.labWork.number}: {submission.labWork.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.attemptNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(submission.status)}
                        {submission.isLate && (
                          <span className="ml-2 text-xs text-red-600">Просрочено</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.reviews[0]?.score !== null && submission.reviews[0]?.score !== undefined
                          ? `${submission.reviews[0].score} / ${submission.labWork.maxScore}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleDateString('ru-RU')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
