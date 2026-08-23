import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, PaginatedExpenses, Expense, CreateExpenseInput, UpdateExpenseInput } from '@/types'

export interface ExpensesQuery {
  eventId?: number
  budgetCategoryId?: number
  page?: number
  perPage?: number
  search?: string
  mode?: 'cash' | 'upi' | 'cheque'
  dateFrom?: string
  dateTo?: string
  minAmount?: string
  maxAmount?: string
}

export async function getExpenses(query: ExpensesQuery = {}): Promise<PaginatedExpenses> {
  const res = await apiClient.get<ApiResponse<PaginatedExpenses>>(
    apiConfig.endpoints.expenses.list,
    { params: query },
  )
  return res.data.data
}

export async function createExpense(data: CreateExpenseInput): Promise<Expense> {
  const res = await apiClient.post<ApiResponse<Expense>>(
    apiConfig.endpoints.expenses.list,
    data,
  )
  return res.data.data
}

export async function updateExpense(expenseId: number, data: UpdateExpenseInput): Promise<Expense> {
  const res = await apiClient.patch<ApiResponse<Expense>>(
    apiConfig.endpoints.expenses.detail(expenseId),
    data,
  )
  return res.data.data
}

export async function deleteExpense(expenseId: number): Promise<void> {
  await apiClient.delete(apiConfig.endpoints.expenses.detail(expenseId))
}
