import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, Pledge, PledgeDetail, PaginatedPledges, PaymentInitiateResponse, CreatePledgeInput, PledgePayInput } from '@/types'

export interface ListPledgesQuery {
  page?: number
  perPage?: number
  status?: 'open' | 'complete' | 'cancelled'
  collectorId?: number
  eventId?: number
  search?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: string
  maxAmount?: string
}

export async function createPledge(input: CreatePledgeInput): Promise<Pledge> {
  const res = await apiClient.post<ApiResponse<Pledge>>(apiConfig.endpoints.pledge.create, input)
  return res.data.data
}

export async function listPledges(query: ListPledgesQuery = {}): Promise<PaginatedPledges> {
  const res = await apiClient.get<ApiResponse<PaginatedPledges>>(apiConfig.endpoints.pledge.list, { params: query })
  return res.data.data
}

export async function getPledge(id: number): Promise<PledgeDetail> {
  const res = await apiClient.get<ApiResponse<PledgeDetail>>(apiConfig.endpoints.pledge.get(id))
  return res.data.data
}

export async function payPledgeInstallment(id: number, input: PledgePayInput): Promise<PaymentInitiateResponse> {
  const res = await apiClient.post<ApiResponse<PaymentInitiateResponse>>(apiConfig.endpoints.pledge.pay(id), input)
  return res.data.data
}

export async function cancelPledge(id: number): Promise<Pledge> {
  const res = await apiClient.post<ApiResponse<Pledge>>(apiConfig.endpoints.pledge.cancel(id))
  return res.data.data
}
