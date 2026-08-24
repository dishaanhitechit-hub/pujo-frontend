import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, User, CreateUserInput, UpdateUserInput } from '@/types'

export async function getUsers(): Promise<User[]> {
  const res = await apiClient.get<ApiResponse<User[]>>(apiConfig.endpoints.users.list)
  return res.data.data
}

export async function getUser(id: number): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>(apiConfig.endpoints.users.get(id))
  return res.data.data
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const res = await apiClient.post<ApiResponse<User>>(apiConfig.endpoints.users.create, input)
  return res.data.data
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<User> {
  const res = await apiClient.patch<ApiResponse<User>>(apiConfig.endpoints.users.update(id), input)
  return res.data.data
}

export async function deactivateUser(id: number): Promise<void> {
  await apiClient.delete(apiConfig.endpoints.users.deactivate(id))
}

export async function getUserLoginQr(id: number): Promise<string> {
  const res = await apiClient.get(apiConfig.endpoints.users.loginQr(id), { responseType: 'blob' })
  return URL.createObjectURL(res.data)
}
