export type Role = 'admin' | 'executive' | 'committee' | 'general'
export type PaymentMethod = 'upi' | 'cash'
export type PaymentStatus = 'pending' | 'confirmed' | 'expired'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  upiId: string | null
  whatsappNo: string | null
  role: Role
  isActive: boolean
  createdAt: string
}

export interface Donor {
  id: number
  name: string
  phone: string | null
  address: string | null
  notes: string | null
  createdAt: string
}

export interface Collector {
  id: number
  name: string
  role: Role
}

export interface Payment {
  id: number
  receiptNo?: string
  donor: Donor
  collector: Collector
  amount: string
  method: PaymentMethod
  utrNumber?: string | null
  status: PaymentStatus
  whatsappSent?: boolean
  confirmedAt?: string | null
  receiptPdfPath?: string | null
  createdAt: string
}

export interface CollectorSummary {
  cashTotal: string
  upiTotal: string
  grandTotal: string
  confirmedCount: number
}

export interface CollectorBreakdown {
  collector: Collector
  cashTotal: string
  upiTotal: string
  grandTotal: string
  confirmedCount: number
}

export interface DashboardSummary {
  cashTotal: string
  upiTotal: string
  grandTotal: string
  confirmedCount: number
  pendingCount: number
  totalDonors: number
}

export interface PaginatedPayments {
  payments: Payment[]
  page: number
  perPage: number
  total: number
  pages: number
}

export interface AdminConfig {
  upi_id: string
  org_name: string
}

export interface AdminConfigResponse {
  config: AdminConfig
  allowedKeys: Record<string, string>
}

export interface ApiResponse<T> {
  message: string
  data: T
}

export interface ApiError {
  status: number
  message: string
  fieldErrors?: Record<string, string>
  code?: string
}

export interface PaymentInitiateInput {
  donor_name: string
  donor_phone?: string
  donor_address?: string
  donor_notes?: string
  amount: string
  method: PaymentMethod
}

export interface PaymentInitiateResponse {
  paymentId: number
  method: PaymentMethod
  amount: string
  donorName: string
  status: PaymentStatus
  nextUrl: string
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  phone?: string | null
  upiId?: string | null
  whatsappNo?: string | null
  role: Role
}

export interface UpdateUserInput {
  name?: string
  phone?: string | null
  upiId?: string | null
  whatsappNo?: string | null
  role?: Role
  password?: string
  isActive?: boolean
}
