'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

interface Submission {
  id: string
  status: string
  attemptNumber: number
  submittedAt: string | null
  isLate: boolean
  student: {
    user: {
      firstName: string
      lastName: string
      email: string
    }
    group: {
      name: string
    }
  }
  labWork: {
    id: string
    number: number
    title: string
    maxScore: number
    discipline: {
      name: string
    }
  }
  reviews: Array<{
    score: number | null
    result: string
  }>
}

export default function TeacherSubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

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

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'pending') return sub.status === 'SUBMITTED' || sub.status === 'IN_REVIEW'
    if (filter === 'reviewed') return sub.status === 'REVIEWED'
    return true
  })

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Проверка работ</h1>
          <p className="text-gray-600">Сданные работы студентов</p>
        </div>

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Все ({submissions.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            На проверке ({submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'IN_REVIEW').length})
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'reviewed'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Проверено ({submissions.filter(s => s.status === 'REVIEWED').length})
          </button>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">Нет работ для отображения</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Студент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Группа</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Работа</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Оценка</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата сдачи</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.student.user.lastName} {submission.student.user.firstName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.student.group.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{submission.labWork.discipline.name}</div>
                        <div className="text-gray-500">ЛР №{submission.labWork.number}: {submission.labWork.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(submission.status)}
                        {submission.isLate && (
                          <div className="text-xs text-red-600 mt-1">Просрочено</div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => router.push(`/teacher/submissions/${submission.id}`)}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {submission.status === 'REVIEWED' ? 'Просмотр' : 'Проверить'}
                        </button>
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
