'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import FileUpload from '@/components/FileUpload'

interface Discipline {
  id: string
  name: string
}

interface Criterion {
  id: string
  name: string
  description: string
  maxScore: number
  order: number
}

interface UploadedFile {
  id: string
  originalName: string
  size: number
}

export default function CreateLabWorkPage() {
  const router = useRouter()
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdLabWorkId, setCreatedLabWorkId] = useState<string | null>(null)
  const [materialFiles, setMaterialFiles] = useState<UploadedFile[]>([])

  const [formData, setFormData] = useState({
    disciplineId: '',
    number: 1,
    title: '',
    description: '',
    requirements: '',
    dueDate: '',
    maxScore: 100,
    allowResubmit: true,
    maxAttempts: '',
    allowedFormats: ['pdf', 'docx', 'zip'],
    maxFileSize: 10485760,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED'
  })

  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [newCriterion, setNewCriterion] = useState({
    name: '',
    description: '',
    maxScore: 10
  })

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

  const handleAddCriterion = () => {
    if (!newCriterion.name || newCriterion.maxScore <= 0) {
      return
    }

    setCriteria([
      ...criteria,
      {
        id: `temp-${Date.now()}`,
        ...newCriterion,
        order: criteria.length
      }
    ])

    setNewCriterion({
      name: '',
      description: '',
      maxScore: 10
    })
  }

  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.disciplineId) {
      setError('Выберите дисциплину')
      return
    }

    if (!formData.title.trim()) {
      setError('Введите название работы')
      return
    }

    if (formData.number <= 0) {
      setError('Номер работы должен быть положительным')
      return
    }

    try {
      setSubmitting(true)

      const payload: any = {
        ...formData,
        maxAttempts: formData.maxAttempts ? parseInt(formData.maxAttempts) : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      }

      const response = await apiClient.post('/lab-works', payload)

      if (response.success) {
        const labWorkId = response.data.labWork.id

        // Add criteria if any
        for (const criterion of criteria) {
          await apiClient.post(`/lab-works/${labWorkId}/criteria`, {
            name: criterion.name,
            description: criterion.description,
            maxScore: criterion.maxScore,
            order: criterion.order
          })
        }

        setCreatedLabWorkId(labWorkId)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания лабораторной работы')
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (file: any) => {
    setMaterialFiles(files => [...files, file])
  }

  const handleDeleteMaterial = async (fileId: string) => {
    try {
      await apiClient.delete(`/files/${fileId}`)
      setMaterialFiles(files => files.filter(file => file.id !== fileId))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления материала')
    }
  }

  const formatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'Word (DOCX)' },
    { value: 'doc', label: 'Word (DOC)' },
    { value: 'zip', label: 'ZIP' },
    { value: 'rar', label: 'RAR' },
    { value: 'txt', label: 'Text' },
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'jpeg', label: 'JPEG' }
  ]

  const toggleFormat = (format: string) => {
    if (formData.allowedFormats.includes(format)) {
      setFormData({
        ...formData,
        allowedFormats: formData.allowedFormats.filter(f => f !== format)
      })
    } else {
      setFormData({
        ...formData,
        allowedFormats: [...formData.allowedFormats, format]
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (createdLabWorkId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-xl shadow-sm p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Лабораторная работа создана!</h2>
          <p className="text-gray-600 mb-6">Работа успешно добавлена в систему</p>
          <div className="mb-6 text-left">
            <h3 className="mb-3 font-semibold text-gray-900">Методические материалы</h3>
            <FileUpload
              uploadUrl={`/files/lab-works/${createdLabWorkId}/upload`}
              onUploadSuccess={handleFileUpload}
              multiple
            />
            {materialFiles.length > 0 && (
              <ul className="mt-4 space-y-2">
                {materialFiles.map(file => (
                  <li key={file.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="truncate">{file.originalName}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(file.id)}
                      className="ml-3 text-red-600 hover:text-red-700"
                    >
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/teacher/disciplines')}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              К дисциплинам
            </button>
            <button
              onClick={() => {
                setCreatedLabWorkId(null)
                setFormData({
                  ...formData,
                  number: formData.number + 1,
                  title: '',
                  description: '',
                  requirements: '',
                  dueDate: ''
                })
                setCriteria([])
              }}
              className="w-full px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Создать ещё одну
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/teacher/disciplines"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к дисциплинам
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Создание лабораторной работы</h1>
          <p className="text-gray-600">Заполните информацию о новой лабораторной работе</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Основная информация</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дисциплина *
                </label>
                <select
                  value={formData.disciplineId}
                  onChange={(e) => setFormData({ ...formData, disciplineId: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                >
                  <option value="">Выберите дисциплину</option>
                  {disciplines.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Номер работы *
                  </label>
                  <input
                    type="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Максимальный балл *
                  </label>
                  <input
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 100 })}
                    min="1"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название работы *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                  placeholder="Например: Основы программирования на Python"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                  placeholder="Опишите цель и содержание работы"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Требования к выполнению
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                  placeholder="Укажите требования к оформлению и содержанию"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Срок сдачи
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Максимум попыток
                  </label>
                  <input
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                    min="1"
                    placeholder="Без ограничений"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowResubmit}
                    onChange={(e) => setFormData({ ...formData, allowResubmit: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Разрешить повторную сдачу</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус публикации
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                >
                  <option value="DRAFT">Черновик (не видна студентам)</option>
                  <option value="PUBLISHED">Опубликована (видна студентам)</option>
                </select>
              </div>
            </div>
          </div>

          {/* File settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Настройки файлов</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Допустимые форматы файлов
                </label>
                <div className="flex flex-wrap gap-2">
                  {formatOptions.map(format => (
                    <button
                      key={format.value}
                      type="button"
                      onClick={() => toggleFormat(format.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        formData.allowedFormats.includes(format.value)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Максимальный размер файла (МБ)
                </label>
                <input
                  type="number"
                  value={formData.maxFileSize / 1024 / 1024}
                  onChange={(e) => setFormData({ ...formData, maxFileSize: parseInt(e.target.value) * 1024 * 1024 })}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                />
              </div>
            </div>
          </div>

          {/* Criteria */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Критерии оценивания</h2>

            {criteria.length > 0 && (
              <div className="space-y-2 mb-4">
                {criteria.map((criterion) => (
                  <div key={criterion.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{criterion.name}</div>
                      {criterion.description && (
                        <div className="text-sm text-gray-600 mt-1">{criterion.description}</div>
                      )}
                      <div className="text-sm text-primary-600 mt-1">Макс. балл: {criterion.maxScore}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(criterion.id)}
                      className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newCriterion.name}
                onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
                placeholder="Название критерия"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
              />
              <input
                type="text"
                value={newCriterion.description}
                onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })}
                placeholder="Описание (необязательно)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  value={newCriterion.maxScore}
                  onChange={(e) => setNewCriterion({ ...newCriterion, maxScore: parseInt(e.target.value) || 0 })}
                  min="1"
                  placeholder="Макс. балл"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCriterion}
                  disabled={!newCriterion.name || newCriterion.maxScore <= 0}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Создание...' : 'Создать лабораторную работу'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
