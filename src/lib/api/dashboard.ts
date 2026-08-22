import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, DashboardSummary, CollectorBreakdown, PaginatedPayments } from '@/types'

export interface DashboardPaymentsQuery {
  page?: number
  perPage?: number
  method?: 'cash' | 'upi' | 'cheque'
  status?: 'pending' | 'completed' | 'expired' | 'cancelled'
  collectorId?: number
  date?: string
  donorType?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: string
  maxAmount?: string
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiClient.get<ApiResponse<DashboardSummary>>(apiConfig.endpoints.dashboard.summary)
  return res.data.data
}

export async function getDashboardCollectors(): Promise<CollectorBreakdown[]> {
  const res = await apiClient.get<ApiResponse<CollectorBreakdown[]>>(apiConfig.endpoints.dashboard.collectors)
  return res.data.data
}

export async function getDashboardPayments(query: DashboardPaymentsQuery = {}): Promise<PaginatedPayments> {
  const res = await apiClient.get<ApiResponse<PaginatedPayments>>(apiConfig.endpoints.dashboard.payments, {
    params: query,
  })
  return res.data.data
}
