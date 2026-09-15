export type Role =
  | 'admin'
  | 'managing_committee'
  | 'core_committee'
  | 'executive'
  | 'cashier'
  | 'collector'
  // Legacy values — kept for backward-compat with existing DB records
  | 'committee'
  | 'general'
export type PaymentMethod = 'upi' | 'cash' | 'cheque'
export type PaymentStatus = 'pending' | 'completed' | 'expired' | 'cancelled'
export type PledgeStatus = 'open' | 'complete' | 'cancelled'
export type TokenType = 'single' | 'dual' | 'bulk'
export type TokenStatus = 'active' | 'void'
export type EventStatus = 'draft' | 'published' | 'archived'

export interface ActivityItem {
  time: string        // HH:MM (24h) or empty string
  name: string
  description?: string  // optional note shown beneath the activity name
}

export interface EventDay {
  id: number
  key: string          // e.g. "saptami"
  label: string        // e.g. "Maha Saptami"
  date: string | null
  description: string | null
  rituals: string[]    // backward compat — names only
  activities: ActivityItem[]
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
  budget?: string | null
  budgetNotes?: string | null
}

export interface EventStats {
  event: {
    id: number
    name: string
    year: number | null
    status: EventStatus
    startDate: string | null
    endDate: string | null
  }
  // collection totals
  donorCount: number
  donationCharge: string
  totalReceived: string
  pending: string
  paymentCount: number
  totalPledged: string
  pledgeOutstanding: string
  // expense & budget (requires event.manage; present when expenses table exists)
  expensesPaid: string
  balanceInHand: string
  budget: string | null
  budgetRemaining: string | null
  overBudget: boolean
}

// ── Budget Categories ─────────────────────────────────────────────────────────

export interface BudgetCategory {
  id: number
  eventId: number
  title: string
  plannedAmount: string
  notes: string | null
  sortOrder: number
  createdBy: { id: number; name: string } | null
  createdAt: string
  updatedAt: string | null
}

export interface BudgetCategoryRow extends BudgetCategory {
  actualExpenses: string
  expenseCount: number
  remaining: string
  overBudget: boolean
  utilizationPct: number
}

export interface BudgetReport {
  categories: BudgetCategoryRow[]
  unallocated: { actualExpenses: string; expenseCount: number }
  totals: {
    totalPlanned: string
    totalCollected: string
    totalActual: string
    remaining: string
    overBudget: boolean
    utilizationPct: number
  }
}

export interface EventBudgetSummaryRow {
  eventId: number
  eventName: string
  eventYear: number | null
  totalPlanned: string
  totalCollected: string
  totalSpent: string
  remaining: string
  overBudget: boolean
  utilizationPct: number
}

export interface PaginatedBudgetCategories {
  categories: BudgetCategory[]
  page: number
  perPage: number
  total: number
  pages: number
}

export interface CreateBudgetCategoryInput {
  eventId: number
  title: string
  plannedAmount: string
  notes?: string | null
  sortOrder?: number
}

export interface UpdateBudgetCategoryInput {
  title?: string
  plannedAmount?: string
  notes?: string | null
  sortOrder?: number
}

// ── Expense / Budget ──────────────────────────────────────────────────────────

export interface Expense {
  id: number
  eventId: number
  budgetCategoryId: number | null
  budgetCategory: { id: number; title: string } | null
  purpose: string
  mode: PaymentMethod
  amount: string
  expenseDate: string
  notes: string | null
  createdBy: { id: number; name: string } | null
  createdAt: string
  updatedAt: string | null
}

export interface ExpenseSummary {
  totalExpenses: string
  expenseCount: number
  modeBreakdown: { mode: PaymentMethod; total: string; count: number }[]
}

export interface PaginatedExpenses {
  expenses: Expense[]
  page: number
  perPage: number
  total: number
  pages: number
  summary: ExpenseSummary
}

export interface CreateExpenseInput {
  eventId: number
  budgetCategoryId?: number | null
  purpose: string
  mode: PaymentMethod
  amount: string
  expenseDate: string
  notes?: string | null
}

export interface UpdateExpenseInput {
  budgetCategoryId?: number | null
  purpose?: string
  mode?: PaymentMethod
  amount?: string
  expenseDate?: string
  notes?: string | null
}

// ── Event Report ──────────────────────────────────────────────────────────────

