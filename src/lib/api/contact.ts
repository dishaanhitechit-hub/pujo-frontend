import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, ContactQuery, ContactQueryList, ContactQueryStatus } from '@/types'

export async function listContactQueries(params: {
  page?: number
  perPage?: number
  status?: ContactQueryStatus | ''
  search?: string
}): Promise<ContactQueryList> {
  const qs = new URLSearchParams()
  if (params.page)    qs.set('page',    String(params.page))
  if (params.perPage) qs.set('perPage', String(params.perPage))
  if (params.status)  qs.set('status',  params.status)
  if (params.search)  qs.set('search',  params.search)
  const res = await apiClient.get<ApiResponse<ContactQueryList>>(
    `${apiConfig.endpoints.contact.queries}?${qs.toString()}`,
  )
  return res.data.data
}

export async function getContactQuery(id: number): Promise<ContactQuery> {
  const res = await apiClient.get<ApiResponse<ContactQuery>>(
    apiConfig.endpoints.contact.queryDetail(id),
  )
  return res.data.data
}

export async function updateContactQueryStatus(
  id: number,
  status: ContactQueryStatus,
): Promise<ContactQuery> {
  const res = await apiClient.patch<ApiResponse<ContactQuery>>(
    apiConfig.endpoints.contact.queryStatus(id),
    { status },
  )
  return res.data.data
}
