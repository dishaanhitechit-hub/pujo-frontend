import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, ContributionList } from '@/types'

export interface AdminContributionsQuery {
  status?: 'pending' | 'approved' | 'rejected'
  eventId?: number
  search?: string
  page?: number
  perPage?: number
}

export async function getAdminContributions(query: AdminContributionsQuery = {}): Promise<ContributionList> {
  const res = await apiClient.get<ApiResponse<ContributionList>>(apiConfig.endpoints.contributions.adminList, { params: query })
  return res.data.data
}

export async function reviewContribution(id: number, action: 'approve' | 'reject', adminNote?: string): Promise<void> {
  await apiClient.patch(apiConfig.endpoints.contributions.adminReview(id), { action, adminNote })
}
