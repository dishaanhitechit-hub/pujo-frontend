'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  getDashboardSummary, getDashboardCollectors, getDashboardPayments,
  getDashboardEvents, getEventReport,
} from '@/lib/api/dashboard'
import type { DashboardPaymentsQuery } from '@/lib/api/dashboard'
import type {
  DashboardSummary, CollectorBreakdown, PaginatedPayments, Payment,
  EventStats, EventReport, CollectionSummary, ApiError,
} from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { useAuth } from '@/lib/auth/auth-provider'
import { hasPermission, can, OVERSIGHT_ROLES } from '@/config/roles'
import type { Role } from '@/types'
import { StatCard } from '@/components/dashboard/StatCard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatusBadge, EventStatusBadge } from '@/components/shared/StatusBadge'
import { PaymentDetailDialog } from '@/components/shared/PaymentDetailDialog'
import { FilterChip } from '@/components/shared/FilterChip'
import { FilterModal, FilterButton, FilterField } from '@/components/shared/FilterModal'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  IndianRupee, Smartphone, Banknote, CheckCircle2, Clock, Users,
  ChevronLeft, ChevronRight, FileText, TrendingUp, Search, X, Loader2,
  ExternalLink, Calendar, ArrowLeft, Wallet, BarChart2, Receipt, AlertTriangle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { apiConfig } from '@/config/api'
