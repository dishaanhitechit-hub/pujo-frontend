import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, Event, EventDay, EventSummary } from '@/types'

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
}

export type UpdateEventInput = Partial<CreateEventInput>

export interface SetEventDaysInput {
  key: string
  label: string
  date?: string | null        // YYYY-MM-DD
  description?: string | null
  rituals?: string[]
  sortOrder?: number
}

export async function listEvents(): Promise<Event[]> {
  const res = await apiClient.get<ApiResponse<Event[]>>(apiConfig.endpoints.events.list)
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
