import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, Event, EventDay, EventSummary, PaginatedEvents, DashboardSummary } from '@/types'

export interface EventListQuery {
  search?: string
  status?: 'draft' | 'published' | 'archived'
  collectionEnabled?: boolean
  isFeatured?: boolean
  year?: number
  page?: number
  perPage?: number
}

export interface CreateEventInput {
  name: string
  description?: string | null
  startDate?: string | null   // YYYY-MM-DD
  endDate?: string | null
  location?: string | null
  year?: number | null
  status?: 'draft' | 'published' | 'archived'
  collectionEnabled?: boolean
  isFeatured?: boolean
  budget?: number | null
  budgetNotes?: string | null
}

export type UpdateEventInput = Partial<CreateEventInput>

export interface SetEventDaysInput {
  key: string
  label: string
  date?: string | null        // YYYY-MM-DD
  description?: string | null
  rituals?: (string | { time: string; name: string })[]
  sortOrder?: number
}

export async function listEvents(query: EventListQuery = {}): Promise<PaginatedEvents> {
  const res = await apiClient.get<ApiResponse<PaginatedEvents>>(apiConfig.endpoints.events.list, {
    params: query,
  })
  return res.data.data
}

export async function getEventSummary(id: number): Promise<DashboardSummary> {
  const res = await apiClient.get<ApiResponse<DashboardSummary>>(apiConfig.endpoints.events.summary(id))
  return res.data.data
}

export async function listActiveEvents(): Promise<EventSummary[]> {
  const res = await apiClient.get<ApiResponse<EventSummary[]>>(apiConfig.endpoints.events.active)
  return res.data.data
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const res = await apiClient.post<ApiResponse<Event>>(apiConfig.endpoints.events.create, input)
  return res.data.data
}

export async function getEvent(id: number): Promise<Event> {
  const res = await apiClient.get<ApiResponse<Event>>(apiConfig.endpoints.events.get(id))
  return res.data.data
}

export async function updateEvent(id: number, input: UpdateEventInput): Promise<Event> {
  const res = await apiClient.patch<ApiResponse<Event>>(apiConfig.endpoints.events.update(id), input)
  return res.data.data
}

export async function setEventDays(id: number, days: SetEventDaysInput[]): Promise<Event> {
  const res = await apiClient.post<ApiResponse<Event>>(apiConfig.endpoints.events.days(id), days)
  return res.data.data
}

export async function uploadEventCover(id: number, file: File, altText?: string): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  if (altText) form.append('altText', altText)
  await apiClient.post(apiConfig.endpoints.events.cover(id), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function uploadEventGallery(id: number, file: File, altText?: string): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  if (altText) form.append('altText', altText)
  await apiClient.post(apiConfig.endpoints.events.gallery(id), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function deleteEventMedia(mediaId: number): Promise<void> {
  await apiClient.delete(apiConfig.endpoints.media.delete(mediaId))
}

export async function reorderEventGallery(eventId: number, orderedIds: number[]): Promise<void> {
  await apiClient.post(apiConfig.endpoints.events.galleryReorder(eventId), { ids: orderedIds })
}
