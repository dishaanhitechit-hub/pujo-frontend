import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, AdminAnnouncement } from '@/types'

export async function listAdminAnnouncements(): Promise<AdminAnnouncement[]> {
  const res = await apiClient.get<ApiResponse<AdminAnnouncement[]>>(
    apiConfig.endpoints.announcements.list,
  )
  return res.data.data
}

export async function createAnnouncement(input: {
  title: string
  body: string
  eventId?: number | null
}): Promise<AdminAnnouncement> {
  const res = await apiClient.post<ApiResponse<AdminAnnouncement>>(
    apiConfig.endpoints.announcements.create,
    input,
  )
  return res.data.data
}

export async function updateAnnouncement(
  id: number,
  input: Partial<{
    title: string
    body: string
    eventId: number | null
    isPublished: boolean
  }>,
): Promise<AdminAnnouncement> {
  const res = await apiClient.patch<ApiResponse<AdminAnnouncement>>(
    apiConfig.endpoints.announcements.update(id),
    input,
  )
  return res.data.data
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await apiClient.delete(apiConfig.endpoints.announcements.delete(id))
}
