import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, CollectorSummary, PaginatedPayments } from '@/types'

export interface CollectorPaymentsQuery {
  page?: number
  perPage?: number
  method?: 'cash' | 'upi' | 'cheque'
  status?: 'pending' | 'completed' | 'expired' | 'cancelled'
  eventId?: number
  date?: string
  donorType?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: string
  maxAmount?: string
}

export async function getCollectorSummary(eventId?: number): Promise<CollectorSummary> {
  const res = await apiClient.get<ApiResponse<CollectorSummary>>(apiConfig.endpoints.collector.summary, {
    params: eventId ? { eventId } : undefined,
  })
  return res.data.data
}

export async function getCollectorPayments(query: CollectorPaymentsQuery = {}): Promise<PaginatedPayments> {
  const res = await apiClient.get<ApiResponse<PaginatedPayments>>(apiConfig.endpoints.collector.payments, {
    params: query,
  })
  return res.data.data
}

export interface ReportingEvent {
  id: number
  name: string
  year: number | null
  status: string
}

export async function getCollectorEvents(): Promise<ReportingEvent[]> {
  const res = await apiClient.get<ApiResponse<ReportingEvent[]>>(apiConfig.endpoints.collector.events)
  return res.data.data ?? []
}
