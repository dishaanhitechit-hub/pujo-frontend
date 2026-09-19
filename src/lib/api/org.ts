import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, User } from '@/types'

export interface OrgInfo {
  id: number
  name: string
  slug: string
  isActive: boolean
  createdAt: string
}

export interface RegisterOrgInput {
  orgName: string
  adminName: string
  email: string
  phone: string
  password: string
}

export interface RegisterOrgResponse {
  accessToken: string
  user: User
  org: OrgInfo
}

export async function registerOrg(input: RegisterOrgInput): Promise<RegisterOrgResponse> {
  const res = await apiClient.post<ApiResponse<RegisterOrgResponse>>(
    apiConfig.endpoints.org.register,
    input,
  )
  return res.data.data
}

export async function getMyOrg(): Promise<OrgInfo> {
  const res = await apiClient.get<ApiResponse<OrgInfo>>(apiConfig.endpoints.org.me)
  return res.data.data
}

export async function updateMyOrg(data: { name: string }): Promise<OrgInfo> {
  const res = await apiClient.patch<ApiResponse<OrgInfo>>(apiConfig.endpoints.org.me, data)
  return res.data.data
}
