export const TOKEN_KEY = 'pujopay_token'
export const USER_KEY = 'pujopay_user'

export const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
] as const

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  expired: 'Expired',
} as const

export const PAYMENT_STATUS_COLORS = {
  pending: 'warning',
  completed: 'success',
  expired: 'destructive',
} as const

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export const DONOR_TYPES = [
  'House-to-House',
  'Shop at Local Market',
  'General Member',
  'Executive Member',
  'Corporate Sponsor',
  'Running Public',
  'Other Donation',
  'Advertisement',
  'Prefer Not to Disclose',
] as const
