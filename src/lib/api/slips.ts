import apiClient from './client'
import { apiConfig } from '@/config/api'
import type {
  ApiResponse, ContributionSlip, PaginatedSlips, CreateSlipInput,
  ManualPaymentInput, Payment, SlipPaymentInitiateInput, PaymentInitiateResponse,
} from '@/types'

const ep = apiConfig.endpoints.slip

export interface ListSlipsQuery {
  page?: number
  perPage?: number
  status?: 'open' | 'closed' | 'cancelled'
  eventId?: number
  search?: string
  mine?: boolean
}

export async function listSlips(query: ListSlipsQuery = {}): Promise<PaginatedSlips> {
  const res = await apiClient.get<ApiResponse<PaginatedSlips>>(ep.list, { params: query })
  return res.data.data
}

export async function getSlip(id: number): Promise<ContributionSlip> {
  const res = await apiClient.get<ApiResponse<ContributionSlip>>(ep.get(id))
  return res.data.data
}

export async function createSlip(input: CreateSlipInput): Promise<ContributionSlip> {
  const res = await apiClient.post<ApiResponse<ContributionSlip>>(ep.create, input)
  return res.data.data
}

export async function getDonorTypes(): Promise<string[]> {
  const res = await apiClient.get<ApiResponse<{ donorTypes: string[] }>>(ep.donorTypes)
  return res.data.data.donorTypes
}

export interface SlipMember {
  id: number
  name: string
  phone: string | null
  address: string | null
  memberId: string | null
  memberCategory: string | null
}

export async function getSlipMembers(): Promise<SlipMember[]> {
  const res = await apiClient.get<ApiResponse<SlipMember[]>>(ep.members)
  return res.data.data
}

/** Record a payment manually (money received offline). */
export async function addSlipPayment(slipId: number, input: ManualPaymentInput): Promise<Payment> {
  const res = await apiClient.post<ApiResponse<Payment>>(ep.addPayment(slipId), input)
  return res.data.data
}

export async function closeSlip(id: number): Promise<ContributionSlip> {
  const res = await apiClient.post<ApiResponse<ContributionSlip>>(ep.close(id), {})
  return res.data.data
}

export async function reopenSlip(id: number): Promise<ContributionSlip> {
  const res = await apiClient.post<ApiResponse<ContributionSlip>>(ep.reopen(id), {})
  return res.data.data
}

export async function cancelSlip(id: number): Promise<ContributionSlip> {
  const res = await apiClient.post<ApiResponse<ContributionSlip>>(ep.cancel(id), {})
  return res.data.data
}

/** Start an online (QR/cash/cheque) payment against a slip — returns the /pay nextUrl. */
export async function initiateSlipPayment(input: SlipPaymentInitiateInput): Promise<PaymentInitiateResponse> {
  const res = await apiClient.post<ApiResponse<PaymentInitiateResponse>>(apiConfig.endpoints.payment.initiate, input)
  return res.data.data
}
