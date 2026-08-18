export const TOKEN_KEY = 'pujopay_token'
export const USER_KEY = 'pujopay_user'

export const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
] as const

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  expired: 'Expired',
} as const

export const PAYMENT_STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'success',
  expired: 'destructive',
} as const

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
