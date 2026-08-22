export type Role = 'admin' | 'executive' | 'committee' | 'general'
export type PaymentMethod = 'upi' | 'cash' | 'cheque'
export type PaymentStatus = 'pending' | 'confirmed' | 'expired' | 'cancelled'
export type PledgeStatus = 'open' | 'complete' | 'cancelled'
export type TokenType = 'single' | 'dual' | 'bulk'
export type TokenStatus = 'active' | 'void'

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
  donorType: string | null
  createdAt: string
}

export interface DonorWithStats extends Donor {
  totalDonated: string
  confirmedCount: number
  lastDonatedAt: string | null
}

export interface Collector {
  id: number
  name: string
  role?: Role
}

export interface Payment {
  id: number
  receiptNo?: string
  donor: Donor
  collector: Collector
  amount: string
  method: PaymentMethod
  utrNumber?: string | null
  chequeNumber?: string | null
  bankName?: string | null
  chequeDate?: string | null
  pledgeId?: number | null
  status: PaymentStatus
  whatsappSent?: boolean
  confirmedAt?: string | null
  cancelledAt?: string | null
  receiptPdfPath?: string | null
  createdAt: string
}

export interface CollectorSummary {
  cashTotal: string
  upiTotal: string
  grandTotal: string
  confirmedCount: number
  pendingCount: number
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
  chequeTotal: string
  grandTotal: string
  confirmedCount: number
  pendingCount: number
  totalDonors: number
  totalPledged: string
  totalPledgePaid: string
  totalPledgeOutstanding: string
  openPledgeCount: number
}

export interface PaginatedPayments {
  payments: Payment[]
  page: number
  perPage: number
  total: number
  pages: number
}

export interface Pledge {
  id: number
  donor: Donor
  collector: Collector
  totalAmount: string
  paidAmount: string
  outstandingAmount: string
  status: PledgeStatus
  notes: string | null
  createdAt: string
}

export interface PledgeDetail {
  pledge: Pledge
  payments: Payment[]
}

export interface PaginatedPledges {
  pledges: Pledge[]
  page: number
  perPage: number
  total: number
  pages: number
}

export interface Token {
  id: number
  tokenNo: string
  slNo: number
  type: TokenType
  status: TokenStatus
  participantName: string | null
  topic: string | null
  orgName: string | null
  generatedBy: { id: number; name: string }
  generatedAt: string
  batchId: string | null
  printUrl: string
  viewUrl: string
}

export interface BulkTokenResponse {
  batchId: string
  count: number
  tokens: Token[]
  printUrl: string
}

export interface PaginatedTokens {
  tokens: Token[]
  total: number
  page: number
  pages: number
}

export interface PaginatedDonors {
  donors: DonorWithStats[]
  page: number
  perPage: number
  total: number
  pages: number
}

export interface DonorDetail {
  donor: DonorWithStats
  payments: Payment[]
}

export interface TokenConfig {
  tokenPrefix: string
  tokenSuffix: string
  tokenPadWidth: string
  tokenStartNumber: string
  tokenCurrentNumber: string | null
  tokenDefaultTopic: string
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
  success: boolean
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
  donorName: string
  donorPhone?: string
  donorAddress?: string
  donorNotes?: string
  donorType: string
  amount: string
  method: PaymentMethod
  pledgeId?: number | null
}

export interface PaymentInitiateResponse {
  paymentId: number
  method: PaymentMethod
  amount: string
  donorName: string
  status: PaymentStatus
  pledgeId: number | null
  nextUrl: string
}

export interface CreatePledgeInput {
  donorName: string
  donorPhone?: string
  donorAddress?: string
  donorNotes?: string
  donorType?: string
  totalAmount: string
  notes?: string
}

export interface PledgePayInput {
  amount: string
  method: PaymentMethod
}

export interface GenerateTokenInput {
  type: 'single' | 'dual'
  participantName: string
  topic?: string
}

export interface BulkTokenInput {
  count: number
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
