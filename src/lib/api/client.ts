'use client'

import axios, { type AxiosError, type AxiosInstance } from 'axios'
import { apiConfig } from '@/config/api'
import { TOKEN_KEY } from '@/constants'
import { clearAuth } from '@/lib/storage'
import type { ApiError, ApiResponse } from '@/types'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

const apiClient: AxiosInstance = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    // Auto-logout on 401 from any endpoint except the login call itself.
    // A 401 from /api/auth/login means wrong credentials — let that propagate.
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes(apiConfig.endpoints.auth.login)
    ) {
      clearAuth()
      if (typeof window !== 'undefined') {
        window.location.replace('/login')
      }
    }
    const normalized = normalizeError(error)
    return Promise.reject(normalized)
  },
)

function normalizeError(error: AxiosError<ApiResponse<unknown>>): ApiError {
  if (error.response) {
    const { status, data } = error.response
    const message = (data as ApiResponse<unknown>)?.message ?? httpMessage(status)
    return { status, message }
  }
  if (error.request) {
    return { status: 0, message: 'Network error — please check your connection.' }
  }
  return { status: -1, message: error.message ?? 'An unexpected error occurred.' }
}

function httpMessage(status: number): string {
  const map: Record<number, string> = {
    400: 'Bad request.',
    401: 'Invalid or expired session. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'Resource not found.',
    409: 'A conflict occurred (e.g. duplicate entry).',
    422: 'Validation failed. Please check your input.',
    500: 'Server error. Please try again later.',
  }
  return map[status] ?? `Unexpected error (${status}).`
}

export default apiClient
