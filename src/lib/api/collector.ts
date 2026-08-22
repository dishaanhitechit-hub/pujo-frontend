import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, CollectorSummary, PaginatedPayments } from '@/types'

export interface CollectorPaymentsQuery {
  page?: number
  perPage?: number
  method?: 'cash' | 'upi' | 'cheque'
  status?: 'pending' | 'completed' | 'expired' | 'cancelled'
  date?: string
  donorType?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: string
  maxAmount?: string
}

export async function getCollectorSummary(): Promise<CollectorSummary> {
  const res = await apiClient.get<ApiResponse<CollectorSummary>>(apiConfig.endpoints.collector.summary)
  return res.data.data
}

export async function getCollectorPayments(query: CollectorPaymentsQuery = {}): Promise<PaginatedPayments> {
  const res = await apiClient.get<ApiResponse<PaginatedPayments>>(apiConfig.endpoints.collector.payments, {
    params: query,
  })
  return res.data.data
}
