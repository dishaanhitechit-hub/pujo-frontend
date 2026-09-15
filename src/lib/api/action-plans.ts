import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, ActionPlan, PaginatedActionPlans } from '@/types'

const ep = apiConfig.endpoints.actionPlans

// ── Admin ──────────────────────────────────────────────────────────────────

export interface ActionPlansQuery {
  status?:      string
  priority?:    string
  eventId?:     number
  meetingId?:   number
  assigneeId?:  number
  search?:      string
  dueDateFrom?: string
  dueDateTo?:   string
  page?:        number
  perPage?:     number
}

export async function listAdminActionPlans(query: ActionPlansQuery = {}): Promise<PaginatedActionPlans> {
  const res = await apiClient.get<ApiResponse<PaginatedActionPlans>>(ep.list, { params: query })
  return res.data.data
}

export async function createActionPlan(input: {
  title:       string
  description?: string | null
  eventId?:    number | null
  meetingId?:  number | null
  startDate?:  string | null
  dueDate?:    string | null
  priority:    string
  status:      string
  notes?:      string | null
}): Promise<ActionPlan> {
  const res = await apiClient.post<ApiResponse<ActionPlan>>(ep.create, input)
  return res.data.data
}

export async function getActionPlan(id: number): Promise<ActionPlan> {
  const res = await apiClient.get<ApiResponse<ActionPlan>>(ep.get(id))
  return res.data.data
}

export async function updateActionPlan(
  id: number,
  input: Partial<{
    title:       string
    description: string | null
    eventId:     number | null
    meetingId:   number | null
    startDate:   string | null
    dueDate:     string | null
    priority:    string
    status:      string
    notes:       string | null
  }>,
): Promise<ActionPlan> {
  const res = await apiClient.patch<ApiResponse<ActionPlan>>(ep.update(id), input)
  return res.data.data
}

export async function deleteActionPlan(id: number): Promise<void> {
  await apiClient.delete(ep.delete(id))
}

export async function addAssignees(id: number, userIds: number[]): Promise<ActionPlan> {
  const res = await apiClient.post<ApiResponse<ActionPlan>>(ep.assignees(id), { userIds })
  return res.data.data
}

export async function removeAssignee(id: number, userId: number): Promise<void> {
  await apiClient.delete(ep.removeAssignee(id, userId))
}

// ── Member ─────────────────────────────────────────────────────────────────

export interface MyActionPlansQuery {
  status?:   string
  priority?: string
  eventId?:  number
  search?:   string
  page?:     number
  perPage?:  number
}

export async function listMyActionPlans(query: MyActionPlansQuery = {}): Promise<PaginatedActionPlans> {
  const res = await apiClient.get<ApiResponse<PaginatedActionPlans>>(ep.myList, { params: query })
  return res.data.data
}
