import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, ContactDiaryEntry, PaginatedContactDiary } from '@/types'

export async function listContactDiary(params: {
  page?: number
  perPage?: number
  search?: string
} = {}): Promise<PaginatedContactDiary> {
  const qs = new URLSearchParams()
  if (params.page)    qs.set('page',    String(params.page))
  if (params.perPage) qs.set('perPage', String(params.perPage))
  if (params.search)  qs.set('search',  params.search)
  const res = await apiClient.get<ApiResponse<PaginatedContactDiary>>(
    `${apiConfig.endpoints.contactDiary.list}?${qs.toString()}`,
  )
  return res.data.data
}

export async function createContactDiaryEntry(data: {
  name: string
  phone: string
  address?: string | null
  occupation?: string | null
  notes?: string | null
}): Promise<ContactDiaryEntry> {
  const res = await apiClient.post<ApiResponse<ContactDiaryEntry>>(
    apiConfig.endpoints.contactDiary.create,
    data,
  )
  return res.data.data
}

export async function updateContactDiaryEntry(id: number, data: {
  name?: string
  phone?: string
  address?: string | null
  occupation?: string | null
  notes?: string | null
}): Promise<ContactDiaryEntry> {
  const res = await apiClient.patch<ApiResponse<ContactDiaryEntry>>(
    apiConfig.endpoints.contactDiary.update(id),
    data,
  )
  return res.data.data
}

export async function deleteContactDiaryEntry(id: number): Promise<void> {
  await apiClient.delete(apiConfig.endpoints.contactDiary.delete(id))
}
