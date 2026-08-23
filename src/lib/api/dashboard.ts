import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, DashboardSummary, CollectorBreakdown, PaginatedPayments, EventStats, EventReport } from '@/types'

export interface DashboardPaymentsQuery {
  page?: number
  perPage?: number
  method?: 'cash' | 'upi' | 'cheque'
  status?: 'pending' | 'completed' | 'expired' | 'cancelled'
  collectorId?: number
  eventId?: number
  date?: string
  donorType?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: string
  maxAmount?: string
}

export async function getDashboardSummary(eventId?: number): Promise<DashboardSummary> {
  const res = await apiClient.get<ApiResponse<DashboardSummary>>(apiConfig.endpoints.dashboard.summary, {
    params: eventId ? { eventId } : undefined,
  })
  return res.data.data
}

export async function getDashboardCollectors(eventId?: number): Promise<CollectorBreakdown[]> {
  const res = await apiClient.get<ApiResponse<CollectorBreakdown[]>>(apiConfig.endpoints.dashboard.collectors, {
    params: eventId ? { eventId } : undefined,
  })
  return res.data.data
}

export async function getDashboardEvents(): Promise<EventStats[]> {
  const res = await apiClient.get<ApiResponse<EventStats[]>>(apiConfig.endpoints.dashboard.events)
  return res.data.data ?? []
}

export async function getDashboardPayments(query: DashboardPaymentsQuery = {}): Promise<PaginatedPayments> {
  const res = await apiClient.get<ApiResponse<PaginatedPayments>>(apiConfig.endpoints.dashboard.payments, {
    params: query,
  })
  return res.data.data
}

export async function getEventReport(eventId: number): Promise<EventReport> {
  const res = await apiClient.get<ApiResponse<EventReport>>(
    apiConfig.endpoints.dashboard.eventReport(eventId),
  )
  return res.data.data
}
