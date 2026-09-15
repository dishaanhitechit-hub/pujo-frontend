import apiClient from '@/lib/api/client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, Circular, PaginatedCirculars } from '@/types'

// ── Admin ──────────────────────────────────────────────────────────────────

export async function adminListCirculars(page = 1, perPage = 20): Promise<PaginatedCirculars> {
  const res = await apiClient.get<ApiResponse<PaginatedCirculars>>(
    `${apiConfig.endpoints.circulars.list}?page=${page}&perPage=${perPage}`
  )
  return res.data.data as PaginatedCirculars
}

export async function adminCreateCircular(data: {
  title: string; body: string; circularNo?: string | null; eventId?: number | null; isPublished?: boolean
}): Promise<Circular> {
  const res = await apiClient.post<ApiResponse<Circular>>(apiConfig.endpoints.circulars.create, data)
  return res.data.data as Circular
}

export async function adminGetCircular(id: number): Promise<Circular> {
  const res = await apiClient.get<ApiResponse<Circular>>(apiConfig.endpoints.circulars.get(id))
  return res.data.data as Circular
}

export async function adminUpdateCircular(id: number, data: Partial<{
  title: string; body: string; circularNo: string | null; eventId: number | null; isPublished: boolean
}>): Promise<Circular> {
  const res = await apiClient.patch<ApiResponse<Circular>>(apiConfig.endpoints.circulars.update(id), data)
  return res.data.data as Circular
}

export async function adminDeleteCircular(id: number): Promise<void> {
  await apiClient.delete(apiConfig.endpoints.circulars.delete(id))
}

// ── Member ─────────────────────────────────────────────────────────────────

export async function listPublishedCirculars(params: {
  search?: string; eventId?: number; dateFrom?: string; dateTo?: string; page?: number; perPage?: number
} = {}): Promise<PaginatedCirculars> {
  const q = new URLSearchParams()
  if (params.search)   q.set('search',   params.search)
  if (params.eventId)  q.set('eventId',  String(params.eventId))
  if (params.dateFrom) q.set('dateFrom', params.dateFrom)
  if (params.dateTo)   q.set('dateTo',   params.dateTo)
  if (params.page)     q.set('page',     String(params.page))
  if (params.perPage)  q.set('perPage',  String(params.perPage))
  const url = `${apiConfig.endpoints.circulars.published}?${q.toString()}`
  const res = await apiClient.get<ApiResponse<PaginatedCirculars>>(url)
  return res.data.data as PaginatedCirculars
}
