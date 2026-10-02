import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, Handover, HandoverSummary } from '@/types'

const ep = apiConfig.endpoints.handover

// ── Collector ──────────────────────────────────────────────────────────────

export async function getMyHandoverSummary(): Promise<HandoverSummary[]> {
  const res = await apiClient.get<ApiResponse<HandoverSummary[]>>(ep.mySummary)
  return res.data.data
}

export async function getMyHandovers(params: { status?: string; eventId?: number } = {}): Promise<Handover[]> {
  const res = await apiClient.get<ApiResponse<Handover[]>>(ep.mine, { params })
  return res.data.data
}

export interface CreateHandoverInput {
  eventId: number
  amount: number
  handoverDate?: string | null
  note?: string | null
}

export async function createHandover(input: CreateHandoverInput): Promise<Handover> {
  const res = await apiClient.post<ApiResponse<Handover>>(ep.create, input)
  return res.data.data
}

// ── Treasurer ──────────────────────────────────────────────────────────────

export async function listHandovers(params: { status?: string; eventId?: number } = {}): Promise<Handover[]> {
  const res = await apiClient.get<ApiResponse<Handover[]>>(ep.list, { params })
  return res.data.data
}

export async function acceptHandover(id: number): Promise<Handover> {
  const res = await apiClient.post<ApiResponse<Handover>>(ep.accept(id), {})
  return res.data.data
}

export async function rejectHandover(id: number, reason?: string): Promise<Handover> {
  const res = await apiClient.post<ApiResponse<Handover>>(ep.reject(id), { reason })
  return res.data.data
}
