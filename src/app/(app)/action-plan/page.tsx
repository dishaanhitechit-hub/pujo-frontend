'use client'

import { useEffect, useState } from 'react'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterButton, FilterModal, FilterField } from '@/components/shared/FilterModal'
import { FilterChip } from '@/components/shared/FilterChip'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { listMyActionPlans } from '@/lib/api/action-plans'
import { ClipboardList, Calendar, Search, X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import type { ActionPlan, ActionPlanStatus, ActionPlanPriority, PaginatedActionPlans } from '@/types'

const STATUS_LABELS: Record<ActionPlanStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
  on_hold:     'On Hold',
  cancelled:   'Cancelled',
}

const PRIORITY_LABELS: Record<ActionPlanPriority, string> = {
  low:    'Low',
  medium: 'Medium',
  high:   'High',
  urgent: 'Urgent',
}

const STATUS_COLORS: Record<ActionPlanStatus, string> = {
  not_started: 'bg-slate-50 text-slate-500 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed:   'bg-green-50 text-green-700 border-green-200',
  on_hold:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  cancelled:   'bg-red-50 text-red-500 border-red-200',
}

const PRIORITY_COLORS: Record<ActionPlanPriority, string> = {
  low:    'bg-slate-50 text-slate-500 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high:   'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
}

export default function ActionPlanPage() {
  return (
    <RoleGuard>
      <ActionPlanContent />
    </RoleGuard>
  )
}

function ActionPlanContent() {
  const [data, setData]             = useState<PaginatedActionPlans | null>(null)
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const PER_PAGE = 20

  const [search, setSearch]               = useState('')
  const debouncedSearch                   = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter]   = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [draftStatus, setDraftStatus]     = useState('')
  const [draftPriority, setDraftPriority] = useState('')
  const [filterOpen, setFilterOpen]       = useState(false)

  useEffect(() => {
    setLoading(true)
    listMyActionPlans({
      status:   statusFilter || undefined,
      priority: priorityFilter || undefined,
      search:   debouncedSearch || undefined,
      page,
      perPage:  PER_PAGE,
    })
      .then(setData)
      .finally(() => setLoading(false))
  }, [statusFilter, priorityFilter, debouncedSearch, page])

  useEffect(() => { setPage(1) }, [statusFilter, priorityFilter, debouncedSearch])

  function fmtDate(iso: string | null) {
    if (!iso) return null
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  function isDueSoon(iso: string | null): boolean {
    if (!iso) return false
    const due  = new Date(iso + 'T00:00:00')
    const now  = new Date()
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 3
  }

  function isOverdue(iso: string | null): boolean {
    if (!iso) return false
    return new Date(iso + 'T00:00:00') < new Date()
  }

  const activeFilterCount = [statusFilter, priorityFilter].filter(Boolean).length
  const plans = data?.actionPlans ?? []
  const pages = data?.pages ?? 1
  const total = data?.total ?? 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="My Responsibilities"
        subtitle="Action plans you are assigned to."
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans…"
            className="pl-8 h-8 text-xs"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <FilterButton
          onClick={() => { setDraftStatus(statusFilter); setDraftPriority(priorityFilter); setFilterOpen(true) }}
          activeCount={activeFilterCount}
          className="h-8 text-xs"
        />

        <FilterModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter Plans"
          onApply={() => { setStatusFilter(draftStatus); setPriorityFilter(draftPriority); setFilterOpen(false) }}
          onReset={() => { setDraftStatus(''); setDraftPriority(''); setStatusFilter(''); setPriorityFilter(''); setFilterOpen(false) }}
        >
          <FilterField label="Status">
            <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FilterField>
          <FilterField label="Priority">
            <select value={draftPriority} onChange={(e) => setDraftPriority(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All</option>
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FilterField>
        </FilterModal>
      </div>

      {/* Filter chips */}
      {(statusFilter || priorityFilter) && (
        <div className="flex flex-wrap gap-2">
          {statusFilter && <FilterChip label={`Status: ${STATUS_LABELS[statusFilter as ActionPlanStatus] ?? statusFilter}`} onRemove={() => setStatusFilter('')} />}
          {priorityFilter && <FilterChip label={`Priority: ${PRIORITY_LABELS[priorityFilter as ActionPlanPriority] ?? priorityFilter}`} onRemove={() => setPriorityFilter('')} />}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <ClipboardList className="size-10 opacity-30" />
          <p className="text-sm">
            {activeFilterCount > 0 || debouncedSearch
              ? 'No plans match your filters.'
              : 'You have no assigned responsibilities yet.'}
          </p>
          {(activeFilterCount > 0 || debouncedSearch) && (
            <Button size="sm" variant="outline" onClick={() => { setStatusFilter(''); setPriorityFilter(''); setSearch('') }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {total} plan{total !== 1 ? 's' : ''}
            {(activeFilterCount > 0 || debouncedSearch) && ` (filtered)`}
          </p>

          <div className="flex flex-col gap-3">
            {plans.map((p) => {
              const overdue = p.status !== 'completed' && p.status !== 'cancelled' && isOverdue(p.dueDate)
              const dueSoon = !overdue && p.status !== 'completed' && p.status !== 'cancelled' && isDueSoon(p.dueDate)
              return (
                <div key={p.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-snug flex-1 min-w-0">{p.title}</h3>
                    <div className="flex gap-1 flex-wrap shrink-0">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[p.priority]}`}>
                        {PRIORITY_LABELS[p.priority]}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.description}</p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {p.dueDate && (
                      <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : dueSoon ? 'text-orange-600 font-medium' : ''}`}>
                        {(overdue || dueSoon) && <AlertCircle className="size-3" />}
                        <Calendar className="size-3" />
                        Due: {fmtDate(p.dueDate)}
                        {overdue && ' (overdue)'}
                        {dueSoon && ' (due soon)'}
                      </span>
                    )}
                    {p.event && <span>{p.event.name}</span>}
                    {p.meeting && <span>Meeting: {p.meeting.title}</span>}
                  </div>

                  {p.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{p.notes}</p>
                  )}
                </div>
              )
            })}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
