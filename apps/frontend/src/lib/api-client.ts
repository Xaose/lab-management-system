import axios, { AxiosInstance } from 'axios'
import type { ApiResponse, LoginDto } from '@lab/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Interceptor для добавления токена
    this.client.interceptors.request.use((config) => {
      const token = this.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Interceptor для обработки ошибок
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken()
          if (typeof window !== 'undefined') {
            const requestUrl = error.config?.url || ''
            if (!requestUrl.includes('/auth/login')) {
              const redirect = `${window.location.pathname}${window.location.search}`
              window.location.href = `/auth/login?redirect=${encodeURIComponent(redirect)}`
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null

    // Проверяем Zustand store первым делом
    try {
      const storage = localStorage.getItem('auth-storage')
      if (storage) {
        const { state } = JSON.parse(storage)
        return state?.token || localStorage.getItem('auth_token')
      }
    } catch (e) {
      // Fallback to old method
      return localStorage.getItem('auth_token')
    }

    return null
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth-storage')
      document.cookie = 'auth-token=; path=/; max-age=0'
      document.cookie = 'auth-user=; path=/; max-age=0'
    }
  }

  // Auth endpoints
  async login(data: LoginDto) {
    const response = await this.client.post<ApiResponse>('/auth/login', data)
    if (response.data.success && response.data.data?.token) {
      this.setToken(response.data.data.token)
    }
    return response.data
  }

  async getCurrentUser() {
    const response = await this.client.get<ApiResponse>('/auth/me')
    return response.data
  }

  logout() {
    this.clearToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }

  // Generic methods
  async get<T = any>(url: string) {
    const response = await this.client.get<ApiResponse<T>>(url)
    return response.data
  }

  async download(url: string) {
    const response = await this.client.get(url, { responseType: 'blob' })
    return response.data as Blob
  }

  async post<T = any>(url: string, data?: any) {
    const response = await this.client.post<ApiResponse<T>>(url, data)
    return response.data
  }

  async upload<T = any>(url: string, data: FormData) {
    const response = await this.client.post<ApiResponse<T>>(url, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  async put<T = any>(url: string, data?: any) {
    const response = await this.client.put<ApiResponse<T>>(url, data)
    return response.data
  }

  async delete<T = any>(url: string) {
    const response = await this.client.delete<ApiResponse<T>>(url)
    return response.data
  }

  async patch<T = any>(url: string, data?: any) {
    const response = await this.client.patch<ApiResponse<T>>(url, data)
    return response.data
  }
}

export const apiClient = new ApiClient()