export interface EventReportSummary {
  donorCount: number
  donationCharge: string
  totalPledged: string
  totalReceived: string
  pending: string
  pendingAmount: string
  cancelledAmount: string
  budget: string | null
  expensesPaid: string
  balanceInHand: string
  budgetRemaining: string | null
  overBudget: boolean
  completedCount: number
  pendingCount: number
  openPledgeCount: number
  pledgeOutstanding: string
  pledgePaid: string
}

export interface CollectionSummary {
  fullCount: number
  fullAmount: string
  partCount: number
  partAmount: string
  pendingCount: number
  pendingAmount: string
  cancelledCount: number
  cancelledAmount: string
}

export interface EventReport {
  event: Event
  collectionSummary: CollectionSummary
  summary: EventReportSummary
  paymentModes: { mode: PaymentMethod; count: number; total: string }[]
  paymentStatusBreakdown: { status: PaymentStatus | 'completed'; count: number; total: string }[]
  collectorBreakdown: CollectorBreakdown[]
  pledgeSummary: {
    totalPledged: string
    paid: string
    outstanding: string
    openCount: number
  }
  expenseSummary: {
    totalExpenses: string
    modeBreakdown: { mode: PaymentMethod; total: string; count: number }[]
    budgetReport: BudgetReport | null
  }
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
  email: string | null
  phone: string | null
  whatsappNo: string | null
  address: string | null
  role: Role
  isActive: boolean
  canCollect: boolean
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
  fullCount?: number
  partCount?: number
  cancelledCount?: number
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
  upiId: string
  orgName: string
  contactPhone?: string
  contactEmail?: string
  contactWhatsapp?: string
  contactAddress?: string
  socialFacebook?: string
  socialInstagram?: string
  socialYoutube?: string
  contributionUpiId?: string
  contributionBankName?: string
  contributionAccountName?: string
  contributionAccountNumber?: string
  contributionIfsc?: string
  contributionBankBranch?: string
}

export interface AdminConfigResponse {
  config: Record<string, string>
  allowedKeys: Record<string, string>
}

// ── Admin Announcement ────────────────────────────────────────────────────────

export interface AdminAnnouncement {
  id: number
  title: string
  body: string
  event: { id: number; name: string } | null
  isPublished: boolean
  publishedAt: string | null
  createdBy: { id: number; name: string } | null
  createdAt: string | null
}

// ── Circular ──────────────────────────────────────────────────────────────────

export interface Circular {
  id: number
  title: string
  body: string
  circularNo: string | null
  event: { id: number; name: string } | null
  isPublished: boolean
  publishedAt: string | null
  createdBy: { id: number; name: string } | null
  createdAt: string | null
  updatedAt: string | null
}

export interface PaginatedCirculars {
  circulars: Circular[]
  page: number
  pages: number
  total: number
  perPage: number
}

// ── Admin Committee Member ────────────────────────────────────────────────────

export interface AdminCommitteeMember {
  id: number
  event: { id: number; name: string } | null
  name: string
  roleTitle: string
  phone: string | null
  photoPath: string | null
  sortOrder: number
  isActive: boolean
}

// ── Public API types (no auth, no admin fields) ─────────────────────────────

export interface PublicEventDay {
  id: number
  key: string
  label: string
  date: string | null
  description: string | null
  rituals: string[]         // backward compat — names only
  activities: ActivityItem[]
  sortOrder: number
}

export interface PublicStats {
  donorCount: number      // total donors ever recorded
  oldestYear: number | null  // earliest published event year, null if none set
}

export interface PublicGalleryItem {
  id: number
  url: string       // absolute path e.g. /media/events/3/gallery/abc.jpg
  altText: string | null
  sortOrder: number
  mimeType: string
}

export interface PublicGalleryImage extends PublicGalleryItem {
  event: {
    id: number
    name: string
    slug: string
    isFeatured: boolean
  }
}

export interface PublicGalleryResponse {
  images: PublicGalleryImage[]
  total: number
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
  days?: PublicEventDay[]       // present when ?includeDays=true
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
    address: string | null
  }
  support: {
    title: string | null
    description: string | null
    whatsappMessage: string | null
  }
  social: {
    facebook: string | null
    instagram: string | null
    youtube: string | null
  }
}

// ── Contact Queries ───────────────────────────────────────────────────────────

export type ContactQueryStatus = 'new' | 'read' | 'resolved'

export interface ContactQuery {
  id: number
  name: string
  phone: string
  location: string | null
  message: string
  status: ContactQueryStatus
  createdAt: string
}

