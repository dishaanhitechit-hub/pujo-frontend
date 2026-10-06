import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, User } from '@/types'

export interface OrgOption {
  orgCode: string
  orgName: string
  role: string
}

export async function getOrgsByEmail(email: string): Promise<OrgOption[]> {
  const res = await apiClient.get<ApiResponse<OrgOption[]>>(
    `${apiConfig.endpoints.auth.orgsByEmail}?email=${encodeURIComponent(email)}`,
  )
  return res.data.data ?? []
}

export interface LoginInput {
  email: string
  password: string
  orgCode: string
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

export interface FirstSetupInput {
  email: string
  password: string
  otpCode: string
  orgCode: string
  newPassword: string
}

export async function firstSetup(input: FirstSetupInput): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>(apiConfig.endpoints.auth.firstSetup, input)
  return res.data.data
}

export async function requestPasswordReset(input: { email: string; orgCode: string }): Promise<string> {
  const res = await apiClient.post<ApiResponse<never>>(apiConfig.endpoints.auth.forgotPassword, input)
  return res.data.message
}

export interface ResetPasswordInput {
  email: string
  orgCode: string
  otpCode: string
  newPassword: string
}

export async function resetPassword(input: ResetPasswordInput): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>(apiConfig.endpoints.auth.resetPassword, input)
  return res.data.data
}

export async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>(apiConfig.endpoints.auth.changePassword, input)
  return res.data.data
}
