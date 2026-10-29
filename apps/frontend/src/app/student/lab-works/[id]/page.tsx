'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import FileUpload from '@/components/FileUpload'

interface LabWork {
  id: string
  number: number
  title: string
  description: string
  requirements: string | null
  dueDate: string | null
  maxScore: number
  allowResubmit: boolean
  maxAttempts: number | null
  allowedFormats: string[]
  maxFileSize: number
  discipline: {
    id: string
    name: string
  }
  criteria: Array<{
    id: string
    name: string
    description: string | null
    maxScore: number
    order: number
  }>
  files: Array<{
    id: string
    originalName: string
    size: number
  }>
}

interface Submission {
  id: string
  status: string
  attemptNumber: number
  submittedAt: string | null
  isLate: boolean
  studentComment: string | null
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
  }>
}

export default function StudentLabWorkPage() {
  const params = useParams()
  const router = useRouter()
  const [labWork, setLabWork] = useState<LabWork | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const labWorkRes = await apiClient.get(`/lab-works/${params.id}`)
      setLabWork(labWorkRes.data?.labWork || null)

      // Try to load existing submission
      try {
        const submissionsRes = await apiClient.get(`/submissions?labWorkId=${params.id}`)
        const submissions = submissionsRes.data?.submissions || []
        if (submissions.length > 0) {
          setSubmissionHistory(submissions)
          setSubmission(submissions[0])
          setComment(submissions[0].studentComment || '')
        }
      } catch (err) {
        // No submission yet
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

  const handleCreateSubmission = async () => {
    try {
      setError('')
      const response = await apiClient.post('/submissions', {
        labWorkId: params.id
      })

      if (response.success) {
        setSubmission(response.data.submission)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания сдачи')
    }
  }

  const handleFileUpload = async (file: any) => {
    // Reload submission to get updated files list
    await loadData()
  }

  const handleUpdateComment = async () => {
    if (!submission) return

    try {
      setError('')
      await apiClient.put(`/submissions/${submission.id}`, {
        studentComment: comment
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка обновления комментария')
    }
  }

  const handleSubmitForReview = async () => {
    if (!submission) return

    if (submission.files.length === 0) {
      setError('Необходимо загрузить хотя бы один файл')
      return
    }

    try {
      setError('')
      setSubmitting(true)

      // Update comment if changed
      if (comment !== submission.studentComment) {
        await handleUpdateComment()
      }

      const response = await apiClient.post(`/submissions/${submission.id}/submit`)

      if (response.success) {
        await loadData()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка отправки работы')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      setError('')
      await apiClient.delete(`/files/${fileId}`)
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления файла')
    }
  }

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

  const canEdit = submission && (submission.status === 'DRAFT' || submission.status === 'REVISION')
  const isOverdue = labWork?.dueDate ? new Date(labWork.dueDate) < new Date() : false

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (!labWork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Лабораторная работа не найдена</p>
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700"
          >
            ← Назад
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href={`/student/disciplines/${labWork.discipline.id}`}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к дисциплине
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                  ЛР №{labWork.number}
                </span>
                {isOverdue && (
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                    Просрочено
                  </span>
                )}
                {submission && getStatusBadge(submission.status)}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{labWork.title}</h1>
              <p className="text-gray-600">{labWork.discipline.name}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Lab work description */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Описание работы</h2>
            <div className="prose max-w-none text-gray-600 mb-6">
              {labWork.description}
            </div>

            {labWork.requirements && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Требования</h3>
                <div className="prose max-w-none text-gray-600 mb-6">
                  {labWork.requirements}
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-sm text-gray-500">Срок сдачи</div>
                <div className="text-gray-900 font-medium">
                  {labWork.dueDate
                    ? new Date(labWork.dueDate).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Без срока'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Максимальный балл</div>
                <div className="text-gray-900 font-medium">{labWork.maxScore}</div>
              </div>
              {labWork.maxAttempts && (
                <div>
                  <div className="text-sm text-gray-500">Попыток</div>
                  <div className="text-gray-900 font-medium">
                    {submission ? `${submission.attemptNumber} / ${labWork.maxAttempts}` : `0 / ${labWork.maxAttempts}`}
                  </div>
                </div>
              )}
            </div>

            {labWork.criteria.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Критерии оценивания</h3>
                <div className="space-y-2">
                  {labWork.criteria.map((criterion) => (
                    <div key={criterion.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{criterion.name}</div>
                        {criterion.description && (
                          <div className="text-sm text-gray-600 mt-1">{criterion.description}</div>
                        )}
                      </div>
                      <div className="text-sm font-medium text-primary-600 ml-4">
                        {criterion.maxScore} б.
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {labWork.files.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Материалы</h3>
                <div className="space-y-2">
                  {labWork.files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => handleDownloadFile(file.id, file.originalName)}
                      className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-900">{file.originalName}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(0)} КБ
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Submission section */}
          {!submission ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Сдача работы</h2>
              <p className="text-gray-600 mb-4">
                Вы ещё не начали работу над этой лабораторной. Создайте сдачу, чтобы загрузить файлы и отправить работу на проверку.
              </p>
              <button
                onClick={handleCreateSubmission}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
              >
                Начать работу
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Ваша сдача</h2>

                {submission.reviews.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Результат проверки</h3>
                      <span className="text-sm text-gray-600">
                        {new Date(submission.reviews[0].reviewedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {submission.reviews[0].score !== null && (
                      <div className="text-2xl font-bold text-primary-600 mb-2">
                        {submission.reviews[0].score} / {labWork.maxScore}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 mb-2">
                      Преподаватель: {submission.reviews[0].teacher.user.lastName} {submission.reviews[0].teacher.user.firstName}
                    </div>
                    {submission.reviews[0].comment && (
                      <>
                        <div className="text-sm font-medium text-gray-700 mt-3 mb-1">Комментарий:</div>
                        <div className="text-sm text-gray-900">{submission.reviews[0].comment}</div>
                      </>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ваш комментарий (необязательно)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onBlur={handleUpdateComment}
                      disabled={!canEdit}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none disabled:bg-gray-50 disabled:text-gray-500"
                      rows={3}
                      placeholder="Комментарий к сдаче..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Файлы ({submission.files.length})
                    </label>

                    {submission.files.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {submission.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <button
                              onClick={() => handleDownloadFile(file.id, file.originalName)}
                              className="flex items-center gap-3 flex-1 text-left hover:text-primary-600"
                            >
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <div className="text-sm text-gray-900">{file.originalName}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(file.uploadedAt).toLocaleDateString('ru-RU')} • {(file.size / 1024).toFixed(0)} КБ
                                </div>
                              </div>
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {canEdit && (
                      <FileUpload
                        uploadUrl={`/files/submissions/${submission.id}/upload`}
                        onUploadSuccess={handleFileUpload}
                        accept={labWork.allowedFormats.map(f => `.${f}`).join(',')}
                        maxSize={labWork.maxFileSize}
                        multiple
                      />
                    )}
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {canEdit && (
                    <button
                      onClick={handleSubmitForReview}
                      disabled={submitting || submission.files.length === 0}
                      className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Отправка...' : 'Отправить на проверку'}
                    </button>
                  )}
                </div>
              </div>
              {submissionHistory.length > 1 && (
                <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-900">История попыток</h2>
                  <div className="space-y-3">
                    {submissionHistory.slice(1).map(previous => (
                      <div key={previous.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            Попытка №{previous.attemptNumber}
                          </span>
                          {getStatusBadge(previous.status)}
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          {previous.submittedAt
                            ? new Date(previous.submittedAt).toLocaleString('ru-RU')
                            : 'Не отправлена'}
                          {previous.isLate && ' • Просрочено'}
                        </div>
                        <div className="mt-3 space-y-1">
                          {previous.files.map(file => (
                            <button
                              key={file.id}
                              type="button"
                              onClick={() => handleDownloadFile(file.id, file.originalName)}
                              className="block text-sm text-primary-600 hover:text-primary-700"
                            >
                              {file.originalName}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
