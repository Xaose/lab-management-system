'use client'

import { useRef, useState } from 'react'

interface UploadedFile {
  id: string
  originalName: string
}

interface FileUploadProps {
  onUploadSuccess: (file: UploadedFile) => void | Promise<void>
  accept?: string
  maxSize?: number
  uploadUrl: string
  disabled?: boolean
  multiple?: boolean
}

export default function FileUpload({
  onUploadSuccess,
  accept = '.pdf,.docx,.doc,.zip,.rar,.txt,.png,.jpg,.jpeg',
  maxSize = 10 * 1024 * 1024,
  uploadUrl,
  disabled = false,
  multiple = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getToken = () => {
    try {
      const storage = localStorage.getItem('auth-storage')
      if (storage) {
        const { state } = JSON.parse(storage)
        return state?.token || ''
      }
    } catch {
      return ''
    }
    return ''
  }

  const uploadFiles = async (files: File[]) => {
    setError('')
    const allowedExtensions = accept.split(',').map(extension => extension.trim().toLowerCase())

    for (const file of files) {
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
      if (file.size > maxSize) {
        setError(`Размер файла "${file.name}" не должен превышать ${Math.round(maxSize / 1024 / 1024)} МБ`)
        return
      }
      if (!allowedExtensions.includes(extension)) {
        setError(`Недопустимый формат файла "${file.name}". Разрешены: ${accept}`)
        return
      }
    }

    setUploading(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}${uploadUrl}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData
          }
        )
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || `Ошибка загрузки файла "${file.name}"`)
        }
        await onUploadSuccess(data.data.file)
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Ошибка загрузки файла')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    if (!disabled) {
      const files = Array.from(event.dataTransfer.files)
      if (files.length > 0) await uploadFiles(multiple ? files : [files[0]])
    }
  }

  return (
    <div>
      <div
        onDragOver={event => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-[1.2rem] border-2 border-dashed p-10 text-center transition-all duration-200 ${
          isDragging
            ? 'border-[hsl(var(--primary))] bg-lavender-50 scale-[1.02] shadow-soft-md'
            : 'border-[hsl(var(--border))] bg-white/60 hover:border-lavender-400 hover:bg-lavender-50/50 hover:shadow-soft'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${uploading ? 'pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={event => {
            const files = event.target.files ? Array.from(event.target.files) : []
            if (files.length > 0) void uploadFiles(multiple ? files : [files[0]])
          }}
          accept={accept}
          multiple={multiple}
          className="hidden"
          disabled={disabled || uploading}
        />
        <p className="text-base font-semibold text-slate-900">
          {uploading ? 'Загрузка файла...' : 'Перетащите файл или нажмите для выбора'}
        </p>
        <p className="mt-2 text-sm text-[hsl(var(--foreground-secondary))]">
          Форматы: {accept} (до {Math.round(maxSize / 1024 / 1024)} МБ)
        </p>
      </div>
      {error && (
        <div className="mt-4 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-soft">
          {error}
        </div>
      )}
    </div>
  )
}
