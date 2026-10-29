// Общие типы для всего проекта

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// DTOs для API
export interface LoginDto {
  email: string
  password: string
}

export interface CreateLabWorkDto {
  disciplineId: string
  number: number
  title: string
  description: string
  requirements?: string
  dueDate?: Date
  maxScore: number
  allowResubmit?: boolean
  maxAttempts?: number
  allowedFormats: string[]
  maxFileSize: number
}

export interface SubmitLabWorkDto {
  labWorkId: string
  studentComment?: string
  files: File[]
}

export interface ReviewDto {
  submissionId: string
  score?: number
  result: 'ACCEPTED' | 'REVISION' | 'REJECTED'
  comment?: string
  criteriaScores?: Array<{
    criterionId: string
    score: number
  }>
}