import { DONOR_TYPES } from '@/constants'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function fmt(val: string | number) {
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

// ── View access options — controls which cells render as links vs plain text ──
interface ViewOptions {
  canManageEvents:      boolean  // link event name → /admin/events/{id}
  canViewDonors:        boolean  // link donor count → /donors?eventId=
  canViewPayments:      boolean  // link total received → /payments?eventId=
  canViewPledges:       boolean  // "View Pledges" links in Collection/Pledge cards
  canViewExpenses:      boolean  // link expenses → /admin/expenses?eventId=
  canViewReport:        boolean  // show the Report button and open the full Event Report
  canViewBudgetInReport: boolean // show budget planning totals inside the Expense Summary card
}

const FULL_ACCESS: ViewOptions = {
  canManageEvents:      true,
  canViewDonors:        true,
  canViewPayments:      true,
  canViewPledges:       true,
  canViewExpenses:      true,
  canViewReport:        true,
  canViewBudgetInReport: true,
}

function getViewOptions(role: Role): ViewOptions {
  const isOversight = OVERSIGHT_ROLES.includes(role)
  return {
    canManageEvents:      can(role, 'event.manage'),
    canViewDonors:        !isOversight && can(role, 'dashboard.view'),
    canViewPayments:      !isOversight && can(role, 'dashboard.view'),
    canViewPledges:       !isOversight && can(role, 'payment.view_receipt'),
    canViewExpenses:      can(role, 'expense.manage'),
    // All dashboard.view roles may open the report; collector/committee/general
    // have no dashboard.view so they are blocked at the RoleGuard level already.
    canViewReport:        can(role, 'dashboard.view'),
    // Budget planning data (Total Planned, Remaining, Utilization) is visible only
    // to event managers (admin) and oversight roles that review overall org finances.
    // Cashier registers expenses but does not own budget planning.
    canViewBudgetInReport: can(role, 'event.manage') || isOversight,
  }
}

export default function DashboardPage() {
  return (
    <RoleGuard permission="dashboard.view">
      <DashboardContent />
    </RoleGuard>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'admin') return <AdminDashboard />
  if (hasPermission(user.role, 'dashboard.view')) return <ReportingDashboard role={user.role} />
  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD — Event-first reporting
// ═══════════════════════════════════════════════════════════════════════════════

function AdminDashboard() {
  const [eventStats, setEventStats] = useState<EventStats[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  useEffect(() => {
    setLoadingEvents(true)
    getDashboardEvents()
      .then((d) => setEventStats(d ?? []))
      .catch(() => {})
      .finally(() => setLoadingEvents(false))
  }, [])

  if (selectedEventId !== null) {
    const ev = eventStats.find((s) => s.event.id === selectedEventId)
    return (
      <AdminEventReport
        eventId={selectedEventId}
        eventName={ev?.event.name ?? `Event #${selectedEventId}`}
        onBack={() => setSelectedEventId(null)}
      />
    )
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <PageHeader title="Dashboard" subtitle="Event-level collection and expense overview." />
      <EventOverviewTable
        eventStats={eventStats}
        loading={loadingEvents}
        onSelectEvent={setSelectedEventId}
      />
    </div>
  )
}

// ── Reporting Dashboard — cashier / managing_committee / executive ─────────────

function ReportingDashboard({ role }: { role: Role }) {
  const viewOpts = getViewOptions(role)
  const [eventStats, setEventStats]   = useState<EventStats[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  useEffect(() => {
    setLoadingEvents(true)
    getDashboardEvents()
      .then((d) => setEventStats(d ?? []))
      .catch(() => {})
      .finally(() => setLoadingEvents(false))
  }, [])

  if (selectedEventId !== null) {
    const ev = eventStats.find((s) => s.event.id === selectedEventId)
    return (
      <AdminEventReport
        eventId={selectedEventId}
        eventName={ev?.event.name ?? `Event #${selectedEventId}`}
        onBack={() => setSelectedEventId(null)}
        viewOpts={viewOpts}
      />
    )
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <PageHeader title="Dashboard" subtitle="Event-level collection and expense overview." />
      <EventOverviewTable
        eventStats={eventStats}
        loading={loadingEvents}
        onSelectEvent={setSelectedEventId}
        viewOpts={viewOpts}
      />
    </div>
  )
}

// ── Event Overview Table ───────────────────────────────────────────────────────

function EventOverviewTable({
  eventStats,
  loading,
  onSelectEvent,
  viewOpts = FULL_ACCESS,
}: {
  eventStats: EventStats[]
  loading: boolean
  onSelectEvent: (id: number) => void
  viewOpts?: ViewOptions
}) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = eventStats.filter((s) => {
    const matchSearch = !debouncedSearch ||
      s.event.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchStatus = !statusFilter || s.event.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border bg-muted/10">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="pl-8 h-8 text-xs"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {(['', 'draft', 'published', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${statusFilter === s ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange'}`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('') }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-5 flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          {eventStats.length === 0 ? 'No events yet.' : 'No events match the filter.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {[
                  'Event', 'Status', 'Donor Count', 'Donation Charge', 'Total Received',
                  'Pending', 'Expenses Paid', 'Balance in Hand', 'Budget', 'Budget Status',
                  ...(viewOpts.canViewReport ? ['Report'] : []),
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const overBudget = s.overBudget
                const budRem = s.budgetRemaining
                return (
                  <tr key={s.event.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      {viewOpts.canManageEvents ? (
                        <Link href={`/admin/events/${s.event.id}`} className="font-semibold text-foreground hover:text-brand-orange transition-colors">
                          {s.event.name}
                        </Link>
                      ) : (
                        <span className="font-semibold">{s.event.name}</span>
                      )}
                      {s.event.year && <div className="text-xs text-muted-foreground mt-0.5">{s.event.year}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <EventStatusBadge status={s.event.status as 'draft' | 'published' | 'archived'} />
                    </td>
                    <td className="px-4 py-3">
                      {viewOpts.canViewDonors ? (
                        <Link href={`/donors?eventId=${s.event.id}`} className="font-medium text-brand-navy hover:underline">
                          {s.donorCount}
                        </Link>
                      ) : (
                        <span className="font-medium">{s.donorCount}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{fmt(s.donationCharge)}</td>
                    <td className="px-4 py-3">
                      {viewOpts.canViewPayments ? (
                        <Link href={`/payments?eventId=${s.event.id}`} className="font-semibold hover:text-brand-orange transition-colors">
                          {fmt(s.totalReceived)}
                        </Link>
                      ) : (
                        <span className="font-semibold">{fmt(s.totalReceived)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-yellow-700 dark:text-yellow-400 font-medium">
                      {Number(s.pending) > 0 ? fmt(s.pending) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {viewOpts.canViewExpenses ? (
                        <Link href={`/admin/expenses?eventId=${s.event.id}`} className="font-medium text-foreground hover:text-brand-orange transition-colors">
                          {fmt(s.expensesPaid)}
                        </Link>
                      ) : (
                        <span className="font-medium">{fmt(s.expensesPaid)}</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${Number(s.balanceInHand) < 0 ? 'text-destructive' : 'text-green-700'}`}>{fmt(s.balanceInHand)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.budget ? fmt(s.budget) : <span className="text-muted-foreground/40 text-xs italic">not set</span>}
                    </td>
                    <td className="px-4 py-3">
                      {budRem === null ? (
                        <span className="text-muted-foreground/40 text-xs italic">—</span>
                      ) : overBudget ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                          <AlertTriangle className="size-3" />
                          ₹{Number(Math.abs(Number(budRem))).toLocaleString('en-IN')} over
                        </span>
                      ) : Number(budRem) === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">At Budget</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                          ₹{Number(budRem).toLocaleString('en-IN')} left
                        </span>
                      )}
                    </td>
                    {viewOpts.canViewReport && (
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => onSelectEvent(s.event.id)}
                        >
                          Report
                        </Button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Admin Event Report Panel ────────────────────────────────────────────────────

function AdminEventReport({
  eventId,
  eventName,
  onBack,
  viewOpts = FULL_ACCESS,
}: {
  eventId: number
  eventName: string
  onBack: () => void
  viewOpts?: ViewOptions
}) {
  const [report, setReport] = useState<EventReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setReport(null)
    getEventReport(eventId)
      .then(setReport)
      .catch((err: ApiError) => setError(err.message ?? 'Failed to load event report.'))
      .finally(() => setLoading(false))
  }, [eventId])

  const ev = report?.event
  const s = report?.summary

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 h-8 text-xs">
          <ArrowLeft className="size-3.5" /> All Events
        </Button>
        <div className="h-4 w-px bg-border" />
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Event Report</p>
          <h1 className="font-heading font-bold text-xl leading-tight">{eventName}</h1>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : report && s && (
        <>
          {/* A. Event Header meta */}
          {ev && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground -mt-2">
              {ev.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {ev.startDate}{ev.endDate && ev.endDate !== ev.startDate ? ` → ${ev.endDate}` : ''}
                </span>
              )}
              {ev.location && <span>{ev.location}</span>}
              <EventStatusBadge status={ev.status as 'draft' | 'published' | 'archived'} />
              {viewOpts.canManageEvents && (
                <Link href={`/admin/events/${eventId}`} className="text-brand-orange hover:underline text-xs flex items-center gap-1">
                  Event Settings <ExternalLink className="size-3" />
                </Link>
              )}
            </div>
          )}

          {/* B. Financial Position */}
          <section className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Financial Position</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Donation Charge" value={fmt(s.donationCharge)} icon={IndianRupee} />
              <StatCard label="Total Received" value={fmt(s.totalReceived)} icon={CheckCircle2} variant="primary" />
              <StatCard label="Pending" value={fmt(s.pending)} icon={Clock} variant={Number(s.pending) > 0 ? 'warning' : 'default'} />
              <StatCard label="Total Donors" value={s.donorCount} icon={Users} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Expenses Paid" value={fmt(s.expensesPaid)} icon={Receipt} />
              <StatCard label="Balance in Hand" value={fmt(s.balanceInHand)} icon={Wallet} variant={Number(s.balanceInHand) < 0 ? 'default' : 'success'} />
              {s.budget !== null && (
                <StatCard label="Budget" value={fmt(s.budget)} icon={BarChart2} />
              )}
              {s.budget !== null && s.budgetRemaining !== null && (
                <StatCard
                  label={s.overBudget ? 'Over Budget' : 'Budget Remaining'}
                  value={fmt(Math.abs(Number(s.budgetRemaining)))}
                  icon={s.overBudget ? AlertTriangle : TrendingUp}
                  variant={s.overBudget ? 'warning' : 'success'}
                />
              )}
            </div>
          </section>

          {/* C. Collection Summary */}
          <CollectionSummaryCard summary={report.collectionSummary} eventId={eventId} showLink={viewOpts.canViewPledges} />

          {/* D. Mode Breakdown + E. Pledge Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentModesCard modes={report.paymentModes} />
            <PledgeCard pledge={report.pledgeSummary} eventId={eventId} showLink={viewOpts.canViewPledges} />
          </div>

          {/* F. Collector Breakdown */}
          <CollectorBreakdownCard collectors={report.collectorBreakdown} />

          {/* G. Budget/Expense Summary */}
          {report.expenseSummary && (
            <ExpenseSummaryCard
              summary={report.expenseSummary}
              eventId={eventId}
              showManageLink={viewOpts.canViewExpenses}
              showBudgetDetails={viewOpts.canViewBudgetInReport}
            />
          )}
        </>
      )}
    </div>
  )
}

// ── Sub-cards ──────────────────────────────────────────────────────────────────

function CollectionSummaryCard({ summary, eventId, showLink = true }: { summary: CollectionSummary; eventId: number; showLink?: boolean }) {
  const tiles = [
    {
      label: 'Full Received',
      count: summary.fullCount,
      amount: summary.fullAmount,
      cls: 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900',
      labelCls: 'text-green-700 dark:text-green-400',
      valueCls: 'text-green-800 dark:text-green-300',
    },
    {
      label: 'Part Received',
      count: summary.partCount,
      amount: summary.partAmount,
      cls: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900',
      labelCls: 'text-yellow-700 dark:text-yellow-400',
      valueCls: 'text-yellow-800 dark:text-yellow-300',
    },
    {
      label: 'Pending',
      count: summary.pendingCount,
      amount: summary.pendingAmount,
      cls: 'border-border bg-muted/30',
      labelCls: 'text-muted-foreground',
      valueCls: 'text-foreground',
    },
    {
      label: 'Cancelled',
      count: summary.cancelledCount,
      amount: summary.cancelledAmount,
      cls: 'border-destructive/20 bg-destructive/5',
      labelCls: 'text-destructive',
      valueCls: 'text-destructive',
    },
  ]
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <CheckCircle2 className="size-4" /> Pledge Collection Summary
        </h3>
        {showLink && <Link href={`/pledges?eventId=${eventId}`} className="text-xs text-brand-orange hover:underline">View Pledges</Link>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className={`rounded-lg border p-3 ${t.cls}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${t.labelCls}`}>{t.label}</p>
            <p className={`font-bold text-xl mt-1 ${t.valueCls}`}>{t.count}</p>
            <p className={`text-xs mt-0.5 ${t.labelCls}`}>{fmt(t.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PaymentModesCard({ modes }: { modes: EventReport['paymentModes'] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Smartphone className="size-4" /> Collection by Mode</h3>
      {modes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No completed payments.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {modes.map((m) => (
            <div key={m.mode} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-xs font-bold uppercase text-muted-foreground">{m.mode}</span>
              <div className="text-right">
                <p className="font-semibold">{fmt(m.total)}</p>
                <p className="text-xs text-muted-foreground">{m.count} payment{m.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PledgeCard({ pledge, eventId, showLink = true }: { pledge: EventReport['pledgeSummary']; eventId: number; showLink?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2"><TrendingUp className="size-4" /> Pledge Summary</h3>
        {showLink && <Link href={`/pledges?eventId=${eventId}`} className="text-xs text-brand-orange hover:underline">View</Link>}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Total Pledged</p>
          <p className="font-semibold">{fmt(pledge.totalPledged)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="font-semibold text-green-700">{fmt(pledge.paid)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="font-semibold text-yellow-700">{fmt(pledge.outstanding)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Open Pledges</p>
          <p className="font-semibold">{pledge.openCount}</p>
        </div>
      </div>
    </div>
  )
}

function CollectorBreakdownCard({ collectors }: { collectors: EventReport['collectorBreakdown'] }) {
  const hasPledgeData = collectors.some((c) => c.fullCount !== undefined)
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Users className="size-4" /> Collector Breakdown</h3>
      {collectors.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No collections recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[520px]">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-muted-foreground font-semibold">Collector</th>
                <th className="pb-2 text-right text-muted-foreground font-semibold">Payments</th>
                {hasPledgeData && <>
                  <th className="pb-2 text-right text-green-700 font-semibold">Full</th>
                  <th className="pb-2 text-right text-yellow-700 font-semibold">Partial</th>
                  <th className="pb-2 text-right text-destructive font-semibold">Cancelled</th>
                </>}
                <th className="pb-2 text-right text-muted-foreground font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {collectors.map((c) => (
                <tr key={c.collector.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 font-medium">{c.collector.name}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{c.confirmedCount}</td>
                  {hasPledgeData && <>
                    <td className="py-2.5 text-right text-green-700 font-semibold">{c.fullCount ?? 0}</td>
                    <td className="py-2.5 text-right text-yellow-700 font-semibold">{c.partCount ?? 0}</td>
                    <td className="py-2.5 text-right text-destructive font-semibold">{c.cancelledCount ?? 0}</td>
                  </>}
                  <td className="py-2.5 text-right font-semibold">{fmt(c.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ExpenseSummaryCard({
  summary,
  eventId,
  showManageLink = true,
  showBudgetDetails = true,
}: {
  summary: EventReport['expenseSummary']
  eventId: number
  showManageLink?: boolean
  showBudgetDetails?: boolean
}) {
  const br = summary.budgetReport
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Receipt className="size-4" /> Expense Summary</h3>
        {showManageLink && (
          <Link href={`/admin/expenses?eventId=${eventId}`} className="text-xs text-brand-orange hover:underline flex items-center gap-1">
            Manage Expenses <ExternalLink className="size-3" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="font-semibold text-lg">{fmt(summary.totalExpenses)}</p>
        </div>
        {showBudgetDetails && br && (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Total Planned</p>
              <p className="font-semibold text-lg">{fmt(br.totals.totalPlanned)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{br.totals.overBudget ? 'Over Budget' : 'Remaining'}</p>
              <p className={`font-semibold text-lg ${br.totals.overBudget ? 'text-destructive' : 'text-green-700'}`}>
                {fmt(Math.abs(Number(br.totals.remaining)))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Utilization</p>
              <p className="font-semibold text-lg">{br.totals.utilizationPct.toFixed(1)}%</p>
            </div>
          </>
        )}
      </div>
      {summary.modeBreakdown.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">By Mode</p>
          <div className="flex flex-wrap gap-4">
            {summary.modeBreakdown.map((m) => (
              <div key={m.mode} className="text-sm">
                <span className="text-xs text-muted-foreground uppercase font-semibold mr-1">{m.mode}</span>
                <span className="font-semibold">{fmt(m.total)}</span>
                <span className="text-xs text-muted-foreground ml-1">({m.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// NON-ADMIN / COLLECTOR DASHBOARD — unchanged from original
// ═══════════════════════════════════════════════════════════════════════════════

function CollectorDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [collectors, setCollectors] = useState<CollectorBreakdown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventStats, setEventStats] = useState<EventStats[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  useEffect(() => {
    getDashboardEvents().then((data) => setEventStats(data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getDashboardSummary(selectedEventId ?? undefined),
      getDashboardCollectors(selectedEventId ?? undefined),
    ])
      .then(([s, c]) => { setSummary(s); setCollectors(c) })
      .catch((err: ApiError) => setError(err.message ?? 'Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [selectedEventId])

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
      </div>
    )
  }

  const selectedEvent = selectedEventId ? eventStats.find(s => s.event.id === selectedEventId)?.event : null
  const eventLabel = selectedEvent?.name ?? (selectedEventId ? `Event #${selectedEventId}` : null)

  const chartData = collectors.slice(0, 10).map((c) => ({
    name: c.collector.name.split(' ')[0],
    UPI: Number(c.upiTotal),
    Cash: Number(c.cashTotal),
    Cheque: Number(c.chequeTotal),
  }))

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        subtitle={eventLabel ? `Showing data for ${eventLabel}` : 'Overall collection overview across all events.'}
      />

      {eventStats.length > 0 && (
        <div className="flex flex-wrap gap-2 -mt-4 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedEventId(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${selectedEventId === null ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange'}`}
          >
            All Events
          </button>
          {eventStats.map((s) => (
            <button
              key={s.event.id}
              onClick={() => setSelectedEventId(selectedEventId === s.event.id ? null : s.event.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${selectedEventId === s.event.id ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange'}`}
            >
              {s.event.name}{s.event.year ? ` ${s.event.year}` : ''}
              {s.event.status === 'archived' && <span className="ml-1 opacity-60">·archived</span>}
            </button>
          ))}
        </div>
      )}

      {eventLabel && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-orange/10 border border-brand-orange/20 text-sm text-brand-orange font-medium -mt-4">
          <Calendar className="size-4 shrink-0" />
          Showing: {eventLabel}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="xl:col-span-2">
              <StatCard label="Grand Total" value={fmt(summary.grandTotal)} icon={IndianRupee} variant="primary" />
            </div>
            <StatCard label="UPI Total" value={fmt(summary.upiTotal)} icon={Smartphone} />
            <StatCard label="Cash Total" value={fmt(summary.cashTotal)} icon={Banknote} />
            <StatCard label="Cheque Total" value={fmt(summary.chequeTotal)} icon={FileText} />
            <StatCard label="Completed" value={summary.confirmedCount} icon={CheckCircle2} variant="success" />
            <StatCard label="Pending" value={summary.pendingCount} icon={Clock} variant="warning" />
            <StatCard label="Total Donors" value={summary.totalDonors} icon={Users} />
          </div>
          {(Number(summary.totalPledged) > 0 || summary.openPledgeCount > 0) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-4 flex items-center gap-2"><TrendingUp className="size-4" /> Pledge Summary{eventLabel ? ` · ${eventLabel}` : ''}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Total Pledged</p>
                  <p className="font-semibold text-lg">{fmt(summary.totalPledged)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Paid</p>
                  <p className="font-semibold text-lg text-green-700">{fmt(summary.totalPledgePaid)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Outstanding</p>
                  <p className="font-semibold text-lg text-yellow-700">{fmt(summary.totalPledgeOutstanding)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Open Pledges</p>
                  <p className="font-semibold text-lg">{summary.openPledgeCount}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedEventId === null ? (
          <EventComparisonTable eventStats={eventStats} loading={loading} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-sm mb-4">Collections by Mode{eventLabel ? ` · ${eventLabel}` : ''}</h2>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ left: -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="UPI" fill="oklch(0.638 0.211 35.2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cash" fill="oklch(0.55 0.11 138)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cheque" fill="oklch(0.55 0.14 260)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Users className="size-4" />
            Collections by Collector{eventLabel ? ` · ${eventLabel}` : ''}
          </h2>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : collectors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No collectors yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-muted-foreground font-semibold">Collector</th>
                    <th className="pb-2 text-right text-muted-foreground font-semibold">Total</th>
                    <th className="pb-2 text-right text-muted-foreground font-semibold hidden sm:table-cell">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {collectors.map((c) => (
                    <tr key={c.collector.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5">
                        <p className="font-medium">{c.collector.name}</p>
                        <p className="text-muted-foreground capitalize">{c.collector.role}</p>
                      </td>
                      <td className="py-2.5 text-right font-semibold">{fmt(c.grandTotal)}</td>
                      <td className="py-2.5 text-right text-muted-foreground hidden sm:table-cell">{c.confirmedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <DashboardPaymentsSection collectors={collectors} selectedEventId={selectedEventId} eventLabel={eventLabel} />
    </div>
  )
}

function EventComparisonTable({ eventStats, loading }: { eventStats: EventStats[]; loading: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <Calendar className="size-4" />
        All Events — Overview
      </h2>
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
      ) : eventStats.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No events yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-muted-foreground font-semibold">Event</th>
                <th className="pb-2 text-right text-muted-foreground font-semibold">Total</th>
                <th className="pb-2 text-right text-muted-foreground font-semibold hidden sm:table-cell">Payments</th>
                <th className="pb-2 text-right text-muted-foreground font-semibold hidden md:table-cell">Pledged</th>
              </tr>
            </thead>
            <tbody>
              {eventStats.map((s) => (
                <tr key={s.event.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium leading-snug">{s.event.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {s.event.year && <span className="text-muted-foreground">{s.event.year}</span>}
                      <EventStatusBadge status={s.event.status as 'draft' | 'published' | 'archived'} />
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-semibold">{fmt(s.totalReceived)}</td>
                  <td className="py-2.5 text-right text-muted-foreground hidden sm:table-cell">{s.paymentCount}</td>
                  <td className="py-2.5 text-right text-muted-foreground hidden md:table-cell">{fmt(s.totalPledged)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Dashboard payments section (unchanged) ─────────────────────────────────────

interface DashboardPaymentsSectionProps {
  collectors: CollectorBreakdown[]
  selectedEventId?: number | null
  eventLabel?: string | null
}

function DashboardPaymentsSection({ collectors, selectedEventId, eventLabel }: DashboardPaymentsSectionProps) {
  const [payments, setPayments] = useState<PaginatedPayments | null>(null)
  const [page, setPage] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [method, setMethod] = useState<'upi' | 'cash' | 'cheque' | ''>('')
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired' | 'cancelled' | ''>('')
  const [collectorId, setCollectorId] = useState('')
  const [donorType, setDonorType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [draftCollectorId, setDraftCollectorId] = useState('')
  const [draftDonorType, setDraftDonorType] = useState('')
  const [draftDateFrom, setDraftDateFrom] = useState('')
  const [draftDateTo, setDraftDateTo] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  const reqRef = useRef(0)
  const hasDataRef = useRef(false)

  useEffect(() => { setPage(1) }, [selectedEventId])

  const searchSyncedRef = useRef(false)
  useEffect(() => {
    if (!searchSyncedRef.current) { searchSyncedRef.current = true; return }
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    const req = ++reqRef.current
    if (!hasDataRef.current) setLoading(true)
    setIsFetching(true)
    setError(null)

    const query: DashboardPaymentsQuery = {
      page, perPage: 10,
      search: debouncedSearch || undefined,
      method: method || undefined,
      status: status || undefined,
      collectorId: collectorId ? Number(collectorId) : undefined,
      eventId: selectedEventId ?? undefined,
      donorType: donorType || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }

    getDashboardPayments(query)
      .then((result) => { if (req === reqRef.current) { hasDataRef.current = true; setPayments(result) } })
      .catch((err: ApiError) => { if (req === reqRef.current) setError(err.message ?? 'Failed to load payments.') })
      .finally(() => { if (req === reqRef.current) { setLoading(false); setIsFetching(false) } })
  }, [page, debouncedSearch, method, status, collectorId, donorType, dateFrom, dateTo, selectedEventId])

  function applyAdvanced() {
    setCollectorId(draftCollectorId); setDonorType(draftDonorType)
    setDateFrom(draftDateFrom); setDateTo(draftDateTo)
    setPage(1); setSheetOpen(false)
  }

  function resetAdvanced() {
    setDraftCollectorId(''); setDraftDonorType(''); setDraftDateFrom(''); setDraftDateTo('')
    setCollectorId(''); setDonorType(''); setDateFrom(''); setDateTo('')
    setPage(1)
  }

  const advancedActiveCount = [collectorId, donorType, dateFrom, dateTo].filter(Boolean).length
  const collectorName = collectors.find(c => String(c.collector.id) === collectorId)?.collector.name

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">
            Recent Payment History{eventLabel ? ` · ${eventLabel}` : ''}
          </h2>
          {isFetching && !loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        </div>
        <Link href="/payments" className="text-xs text-brand-orange hover:underline font-medium flex items-center gap-1">
          View All <ExternalLink className="size-3" />
        </Link>
      </div>

      <div className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search donor, collector…" className="pl-8 h-8 text-xs" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Mode:</span>
          {(['', 'upi', 'cash', 'cheque'] as const).map((m) => (
            <button key={m} onClick={() => { setMethod(m); setPage(1) }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${method === m ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange'}`}>
              {m === '' ? 'All' : m.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Status:</span>
          {(['', 'pending', 'completed', 'cancelled', 'expired'] as const).map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${status === s ? 'bg-brand-navy text-white' : 'bg-muted text-muted-foreground hover:bg-brand-navy/10 hover:text-brand-navy'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <FilterButton onClick={() => { setDraftCollectorId(collectorId); setDraftDonorType(donorType); setDraftDateFrom(dateFrom); setDraftDateTo(dateTo); setSheetOpen(true) }} activeCount={advancedActiveCount} className="ml-auto h-8 text-xs" />
        <FilterModal open={sheetOpen} onOpenChange={setSheetOpen} title="Payment Filters" onApply={applyAdvanced} onReset={resetAdvanced}>
          {collectors.length > 0 && (
            <FilterField label="Collector" wide>
              <select value={draftCollectorId} onChange={(e) => setDraftCollectorId(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">All Collectors</option>
                {collectors.map((c) => <option key={c.collector.id} value={String(c.collector.id)}>{c.collector.name}</option>)}
              </select>
            </FilterField>
          )}
          <FilterField label="Donor Type" wide>
            <select value={draftDonorType} onChange={(e) => setDraftDonorType(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All Types</option>
              {DONOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FilterField>
          <FilterField label="Date from"><Input type="date" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} className="h-8 text-sm" /></FilterField>
          <FilterField label="Date to"><Input type="date" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} className="h-8 text-sm" /></FilterField>
        </FilterModal>
      </div>

      {(collectorId || donorType || dateFrom || dateTo) && (
        <div className="px-5 py-2 flex flex-wrap gap-2 border-b border-border bg-muted/10">
          {collectorId && <FilterChip label={`Collector: ${collectorName ?? collectorId}`} onRemove={() => { setCollectorId(''); setDraftCollectorId(''); setPage(1) }} />}
          {donorType && <FilterChip label={`Type: ${donorType}`} onRemove={() => { setDonorType(''); setDraftDonorType(''); setPage(1) }} />}
          {dateFrom && <FilterChip label={`From: ${dateFrom}`} onRemove={() => { setDateFrom(''); setDraftDateFrom(''); setPage(1) }} />}
          {dateTo && <FilterChip label={`To: ${dateTo}`} onRemove={() => { setDateTo(''); setDraftDateTo(''); setPage(1) }} />}
        </div>
      )}

      {error ? (
        <div className="p-6 text-sm text-destructive">{error}</div>
      ) : loading ? (
        <div className="p-4 flex flex-col gap-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : !payments || payments.payments.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">No payments match the current filters.</div>
      ) : (
        <>
          <div className={`overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Donor</th>
                  {selectedEventId === null && <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event</th>}
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Collector</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mode</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <button onClick={() => setSelectedPayment(p)} className="font-medium text-left hover:text-brand-orange transition-colors cursor-pointer">
                        {p.donor.name}
                      </button>
                      {p.donor.phone && <p className="text-xs text-muted-foreground">{p.donor.phone}</p>}
                    </td>
                    {selectedEventId === null && <td className="px-5 py-3 text-xs text-muted-foreground">{p.event?.name ?? <span className="text-muted-foreground/40">—</span>}</td>}
                    <td className="px-5 py-3 text-muted-foreground">{p.collector.name}</td>
                    <td className="px-5 py-3 font-semibold">{fmt(p.amount)}</td>
                    <td className="px-5 py-3"><span className="text-xs font-bold uppercase">{p.method}</span></td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3">
                      {p.receiptNo ? (
                        <a href={`${apiConfig.baseUrl}${apiConfig.backendPages.payReceipt(p.id)}?from=dashboard`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-orange hover:underline font-medium">
                          {p.receiptNo}
                        </a>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Page {payments.page} of {payments.pages} · {payments.total} payments</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= payments.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}
      <PaymentDetailDialog payment={selectedPayment} open={!!selectedPayment} onOpenChange={(o) => { if (!o) setSelectedPayment(null) }} />
    </div>
  )
}
