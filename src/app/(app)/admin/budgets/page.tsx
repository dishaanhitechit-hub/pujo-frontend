'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  getBudgetCategories, getBudgetReport, getAllEventsBudgetSummary,
  createBudgetCategory, updateBudgetCategory, deleteBudgetCategory, reorderBudgetCategories,
} from '@/lib/api/budgets'
import { getDashboardEvents } from '@/lib/api/dashboard'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { BudgetCategory, BudgetReport, EventBudgetSummaryRow, EventStats, ApiError } from '@/types'
import {
  Plus, Pencil, Trash2, Loader2, Wallet, TrendingUp, AlertTriangle,
  ChevronUp, ChevronDown, ExternalLink, Search, X, CircleDollarSign,
} from 'lucide-react'

function fmt(v: string | number | null | undefined) {
  if (v === null || v === undefined) return '—'
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

function pct(v: number) {
  return `${v.toFixed(1)}%`
}

const categorySchema = z.object({
  title:         z.string().min(1, 'Title is required').max(200),
  plannedAmount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid amount'),
  notes:         z.string().optional(),
})
type CategoryForm = z.infer<typeof categorySchema>

// ── All-events overview table ──────────────────────────────────────────────────

function AllEventsSummary() {
  const [rows, setRows]       = useState<EventBudgetSummaryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllEventsBudgetSummary()
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 sm:p-16 text-center">
        <Wallet className="size-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No budget data found across any event.</p>
      </div>
    )
  }

  // column colour helpers
  function spentColor(u: number) {
    if (u < 75)  return 'text-red-400'
    if (u < 100) return 'text-red-500 font-semibold'
    return 'text-red-700 font-bold'
  }
  function balanceColor(row: EventBudgetSummaryRow) {
    if (!row.overBudget) return 'text-green-700 dark:text-green-400'
    if (row.utilizationPct > 125) return 'text-red-800 dark:text-red-300 font-bold'
    return 'text-red-600 font-semibold'
  }
  function barColor(u: number) {
    if (u > 100) return 'bg-red-600'
    if (u > 75)  return 'bg-amber-500'
    return 'bg-green-600'
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">All Events — Budget Overview</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Select an event above to manage its categories.</p>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-border">
        {rows.map((row) => (
          <div key={row.eventId} className="p-4 flex flex-col gap-3">
            <p className="font-semibold text-sm">
              {row.eventName}{row.eventYear ? ` ${row.eventYear}` : ''}
              {row.overBudget && (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">OVER</span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">Budget Planned</p>
                <p className="font-semibold text-brand-orange tabular-nums">{fmt(row.totalPlanned)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Total Collected</p>
                <p className="font-semibold text-amber-600 tabular-nums">{fmt(row.totalCollected)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Total Spent</p>
                <p className={`tabular-nums ${spentColor(row.utilizationPct)}`}>{fmt(row.totalSpent)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Budget Balance</p>
                <p className={`tabular-nums ${balanceColor(row)}`}>{fmt(Math.abs(Number(row.remaining)))}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${barColor(row.utilizationPct)}`} style={{ width: `${Math.min(row.utilizationPct, 100)}%` }} />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{row.utilizationPct.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {['Event', 'Budget Planned', 'Total Collected', 'Total Spent', 'Budget Balance', 'Utilization'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.eventId} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3 font-semibold whitespace-nowrap">
                  {row.eventName}{row.eventYear ? ` ${row.eventYear}` : ''}
                  {row.overBudget && (
                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 align-middle">OVER</span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums font-semibold text-brand-orange whitespace-nowrap">{fmt(row.totalPlanned)}</td>
                <td className="px-4 py-3 tabular-nums font-semibold text-amber-600 whitespace-nowrap">{fmt(row.totalCollected)}</td>
                <td className={`px-4 py-3 tabular-nums whitespace-nowrap ${spentColor(row.utilizationPct)}`}>{fmt(row.totalSpent)}</td>
                <td className={`px-4 py-3 tabular-nums whitespace-nowrap ${balanceColor(row)}`}>
                  {row.overBudget ? '-' : ''}{fmt(Math.abs(Number(row.remaining)))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                      <div className={`h-full rounded-full ${barColor(row.utilizationPct)}`} style={{ width: `${Math.min(row.utilizationPct, 100)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{row.utilizationPct.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Budget stat cards (dynamic colour) ────────────────────────────────────────

function BudgetStatCards({ report }: { report: BudgetReport }) {
  const u = report.totals.utilizationPct

  // Budget Planned — soft orange tint
  const plannedCard = {
    bg:     'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800/40',
    icon:   'bg-orange-100 dark:bg-orange-900/40 text-brand-orange',
    label:  'text-orange-600/80 dark:text-orange-400/70',
    value:  'text-brand-orange',
  }

  // Total Collected — amber/yellow
  const collectedCard = {
    bg:     'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/40',
    icon:   'bg-amber-100 dark:bg-amber-900/40 text-amber-600',
    label:  'text-amber-600/80 dark:text-amber-400/70',
    value:  'text-amber-700 dark:text-amber-400',
  }

  // Total Spent — intensity grows with utilisation
  const spentCard = u < 75
    ? { bg: 'bg-red-50 dark:bg-red-950/20',   border: 'border-red-100 dark:border-red-900/30',  icon: 'bg-red-100 dark:bg-red-900/30 text-red-400',  label: 'text-red-400/80',  value: 'text-red-400' }
    : u < 100
    ? { bg: 'bg-red-100 dark:bg-red-950/30',  border: 'border-red-200 dark:border-red-800/40',  icon: 'bg-red-200 dark:bg-red-900/40 text-red-500',  label: 'text-red-500/80',  value: 'text-red-500' }
    : { bg: 'bg-red-200 dark:bg-red-950/50',  border: 'border-red-400 dark:border-red-700/60',  icon: 'bg-red-300 dark:bg-red-800/60 text-red-700',  label: 'text-red-700/90',  value: 'text-red-700 font-extrabold' }

  // Budget Balance — green → red → deep red
  const balanceOver = report.totals.overBudget
  const balanceDeep = u > 125
  const balanceCard = !balanceOver
    ? { bg: 'bg-green-50 dark:bg-green-950/20',  border: 'border-green-200 dark:border-green-800/40', icon: 'bg-green-100 dark:bg-green-900/30 text-green-600', label: 'text-green-600/80', value: 'text-green-700 dark:text-green-400' }
    : balanceDeep
    ? { bg: 'bg-red-200 dark:bg-red-950/60',     border: 'border-red-600 dark:border-red-700',         icon: 'bg-red-400 dark:bg-red-800 text-white',           label: 'text-red-800/90 dark:text-red-300', value: 'text-red-900 dark:text-red-300 font-extrabold' }
    : { bg: 'bg-red-100 dark:bg-red-950/40',     border: 'border-red-300 dark:border-red-800/60',      icon: 'bg-red-200 dark:bg-red-900/40 text-red-600',      label: 'text-red-600/80',  value: 'text-red-600' }

  function Card({
    label, value, icon: Icon, card, sub,
  }: {
    label: string
    value: string
    icon: React.ElementType
    card: { bg: string; border: string; icon: string; label: string; value: string }
    sub?: React.ReactNode
  }) {
    return (
      <div className={`rounded-xl border p-4 sm:p-5 flex items-start gap-3 sm:gap-4 ${card.bg} ${card.border}`}>
        <div className={`size-8 sm:size-10 rounded-xl flex items-center justify-center shrink-0 ${card.icon}`}>
          <Icon className="size-4 sm:size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] sm:text-xs font-medium uppercase tracking-wider leading-tight ${card.label}`}>{label}</p>
          <p className={`font-heading font-bold text-lg sm:text-2xl mt-0.5 break-words leading-tight tabular-nums ${card.value}`}>{value}</p>
          {sub}
        </div>
      </div>
    )
  }

  // Utilisation bar colour
  const barColor = u > 100 ? 'bg-red-600' : u > 75 ? 'bg-amber-500' : 'bg-green-600'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      <Card label="Budget Planned"  value={fmt(report.totals.totalPlanned)}   icon={Wallet}           card={plannedCard}  />
      <Card label="Total Collected" value={fmt(report.totals.totalCollected)} icon={CircleDollarSign} card={collectedCard} />
      <Card label="Total Spent"     value={fmt(report.totals.totalActual)}    icon={TrendingUp}       card={spentCard}
        sub={u >= 100 && <p className="text-[10px] mt-1 flex items-center gap-0.5 text-red-600 font-semibold"><AlertTriangle className="size-3 shrink-0" />Over budget</p>}
      />
      <Card
        label={balanceOver ? (balanceDeep ? 'Way Over Budget' : 'Over Budget') : 'Budget Balance'}
        value={fmt(Math.abs(Number(report.totals.remaining)))}
        icon={balanceOver ? AlertTriangle : Wallet}
        card={balanceCard}
      />
      {/* Utilization */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <p className="text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 leading-tight">Utilization</p>
        <p className="font-heading font-bold text-lg sm:text-2xl tabular-nums leading-tight">{pct(u)}</p>
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(u, 100)}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function BudgetsPage() {
  return (
    <RoleGuard permission="event.manage">
      <BudgetsContent />
    </RoleGuard>
  )
}

function BudgetsContent() {
  const [events, setEvents]               = useState<EventStats[]>([])
  const [selectedEventId, setSelected]    = useState<number | null>(null)
  const [categories, setCategories]       = useState<BudgetCategory[]>([])
  const [report, setReport]               = useState<BudgetReport | null>(null)
  const [loading, setLoading]             = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)
  const [search, setSearch]               = useState('')
  const debouncedSearch                   = useDebouncedValue(search, 300)

  const [addOpen, setAddOpen]             = useState(false)
  const [editCat, setEditCat]             = useState<BudgetCategory | null>(null)
  const [deleteCat, setDeleteCat]         = useState<BudgetCategory | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    getDashboardEvents().then((d) => setEvents(d ?? [])).catch(() => {})
  }, [])

  const fetchCategories = useCallback(() => {
    if (!selectedEventId) { setCategories([]); return }
    setLoading(true)
    getBudgetCategories({ eventId: selectedEventId, search: debouncedSearch || undefined, perPage: 200 })
      .then((d) => setCategories(d.categories))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedEventId, debouncedSearch])

  const fetchReport = useCallback(() => {
    if (!selectedEventId) { setReport(null); return }
    setLoadingReport(true)
    getBudgetReport(selectedEventId)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoadingReport(false))
  }, [selectedEventId])

  useEffect(() => { fetchCategories(); fetchReport() }, [fetchCategories, fetchReport])

  async function handleDelete() {
    if (!deleteCat) return
    setDeleteLoading(true)
    try {
      await deleteBudgetCategory(deleteCat.id)
      setDeleteCat(null)
      fetchCategories(); fetchReport()
    } catch {
    } finally { setDeleteLoading(false) }
  }

  async function moveCategory(cat: BudgetCategory, dir: -1 | 1) {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx    = sorted.findIndex((c) => c.id === cat.id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const ids = sorted.map((c) => c.id)
    ;[ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]]
    await reorderBudgetCategories(selectedEventId!, ids)
    fetchCategories()
  }

  const sortedCats = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
      <PageHeader title="Budget" subtitle="Plan and track event budget by category." />

      {/* Event selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground font-semibold shrink-0">Event:</span>
        <button
          onClick={() => setSelected(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedEventId === null ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange'}`}
        >All</button>
        {events.map((s) => (
          <button
            key={s.event.id}
            onClick={() => setSelected(s.event.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${selectedEventId === s.event.id ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange'}`}
          >
            {s.event.name}{s.event.year ? ` ${s.event.year}` : ''}
          </button>
        ))}
      </div>

      {!selectedEventId ? (
        <AllEventsSummary />
      ) : (
        <>
          {/* Summary cards */}
          {loadingReport ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : report && (
            <BudgetStatCards report={report} />
          )}

          {/* Budget vs Actual */}
          {report && report.categories.length > 0 && (
            <div className="rounded-xl border border-border bg-card">
              <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center justify-between gap-3">
                <h3 className="font-semibold text-sm">Budget vs Actual</h3>
                <Link href={`/admin/expenses?eventId=${selectedEventId}`} className="text-xs text-brand-orange hover:underline flex items-center gap-1 shrink-0">
                  View Expenses <ExternalLink className="size-3" />
                </Link>
              </div>

              {/* Mobile cards (< sm) */}
              <div className="sm:hidden divide-y divide-border">
                {report.categories.map((row) => (
                  <div key={row.id} className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{row.title}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${row.overBudget ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                        {row.overBudget ? 'Over' : 'Under'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Planned</p>
                        <p className="font-semibold tabular-nums">{fmt(row.plannedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Actual</p>
                        <p className="font-semibold tabular-nums">{fmt(row.actualExpenses)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Remaining</p>
                        <p className={`font-semibold tabular-nums ${row.overBudget ? 'text-destructive' : 'text-green-700'}`}>
                          {row.overBudget ? '-' : ''}{fmt(Math.abs(Number(row.remaining)))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.overBudget ? 'bg-destructive' : 'bg-green-600'}`}
                          style={{ width: `${Math.min(row.utilizationPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{pct(row.utilizationPct)}</span>
                    </div>
                  </div>
                ))}
                {Number(report.unallocated.actualExpenses) > 0 && (
                  <div className="p-4 flex flex-col gap-1 bg-muted/5">
                    <span className="text-xs text-muted-foreground italic">Unallocated</span>
                    <span className="font-semibold tabular-nums text-sm">{fmt(report.unallocated.actualExpenses)}</span>
                  </div>
                )}
              </div>

              {/* Desktop table (sm+) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      {['Category', 'Planned', 'Actual', 'Remaining', 'Utilization', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.categories.map((row) => (
                      <tr key={row.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-medium">{row.title}</td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">{fmt(row.plannedAmount)}</td>
                        <td className="px-4 py-3 tabular-nums font-semibold whitespace-nowrap">{fmt(row.actualExpenses)}</td>
                        <td className={`px-4 py-3 tabular-nums font-semibold whitespace-nowrap ${row.overBudget ? 'text-destructive' : 'text-green-700'}`}>
                          {row.overBudget ? '-' : ''}{fmt(Math.abs(Number(row.remaining)))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                              <div className={`h-full rounded-full ${row.overBudget ? 'bg-destructive' : 'bg-green-600'}`} style={{ width: `${Math.min(row.utilizationPct, 100)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{pct(row.utilizationPct)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${row.overBudget ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                            {row.overBudget ? 'Over Budget' : 'Under Budget'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {Number(report.unallocated.actualExpenses) > 0 && (
                      <tr className="border-b border-border/50 last:border-0 bg-muted/5">
                        <td className="px-4 py-3 text-muted-foreground italic">Unallocated</td>
                        <td className="px-4 py-3 text-muted-foreground/40">—</td>
                        <td className="px-4 py-3 tabular-nums font-semibold whitespace-nowrap">{fmt(report.unallocated.actualExpenses)}</td>
                        <td colSpan={3} className="px-4 py-3 text-muted-foreground/40">—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Category list header */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4">
            <div className="relative w-full sm:flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories…"
                className="pl-8 h-8 text-xs"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 h-8 shrink-0 w-full sm:w-auto">
              <Plus className="size-4" /> Add Category
            </Button>
          </div>

          {/* Category list */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {loading ? (
              <div className="p-5 flex flex-col gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : sortedCats.length === 0 ? (
              <div className="py-14 text-center px-4">
                <Wallet className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No budget categories yet.</p>
                <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={() => setAddOpen(true)}>
                  <Plus className="size-4" /> Add First Category
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase w-14">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Planned</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Notes</th>
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCats.map((cat, idx) => (
                      <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <button disabled={idx === 0} onClick={() => moveCategory(cat, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none">
                              <ChevronUp className="size-4" />
                            </button>
                            <button disabled={idx === sortedCats.length - 1} onClick={() => moveCategory(cat, 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none">
                              <ChevronDown className="size-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{cat.title}</td>
                        <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">{fmt(cat.plannedAmount)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] hidden sm:table-cell">
                          {cat.notes
                            ? <span className="line-clamp-1" title={cat.notes}>{cat.notes}</span>
                            : <span className="text-muted-foreground/30">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditCat(cat)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive" onClick={() => setDeleteCat(cat)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {selectedEventId && (
        <CategoryModal
          open={addOpen}
          onOpenChange={setAddOpen}
          eventId={selectedEventId}
          onSuccess={() => { setAddOpen(false); fetchCategories(); fetchReport() }}
        />
      )}
      {editCat && (
        <CategoryModal
          open={!!editCat}
          onOpenChange={(o) => { if (!o) setEditCat(null) }}
          eventId={editCat.eventId}
          category={editCat}
          onSuccess={() => { setEditCat(null); fetchCategories(); fetchReport() }}
        />
      )}
      <ConfirmDialog
        open={!!deleteCat}
        onOpenChange={(o) => { if (!o) setDeleteCat(null) }}
        title="Delete Budget Category"
        description={deleteCat ? `Delete "${deleteCat.title}"? Expenses linked to this category will become Unallocated.` : ''}
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

// ── Category Modal ─────────────────────────────────────────────────────────────

function CategoryModal({
  open, onOpenChange, eventId, category, onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  eventId: number
  category?: BudgetCategory
  onSuccess: () => void
}) {
  const isEdit = !!category
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: isEdit
      ? { title: category.title, plannedAmount: category.plannedAmount, notes: category.notes ?? '' }
      : {},
  })

  useEffect(() => {
    if (open) {
      setServerError(null)
      reset(isEdit
        ? { title: category.title, plannedAmount: category.plannedAmount, notes: category.notes ?? '' }
        : {})
    }
  }, [open]) // eslint-disable-line

  async function onSubmit(data: CategoryForm) {
    setServerError(null)
    try {
      if (isEdit && category) {
        await updateBudgetCategory(category.id, { title: data.title, plannedAmount: data.plannedAmount, notes: data.notes || null })
      } else {
        await createBudgetCategory({ eventId, title: data.title, plannedAmount: data.plannedAmount, notes: data.notes || null })
      }
      onSuccess()
    } catch (err: unknown) {
      setServerError((err as ApiError).message ?? 'Something went wrong.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Category' : 'Add Budget Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-1">
          {serverError && (
            <div className="text-sm text-destructive rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2">{serverError}</div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bc-title">Category Title *</Label>
            <Input id="bc-title" placeholder="e.g. Decoration" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bc-amount">Planned Amount (₹) *</Label>
            <Input id="bc-amount" type="number" min="0" step="0.01" placeholder="0.00" {...register('plannedAmount')} />
            {errors.plannedAmount && <p className="text-xs text-destructive">{errors.plannedAmount.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bc-notes">Notes</Label>
            <textarea id="bc-notes" rows={2} placeholder="Optional notes…" {...register('notes')}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
          </div>
          <DialogFooter className="mt-2 flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
