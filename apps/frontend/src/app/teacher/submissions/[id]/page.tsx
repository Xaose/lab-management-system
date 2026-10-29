'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'

interface Submission {
  id: string
  status: string
  attemptNumber: number
  submittedAt: string | null
  isLate: boolean
  studentComment: string | null
  student: {
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    group: {
      name: string
    }
    studentIdNumber: string
  }
  labWork: {
    id: string
    number: number
    title: string
    maxScore: number
    discipline: {
      name: string
    }
    criteria: Array<{
      id: string
      name: string
      description: string | null
      maxScore: number
      order: number
    }>
  }
  files: Array<{
    id: string
    originalName: string
    size: number
    uploadedAt: string
  }>
  reviews: Array<{
    id: string
    score: number | null
    result: string
    comment: string | null
    reviewedAt: string
    teacher: {
      user: {
        firstName: string
        lastName: string
      }
    }
    criteriaScores: Array<{
      criterionId: string
      score: number
      criterion: {
        name: string
      }
    }>
  }>
}

export default function TeacherSubmissionReviewPage() {
  const params = useParams()
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [reviewForm, setReviewForm] = useState({
    score: '',
    result: 'ACCEPTED' as 'ACCEPTED' | 'REVISION' | 'REJECTED',
    comment: '',
    criteriaScores: [] as Array<{ criterionId: string; score: number }>
  })

  const loadSubmission = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/submissions/${params.id}`)
      const sub = response.data?.submission

      if (sub) {
        setSubmission(sub)

        // Initialize criteria scores
        if (sub.labWork.criteria.length > 0) {
          const criteriaScores = sub.labWork.criteria.map((c: any) => ({
            criterionId: c.id,
            score: 0
          }))
          setReviewForm(prev => ({ ...prev, criteriaScores }))
        }

        // If already reviewed, load review data
        if (sub.reviews.length > 0) {
          const review = sub.reviews[0]
          setReviewForm({
            score: review.score?.toString() || '',
            result: review.result as 'ACCEPTED' | 'REVISION' | 'REJECTED',
            comment: review.comment || '',
            criteriaScores: review.criteriaScores.map((cs: any) => ({
              criterionId: cs.criterionId,
              score: cs.score
            }))
          })
        }
      }
    } catch (error) {
      console.error('Failed to load submission:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      loadSubmission()
    }
  }, [params.id, loadSubmission])

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const token = getToken()
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/files/${fileId}/download`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      } else {
        setError('Ошибка скачивания файла')
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка скачивания файла')
    }
  }

  const getToken = () => {
    try {
      const storage = localStorage.getItem('auth-storage')
      if (storage) {
        const { state } = JSON.parse(storage)
        return state?.token || ''
      }
    } catch (e) {
      return ''
    }
    return ''
  }

  const handleCriterionScoreChange = (criterionId: string, score: number) => {
    setReviewForm(prev => ({
      ...prev,
      criteriaScores: prev.criteriaScores.map(cs =>
        cs.criterionId === criterionId ? { ...cs, score } : cs
      )
    }))
  }

  const calculateTotalFromCriteria = () => {
    return reviewForm.criteriaScores.reduce((sum, cs) => sum + cs.score, 0)
  }

  const handleSubmitReview = async () => {
    if (!submission) return

    setError('')

    // Validate score if using criteria
    let finalScore = reviewForm.score ? parseInt(reviewForm.score) : null

    if (submission.labWork.criteria.length > 0) {
      const totalFromCriteria = calculateTotalFromCriteria()
      if (reviewForm.score && parseInt(reviewForm.score) !== totalFromCriteria) {
        setError('Итоговая оценка не совпадает с суммой баллов по критериям')
        return
      }
      finalScore = totalFromCriteria
    }

    if (finalScore !== null && (finalScore < 0 || finalScore > submission.labWork.maxScore)) {
      setError(`Оценка должна быть от 0 до ${submission.labWork.maxScore}`)
      return
    }

    try {
      setSubmitting(true)

      const payload: any = {
        result: reviewForm.result,
        comment: reviewForm.comment || undefined,
        score: finalScore
      }

      if (submission.labWork.criteria.length > 0) {
        payload.criteriaScores = reviewForm.criteriaScores
      }

      // Check if updating existing review or creating new
      if (submission.reviews.length > 0) {
        await apiClient.put(`/submissions/reviews/${submission.reviews[0].id}`, payload)
      } else {
        await apiClient.post(`/submissions/${submission.id}/review`, payload)
      }

      router.push('/teacher/submissions')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения проверки')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Сдача не найдена</p>
          <button
            onClick={() => router.push('/teacher/submissions')}
            className="text-primary-600 hover:text-primary-700"
          >
            ← Назад к списку
          </button>
        </div>
      </div>
    )
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const canReview = submission.status === 'SUBMITTED' || submission.status === 'IN_REVIEW'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/teacher/submissions"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к списку
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Проверка работы</h1>
              <p className="text-gray-600">
                {submission.student.user.lastName} {submission.student.user.firstName} • {submission.student.group.name}
              </p>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - submission info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lab work info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о работе</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Дисциплина</div>
                  <div className="text-gray-900 font-medium">{submission.labWork.discipline.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Лабораторная работа</div>
                  <div className="text-gray-900 font-medium">
                    ЛР №{submission.labWork.number}: {submission.labWork.title}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <div className="text-sm text-gray-500">Попытка</div>
                    <div className="text-gray-900 font-medium">{submission.attemptNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Макс. балл</div>
                    <div className="text-gray-900 font-medium">{submission.labWork.maxScore}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Дата сдачи</div>
                    <div className="text-gray-900 font-medium">
                      {submission.submittedAt
                        ? new Date(submission.submittedAt).toLocaleDateString('ru-RU')
                        : '-'}
                    </div>
                  </div>
                </div>
                {submission.isLate && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Работа сдана с просрочкой
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Student comment */}
            {submission.studentComment && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Комментарий студента</h3>
                <p className="text-gray-700">{submission.studentComment}</p>
              </div>
            )}

            {/* Files */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Файлы ({submission.files.length})</h3>
              {submission.files.length === 0 ? (
                <p className="text-gray-500">Нет загруженных файлов</p>
              ) : (
                <div className="space-y-2">
                  {submission.files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => handleDownloadFile(file.id, file.originalName)}
                      className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">{file.originalName}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(file.uploadedAt).toLocaleDateString('ru-RU')} • {(file.size / 1024).toFixed(0)} КБ
                          </div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Previous reviews */}
            {submission.reviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">История проверок</h3>
                <div className="space-y-4">
                  {submission.reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            {review.teacher.user.lastName} {review.teacher.user.firstName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.reviewedAt).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        {review.score !== null && (
                          <div className="text-xl font-bold text-primary-600">
                            {review.score} / {submission.labWork.maxScore}
                          </div>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                      )}
                      {review.criteriaScores.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">Оценки по критериям:</div>
                          <div className="space-y-1">
                            {review.criteriaScores.map((cs) => (
                              <div key={cs.criterionId} className="flex justify-between text-sm">
                                <span className="text-gray-600">{cs.criterion.name}</span>
                                <span className="font-medium text-gray-900">{cs.score} б.</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column - review form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {submission.reviews.length > 0 ? 'Редактировать проверку' : 'Проверка работы'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Результат
                  </label>
                  <select
                    value={reviewForm.result}
                    onChange={(e) => setReviewForm({ ...reviewForm, result: e.target.value as any })}
                    disabled={!canReview && submission.reviews.length === 0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="ACCEPTED">Принята</option>
                    <option value="REVISION">На доработку</option>
                    <option value="REJECTED">Отклонена</option>
                  </select>
                </div>

                {submission.labWork.criteria.length > 0 ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Оценки по критериям
                      </label>
                      <div className="space-y-3">
                        {submission.labWork.criteria.map((criterion) => {
                          const criterionScore = reviewForm.criteriaScores.find(cs => cs.criterionId === criterion.id)
                          return (
                            <div key={criterion.id}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">{criterion.name}</span>
                                <span className="text-gray-500">Макс: {criterion.maxScore}</span>
                              </div>
                              <input
                                type="number"
                                value={criterionScore?.score || 0}
                                onChange={(e) => handleCriterionScoreChange(criterion.id, parseInt(e.target.value) || 0)}
                                min="0"
                                max={criterion.maxScore}
                                disabled={!canReview && submission.reviews.length === 0}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none disabled:bg-gray-50 disabled:text-gray-500"
                              />
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="font-medium text-gray-900">Итого:</span>
                        <span className="text-xl font-bold text-primary-600">
                          {calculateTotalFromCriteria()} / {submission.labWork.maxScore}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Оценка (0-{submission.labWork.maxScore})
                    </label>
                    <input
                      type="number"
                      value={reviewForm.score}
                      onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })}
                      min="0"
                      max={submission.labWork.maxScore}
                      disabled={!canReview && submission.reviews.length === 0}
                      placeholder="Необязательно"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Комментарий
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    disabled={!canReview && submission.reviews.length === 0}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Оставьте комментарий для студента..."
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {(canReview || submission.reviews.length > 0) && (
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Сохранение...' : submission.reviews.length > 0 ? 'Обновить проверку' : 'Сохранить проверку'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
