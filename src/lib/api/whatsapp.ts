import apiClient from './client'

export interface WaBulkResult {
  sent: number
  failed: number
  errors: { userId: number; name: string; error: string }[]
}

export async function waSendMembershipCard(
  userId: number,
  imageBase64: string,
): Promise<{ messageId: string; phone: string }> {
  const { data } = await apiClient.post(`/api/whatsapp/send-membership-card/${userId}`, { imageBase64 })
  return data.data
}

export async function waNotifyEvent(
  eventId: number,
  payload: { userIds: number[] } | { all: true },
): Promise<WaBulkResult> {
  const { data } = await apiClient.post(`/api/whatsapp/notify-event/${eventId}`, payload)
  return data.data
}

export async function waNotifyCircular(
  circularId: number,
  payload: { userIds: number[] } | { all: true },
): Promise<WaBulkResult> {
  const { data } = await apiClient.post(`/api/whatsapp/notify-circular/${circularId}`, payload)
  return data.data
}

export async function waSendPaymentReceipt(
  paymentId: number,
  phone?: string,
): Promise<{ messageId: string; phone: string }> {
  const { data } = await apiClient.post(`/api/whatsapp/send-receipt/${paymentId}`, phone ? { phone } : {})
  return data.data
}
