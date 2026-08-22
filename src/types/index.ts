export type Role = 'admin' | 'executive' | 'committee' | 'general'
export type PaymentMethod = 'upi' | 'cash' | 'cheque'
export type PaymentStatus = 'pending' | 'completed' | 'expired' | 'cancelled'
export type PledgeStatus = 'open' | 'complete' | 'cancelled'
export type TokenType = 'single' | 'dual' | 'bulk'
export type TokenStatus = 'active' | 'void'
export type EventStatus = 'draft' | 'published' | 'archived'

export interface EventDay {
  id: number
  key: string          // e.g. "saptami"
  label: string        // e.g. "Maha Saptami"
  date: string | null
  description: string | null
  rituals: string[]
  sortOrder: number
}

export interface EventSummary {
  id: number
  name: string
  slug: string
  year: number | null
  status: EventStatus
  collectionEnabled: boolean
  isFeatured: boolean
  startDate: string | null
  endDate: string | null
}

export interface Event extends EventSummary {
  description: string | null
  location: string | null
  coverImagePath: string | null
  createdBy: { id: number; name: string } | null
  createdAt: string
  updatedAt: string | null
  days?: EventDay[]
}

export interface EventStats {
  event: { id: number; name: string; year: number | null; status: EventStatus }
  grandTotal: string
  paymentCount: number
  totalPledged: string
  pledgeOutstanding: string
}

export interface PaginatedEvents {
  events: Event[]
  page: number
  perPage: number
  total: number
  pages: number
}

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
  event?: { id: number; name: string } | null
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
  chequeTotal: string
  grandTotal: string
  confirmedCount: number
  pendingCount: number
}

export interface CollectorBreakdown {
  collector: Collector
  cashTotal: string
  upiTotal: string
  chequeTotal: string
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
  event?: { id: number; name: string } | null
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
  perPage: number
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

// ── Public API types (no auth, no admin fields) ─────────────────────────────

export interface PublicEventDay {
  id: number
  key: string
  label: string
  date: string | null
  description: string | null
  rituals: string[]
  sortOrder: number
}

export interface PublicGalleryItem {
  id: number
  url: string       // absolute path e.g. /media/events/3/gallery/abc.jpg
  altText: string | null
  sortOrder: number
  mimeType: string
}

export interface PublicEvent {
  id: number
  name: string
  slug: string
  description: string | null
  startDate: string | null   // YYYY-MM-DD
  endDate: string | null     // YYYY-MM-DD
  location: string | null
  year: number | null
  isFeatured: boolean
  coverImageUrl: string | null  // /media/... path
}

export interface PublicEventDetail extends PublicEvent {
  days: PublicEventDay[]
  gallery: PublicGalleryItem[]
}

export interface PublicEventsList {
  events: PublicEvent[]
  page: number
  perPage: number
  total: number
  pages: number
}

export interface PublicCommitteeMember {
  id: number
  name: string
  roleTitle: string
  phone: string | null
  photoUrl: string | null   // /media/... path
  sortOrder: number
}

export interface PublicAnnouncement {
  id: number
  title: string
  body: string
  event: { id: number; name: string; slug: string } | null
  publishedAt: string | null
}

export interface PublicSiteConfig {
  upiId: string | null
  orgName: string | null
  contact: {
    phone: string | null
    email: string | null
    whatsapp: string | null
  }
  social: {
    facebook: string | null
    instagram: string | null
    youtube: string | null
  }
}

// ── Shared ────────────────────────────────────────────────────────────────────

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
  eventId: number
}

export interface PaymentInitiateResponse {
  paymentId: number
  method: PaymentMethod
  amount: string
  donorName: string
  status: PaymentStatus
  pledgeId: number | null
  eventId: number
  nextUrl: string
}

export interface CreatePledgeInput {
  eventId: number
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
