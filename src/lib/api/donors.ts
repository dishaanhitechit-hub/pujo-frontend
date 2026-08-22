import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, PaginatedDonors, DonorDetail } from '@/types'

export interface ListDonorsQuery {
  page?: number
  perPage?: number
  search?: string
  donorType?: string
}

export async function listDonors(query: ListDonorsQuery = {}): Promise<PaginatedDonors> {
  const res = await apiClient.get<ApiResponse<PaginatedDonors>>(apiConfig.endpoints.donor.list, { params: query })
  return res.data.data
}

export async function getDonor(id: number): Promise<DonorDetail> {
  const res = await apiClient.get<ApiResponse<DonorDetail>>(apiConfig.endpoints.donor.get(id))
  return res.data.data
}