export interface ContactQueryInput {
  name: string
  phone: string
  location?: string
  message: string
}

export interface ContactQueryList {
  queries: ContactQuery[]
  page: number
  perPage: number
  total: number
  pages: number
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export type MeetingType      = 'general' | 'emergency' | 'committee' | 'agm' | 'other'
export type MeetingStatus    = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type AgendaItemStatus = 'open' | 'closed' | 'tabled'

export interface Meeting {
  id:          number
  title:       string
  description: string | null
  date:        string        // YYYY-MM-DD
  startTime:   string        // HH:MM
  endTime:     string        // HH:MM
  venue:       string | null
  meetingType: MeetingType
  status:      MeetingStatus
  event:       { id: number; name: string } | null
  createdBy:   { id: number; name: string } | null
  createdAt:   string
  updatedAt:   string | null
  invitees?:   MeetingInvitee[]
}

export interface MeetingInvitee {
  id:             number
  meetingId:      number
  user:           { id: number; name: string; role: string } | null
  invitationType: string
  createdAt:      string | null
}

export interface PaginatedMeetings {
  meetings: Meeting[]
  page:     number
  perPage:  number
  total:    number
  pages:    number
}

export interface MeetingAgendaItem {
  id:          number
  meetingId:   number
  title:       string
  description: string | null
  sortOrder:   number
  owner:       { id: number; name: string } | null
  status:      AgendaItemStatus
  createdAt:   string | null
  updatedAt:   string | null
}

export interface MeetingDiscussion {
  id:                 number
  meetingId:          number
  agendaItemId:       number | null
  content:            string
  isVisibleToMembers: boolean
  createdBy:          { id: number; name: string } | null
  createdAt:          string | null
  updatedAt:          string | null
}

export interface AttendanceStatus {
  phase:     'before' | 'open' | 'marked' | 'closed'
  startTime: string
  endTime:   string
  markedAt:  string | null
}

// ── Action Plans ──────────────────────────────────────────────────────────────

export type ActionPlanPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ActionPlanStatus   = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'

export interface ActionPlan {
  id:          number
  title:       string
  description: string | null
  event:       { id: number; name: string } | null
  meeting:     { id: number; title: string } | null
  startDate:   string | null
  dueDate:     string | null
  priority:    ActionPlanPriority
  status:      ActionPlanStatus
  notes:       string | null
  createdBy:   { id: number; name: string } | null
  createdAt:   string | null
  updatedAt:   string | null
  assignees:   ActionPlanAssignee[]
}

export interface ActionPlanAssignee {
  id:           number
  actionPlanId: number
  user:         { id: number; name: string; role: string } | null
  assignedAt:   string | null
  assignedBy:   { id: number; name: string } | null
}

export interface PaginatedActionPlans {
  actionPlans: ActionPlan[]
  page:        number
  perPage:     number
  total:       number
  pages:       number
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
  role: Role
  phone: string
  whatsappNo?: string | null
  email?: string | null
  address?: string | null
  password: string
  canCollect?: boolean
}

export interface UpdateUserInput {
  name?: string
  role?: Role
  phone?: string | null
  whatsappNo?: string | null
  email?: string | null
  address?: string | null
  password?: string
  isActive?: boolean
  canCollect?: boolean
}

// ── Self Contributions ─────────────────────────────────────────────────────

export type ContributionPaymentMethod = 'cash' | 'upi' | 'bank_transfer'
export type ContributionStatus = 'pending' | 'approved' | 'rejected'

export interface Contribution {
  id: number
  amount: number
  paymentMethod: ContributionPaymentMethod
  paymentDate: string
  paymentTime: string | null
  note: string | null
  status: ContributionStatus
  adminNote: string | null
  hasScreenshot: boolean
  screenshotUrl: string | null
  event: { id: number; name: string; slug: string } | null
  user: { id: number; name: string; role: string } | null
  reviewer: { id: number; name: string } | null
  reviewedAt: string | null
  createdAt: string
}

export interface ContributionList {
  contributions: Contribution[]
  page: number
  pages: number
  total: number
  perPage: number
}

export interface ContributionStats {
  totalApproved: number
  approvedCount: number
  pendingCount: number
}

export interface PaymentInfo {
  upi: { id: string | null; qrUrl: string | null }
  bank: {
    bankName: string | null
    accountName: string | null
    accountNumber: string | null
    ifsc: string | null
    branch: string | null
  }
}
