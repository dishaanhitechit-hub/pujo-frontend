'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/lib/api/expenses'
import { getBudgetCategories } from '@/lib/api/budgets'
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
import type {
  Expense, PaginatedExpenses, BudgetCategory, EventStats, ApiError,
  CreateExpenseInput, UpdateExpenseInput, PaymentMethod,
} from '@/types'
import {
  Plus, Pencil, Trash2, Loader2, Receipt, Search, X,
  ChevronLeft, ChevronRight as ChevronRightIcon, Filter,
} from 'lucide-react'

function fmt(v: string | number | null | undefined) {
  if (v === null || v === undefined) return '—'
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

const MODE_LABELS: Record<PaymentMethod, string> = { cash: 'Cash', upi: 'UPI', cheque: 'Cheque' }
const MODE_COLORS: Record<PaymentMethod, string> = {
  cash:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  upi:    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  cheque: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

const expenseSchema = z.object({
  eventId:          z.string().min(1, 'Event is required'),
  budgetCategoryId: z.string().optional(),
  purpose:          z.string().min(1, 'Purpose is required').max(300),
  mode:             z.enum(['cash', 'upi', 'cheque']),
  amount:           z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  expenseDate:      z.string().min(1, 'Date is required'),
  notes:            z.string().optional(),
})
type ExpenseForm = z.infer<typeof expenseSchema>

export default function ExpensesPage() {
  return (
    <RoleGuard permission="expense.manage">
      <ExpensesContent />
    </RoleGuard>
  )
}

function ExpensesContent() {
  const [events, setEvents]               = useState<EventStats[]>([])
  const [data, setData]                   = useState<PaginatedExpenses | null>(null)
  const [loading, setLoading]             = useState(false)
  const [categories, setCategories]       = useState<BudgetCategory[]>([])

  const [filterEvent, setFilterEvent]     = useState('')
  const [filterCat, setFilterCat]         = useState('')
  const [filterMode, setFilterMode]       = useState('')
  const [search, setSearch]               = useState('')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')
  const [page, setPage]                   = useState(1)
  const [showFilters, setShowFilters]     = useState(false)

  const debouncedSearch = useDebouncedValue(search, 350)

  const [addOpen, setAddOpen]             = useState(false)
  const [editExp, setEditExp]             = useState<Expense | null>(null)
  const [deleteExp, setDeleteExp]         = useState<Expense | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    getDashboardEvents().then((d) => setEvents(d ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!filterEvent) { setCategories([]); setFilterCat(''); return }
    getBudgetCategories({ eventId: Number(filterEvent), perPage: 200 })
      .then((d) => setCategories(d.categories))
      .catch(() => setCategories([]))
  }, [filterEvent])

  const fetchExpenses = useCallback(() => {
    setLoading(true)
    const params: Record<string, string | number> = { page, perPage: 20 }
    if (filterEvent)     params.eventId          = Number(filterEvent)
    if (filterCat)       params.budgetCategoryId = Number(filterCat)
    if (filterMode)      params.mode             = filterMode
    if (debouncedSearch) params.search           = debouncedSearch
    if (dateFrom)        params.dateFrom         = dateFrom
    if (dateTo)          params.dateTo           = dateTo

    getExpenses(params as Parameters<typeof getExpenses>[0])
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [page, filterEvent, filterCat, filterMode, debouncedSearch, dateFrom, dateTo])

  useEffect(() => { setPage(1) }, [filterEvent, filterCat, filterMode, debouncedSearch, dateFrom, dateTo])
  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  async function handleDelete() {
    if (!deleteExp) return
    setDeleteLoading(true)
    try {
      await deleteExpense(deleteExp.id)
      setDeleteExp(null)
      fetchExpenses()
    } catch {
    } finally { setDeleteLoading(false) }
  }

  function clearFilters() {
    setFilterEvent(''); setFilterCat(''); setFilterMode('')
    setDateFrom(''); setDateTo(''); setSearch('')
  }

  const hasActiveFilters = !!(filterEvent || filterCat || filterMode || dateFrom || dateTo || search)
  const summary = data?.summary

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
      <PageHeader title="Expenses" subtitle="Track all event expenses across categories." />

      {/* Summary cards */}
      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total + count always shown */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
            <p className="font-semibold text-lg sm:text-xl tabular-nums break-all">{fmt(summary.totalExpenses)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Count</p>
            <p className="font-semibold text-lg sm:text-xl tabular-nums">{summary.expenseCount}</p>
          </div>
          {/* Mode breakdown — up to 2 modes shown as cards */}
          {summary.modeBreakdown.slice(0, 2).map((b) => (
            <div key={b.mode} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground mb-1">{MODE_LABELS[b.mode]}</p>
              <p className="font-semibold text-lg sm:text-xl tabular-nums break-all">{fmt(b.total)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{b.count} entry</p>
            </div>
          ))}
          {/* Extra modes (3rd+) shown as a small inline row below on mobile */}
          {summary.modeBreakdown.length > 2 && (
            <div className="col-span-2 lg:col-span-4 flex flex-wrap gap-3">
              {summary.modeBreakdown.slice(2).map((b) => (
                <div key={b.mode} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 min-w-[140px]">
                  <div>
                    <p className="text-xs text-muted-foreground">{MODE_LABELS[b.mode]}</p>
                    <p className="font-semibold tabular-nums whitespace-nowrap">{fmt(b.total)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">{b.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses…"
            className="pl-8 h-8 text-xs"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Button
          size="sm"
          variant={showFilters ? 'secondary' : 'outline'}
          className="gap-1.5 h-8 relative"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="size-3.5" /> Filters
          {hasActiveFilters && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-brand-orange" />}
        </Button>

        {hasActiveFilters && (
          <Button size="sm" variant="ghost" className="h-8 text-muted-foreground gap-1.5" onClick={clearFilters}>
            <X className="size-3.5" /> Clear
          </Button>
        )}

        <Button size="sm" className="gap-1.5 h-8 ml-auto shrink-0" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> Add Expense
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Event</Label>
            <select
              value={filterEvent}
              onChange={(e) => { setFilterEvent(e.target.value); setFilterCat('') }}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs focus:outline-none focus:border-ring"
            >
              <option value="">All Events</option>
              {events.map((s) => (
                <option key={s.event.id} value={s.event.id}>
                  {s.event.name}{s.event.year ? ` ${s.event.year}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">Category</Label>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              disabled={!filterEvent}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs focus:outline-none focus:border-ring disabled:opacity-40"
            >
              <option value="">All Categories</option>
              <option value="0">Unallocated</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">Mode</Label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs focus:outline-none focus:border-ring"
            >
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">From Date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs" />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">To Date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-5 flex flex-col gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : !data || data.expenses.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Receipt className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No expenses found.</p>
            <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add First Expense
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile cards (< sm) */}
            <div className="sm:hidden divide-y divide-border">
              {data.expenses.map((exp) => (
                <div key={exp.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{exp.purpose}</p>
                      {exp.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{exp.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditExp(exp)}><Pencil className="size-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive" onClick={() => setDeleteExp(exp)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MODE_COLORS[exp.mode]}`}>{MODE_LABELS[exp.mode]}</span>
                    {exp.budgetCategory
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium">{exp.budgetCategory.title}</span>
                      : <span className="text-xs text-muted-foreground/50 italic">Unallocated</span>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums font-semibold text-foreground">{fmt(exp.amount)}</span>
                    <span>{exp.expenseDate}</span>
                    <span><EventName events={events} eventId={exp.eventId} /></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table (sm+) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Purpose</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Mode</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Added By</th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-medium line-clamp-1" title={exp.purpose}>{exp.purpose}</p>
                        {exp.notes && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{exp.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap"><EventName events={events} eventId={exp.eventId} /></td>
                      <td className="px-4 py-3 text-xs">
                        {exp.budgetCategory
                          ? <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium whitespace-nowrap">{exp.budgetCategory.title}</span>
                          : <span className="text-muted-foreground/50 italic whitespace-nowrap">Unallocated</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${MODE_COLORS[exp.mode]}`}>{MODE_LABELS[exp.mode]}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">{fmt(exp.amount)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{exp.expenseDate}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{exp.createdBy?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditExp(exp)}><Pencil className="size-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive" onClick={() => setDeleteExp(exp)}><Trash2 className="size-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border gap-2">
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  Page {data.page} of {data.pages} · {data.total} total
                </p>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="size-7" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" className="size-7" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
                    <ChevronRightIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <ExpenseModal
        open={addOpen}
        onOpenChange={setAddOpen}
        events={events}
        defaultEventId={filterEvent ? Number(filterEvent) : undefined}
        onSuccess={() => { setAddOpen(false); fetchExpenses() }}
      />
      {editExp && (
        <ExpenseModal
          open={!!editExp}
          onOpenChange={(o) => { if (!o) setEditExp(null) }}
          events={events}
          expense={editExp}
          onSuccess={() => { setEditExp(null); fetchExpenses() }}
        />
      )}
      <ConfirmDialog
        open={!!deleteExp}
        onOpenChange={(o) => { if (!o) setDeleteExp(null) }}
        title="Delete Expense"
        description={deleteExp ? `Delete "${deleteExp.purpose}" (${fmt(deleteExp.amount)})?` : ''}
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function EventName({ events, eventId }: { events: EventStats[]; eventId: number }) {
  const ev = events.find((s) => s.event.id === eventId)
  if (!ev) return <span>{eventId}</span>
  return <span>{ev.event.name}{ev.event.year ? ` ${ev.event.year}` : ''}</span>
}

// ── Expense Modal ─────────────────────────────────────────────────────────────

function ExpenseModal({
  open, onOpenChange, events, expense, defaultEventId, onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  events: EventStats[]
  expense?: Expense
  defaultEventId?: number
  onSuccess: () => void
}) {
  const isEdit = !!expense
  const [serverError, setServerError]   = useState<string | null>(null)
  const [categories, setCategories]     = useState<BudgetCategory[]>([])
  const [loadingCats, setLoadingCats]   = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: isEdit
      ? {
          eventId:          String(expense.eventId),
          budgetCategoryId: expense.budgetCategoryId ? String(expense.budgetCategoryId) : '',
          purpose:          expense.purpose,
          mode:             expense.mode,
          amount:           expense.amount,
          expenseDate:      expense.expenseDate,
          notes:            expense.notes ?? '',
        }
      : {
          eventId:     defaultEventId ? String(defaultEventId) : '',
          mode:        'cash',
          expenseDate: new Date().toISOString().slice(0, 10),
        },
  })

  const watchedEventId = watch('eventId')

  useEffect(() => {
    if (open) {
      setServerError(null)
      reset(isEdit
        ? {
            eventId:          String(expense!.eventId),
            budgetCategoryId: expense!.budgetCategoryId ? String(expense!.budgetCategoryId) : '',
            purpose:          expense!.purpose,
            mode:             expense!.mode,
            amount:           expense!.amount,
            expenseDate:      expense!.expenseDate,
            notes:            expense!.notes ?? '',
          }
        : {
            eventId:     defaultEventId ? String(defaultEventId) : '',
            mode:        'cash',
            expenseDate: new Date().toISOString().slice(0, 10),
          })
    }
  }, [open]) // eslint-disable-line

  useEffect(() => {
    if (!watchedEventId) { setCategories([]); return }
    setLoadingCats(true)
    getBudgetCategories({ eventId: Number(watchedEventId), perPage: 200 })
      .then((d) => setCategories(d.categories))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false))
  }, [watchedEventId])

  async function onSubmit(data: ExpenseForm) {
    setServerError(null)
    try {
      if (isEdit && expense) {
        const payload: UpdateExpenseInput = {
          budgetCategoryId: data.budgetCategoryId ? Number(data.budgetCategoryId) : null,
          purpose:     data.purpose,
          mode:        data.mode as PaymentMethod,
          amount:      data.amount,
          expenseDate: data.expenseDate,
          notes:       data.notes || null,
        }
        await updateExpense(expense.id, payload)
      } else {
        const payload: CreateExpenseInput = {
          eventId:          Number(data.eventId),
          budgetCategoryId: data.budgetCategoryId ? Number(data.budgetCategoryId) : null,
          purpose:     data.purpose,
          mode:        data.mode as PaymentMethod,
          amount:      data.amount,
          expenseDate: data.expenseDate,
          notes:       data.notes || null,
        }
        await createExpense(payload)
      }
      onSuccess()
    } catch (err: unknown) {
      setServerError((err as ApiError).message ?? 'Something went wrong.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-1">
          {serverError && (
            <div className="text-sm text-destructive rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2">{serverError}</div>
          )}

          {isEdit ? (
            <div className="flex flex-col gap-1.5">
              <Label>Event</Label>
              <p className="text-sm text-muted-foreground px-3 py-2 rounded-lg border border-border bg-muted/30">
                <EventName events={events} eventId={expense!.eventId} />
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-eventId">Event *</Label>
              <select
                id="exp-eventId"
                {...register('eventId')}
                onChange={(e) => { setValue('eventId', e.target.value); setValue('budgetCategoryId', '') }}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:border-ring"
              >
                <option value="">Select event…</option>
                {events.map((s) => (
                  <option key={s.event.id} value={s.event.id}>
                    {s.event.name}{s.event.year ? ` ${s.event.year}` : ''}
                  </option>
                ))}
              </select>
              {errors.eventId && <p className="text-xs text-destructive">{errors.eventId.message}</p>}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-category">Budget Category</Label>
            <select
              id="exp-category"
              {...register('budgetCategoryId')}
              disabled={!watchedEventId || loadingCats}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:border-ring disabled:opacity-40"
            >
              <option value="">Unallocated</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {loadingCats && <p className="text-xs text-muted-foreground">Loading categories…</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-purpose">Purpose *</Label>
            <Input id="exp-purpose" placeholder="e.g. Stage decoration" {...register('purpose')} />
            {errors.purpose && <p className="text-xs text-destructive">{errors.purpose.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-mode">Mode *</Label>
              <select
                id="exp-mode"
                {...register('mode')}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:border-ring"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-amount">Amount (₹) *</Label>
              <Input id="exp-amount" type="number" min="0.01" step="0.01" placeholder="0.00" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-date">Expense Date *</Label>
            <Input id="exp-date" type="date" {...register('expenseDate')} />
            {errors.expenseDate && <p className="text-xs text-destructive">{errors.expenseDate.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exp-notes">Notes</Label>
            <textarea
              id="exp-notes"
              rows={2}
              placeholder="Optional notes…"
              {...register('notes')}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <DialogFooter className="mt-2 flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
