import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, AdminConfig, AdminConfigResponse } from '@/types'

export async function getAdminConfig(): Promise<AdminConfigResponse> {
  const res = await apiClient.get<ApiResponse<AdminConfigResponse>>(apiConfig.endpoints.admin.config)
  return res.data.data
}

export async function updateAdminConfig(input: Partial<AdminConfig>): Promise<AdminConfig> {
  const res = await apiClient.post<ApiResponse<AdminConfig>>(apiConfig.endpoints.admin.config, input)
  return res.data.data
}

export async function uploadConfigMedia(file: File): Promise<{ url: string; id: number }> {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiResponse<{ url: string; id: number }>>(
    apiConfig.endpoints.admin.configMedia,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return res.data.data
}
