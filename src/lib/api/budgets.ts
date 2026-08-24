import apiClient from './client'
import { apiConfig } from '@/config/api'
import type {
  ApiResponse, BudgetCategory, BudgetReport, EventBudgetSummaryRow,
  PaginatedBudgetCategories, CreateBudgetCategoryInput, UpdateBudgetCategoryInput,
} from '@/types'

export interface BudgetCategoriesQuery {
  eventId?: number
  search?: string
  page?: number
  perPage?: number
}

export async function getBudgetCategories(query: BudgetCategoriesQuery = {}): Promise<PaginatedBudgetCategories> {
  const res = await apiClient.get<ApiResponse<PaginatedBudgetCategories>>(
    apiConfig.endpoints.budgets.list,
    { params: query },
  )
  return res.data.data
}

export async function getAllEventsBudgetSummary(): Promise<EventBudgetSummaryRow[]> {
  const res = await apiClient.get<ApiResponse<EventBudgetSummaryRow[]>>(
    apiConfig.endpoints.budgets.allSummary,
  )
  return res.data.data
}

export async function getBudgetReport(eventId: number): Promise<BudgetReport> {
  const res = await apiClient.get<ApiResponse<BudgetReport>>(
    apiConfig.endpoints.budgets.report,
    { params: { eventId } },
  )
  return res.data.data
}

export async function createBudgetCategory(data: CreateBudgetCategoryInput): Promise<BudgetCategory> {
  const res = await apiClient.post<ApiResponse<BudgetCategory>>(
    apiConfig.endpoints.budgets.list,
    data,
  )
  return res.data.data
}

export async function updateBudgetCategory(
  id: number,
  data: UpdateBudgetCategoryInput,
): Promise<BudgetCategory> {
  const res = await apiClient.patch<ApiResponse<BudgetCategory>>(
    apiConfig.endpoints.budgets.detail(id),
    data,
  )
  return res.data.data
}

export async function deleteBudgetCategory(id: number): Promise<void> {
  await apiClient.delete(apiConfig.endpoints.budgets.detail(id))
}

export async function reorderBudgetCategories(eventId: number, ids: number[]): Promise<void> {
  await apiClient.post(apiConfig.endpoints.budgets.reorder, { eventId, ids })
}
