import apiClient from './client'
import { apiConfig } from '@/config/api'
import type { ApiResponse, PaymentInitiateInput, PaymentInitiateResponse, Payment } from '@/types'

export async function initiatePayment(input: PaymentInitiateInput): Promise<PaymentInitiateResponse> {
  const res = await apiClient.post<ApiResponse<PaymentInitiateResponse>>(
    apiConfig.endpoints.payment.initiate,
    input,
  )
  return res.data.data
}

export async function getPaymentReceipt(id: number): Promise<Payment> {
  const res = await apiClient.get<ApiResponse<Payment>>(apiConfig.endpoints.payment.receipt(id))
  return res.data.data
}
