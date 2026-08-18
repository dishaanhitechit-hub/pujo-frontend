import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, User } from '@/types'

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>(apiConfig.endpoints.auth.login, input)
  return res.data.data
}

export async function logout(): Promise<void> {
  await apiClient.post<ApiResponse<never>>(apiConfig.endpoints.auth.logout)
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>(apiConfig.endpoints.auth.me)
  return res.data.data
}
