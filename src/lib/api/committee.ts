import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, AdminCommitteeMember } from '@/types'

export async function listAdminCommittee(): Promise<AdminCommitteeMember[]> {
  const res = await apiClient.get<ApiResponse<AdminCommitteeMember[]>>(
    apiConfig.endpoints.committee.list,
  )
  return res.data.data
}

export async function createCommitteeMember(input: {
  name: string
  roleTitle: string
  eventId?: number | null
  phone?: string | null
  sortOrder?: number
  isActive?: boolean
}): Promise<AdminCommitteeMember> {
  const res = await apiClient.post<ApiResponse<AdminCommitteeMember>>(
    apiConfig.endpoints.committee.create,
    input,
  )
  return res.data.data
}

export async function updateCommitteeMember(
  id: number,
  input: Partial<{
    name: string
    roleTitle: string
    eventId: number | null
    phone: string | null
    sortOrder: number
    isActive: boolean
  }>,
): Promise<AdminCommitteeMember> {
  const res = await apiClient.patch<ApiResponse<AdminCommitteeMember>>(
    apiConfig.endpoints.committee.update(id),
    input,
  )
  return res.data.data
}

export async function deleteCommitteeMember(id: number): Promise<void> {
  await apiClient.delete(apiConfig.endpoints.committee.delete(id))
}

export async function uploadCommitteeMemberPhoto(id: number, file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  await apiClient.post(apiConfig.endpoints.committee.photo(id), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
