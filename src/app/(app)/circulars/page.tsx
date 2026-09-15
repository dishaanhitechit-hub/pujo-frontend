'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Search, X, ScrollText, ChevronLeft, ChevronRight, Calendar, Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { FilterButton, FilterModal, FilterField } from '@/components/shared/FilterModal'
import { FilterChip } from '@/components/shared/FilterChip'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth/auth-provider'
import { listPublishedCirculars } from '@/lib/api/circulars'
import { listPublicEvents } from '@/lib/api/public'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { Circular, ApiError } from '@/types'

export default function CircularsPage() {
  const { token, isLoading } = useAuth()
  const router = useRouter()

  const [items, setItems]   = useState<Circular[]>([])
  const [total, setTotal]   = useState(0)
  const [pages, setPages]   = useState(1)
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  // Search
  const [search, setSearch]   = useState('')
  const debouncedSearch       = useDebouncedValue(search, 350)

  // Filters
  const [filterOpen, setFilterOpen]   = useState(false)
  const [eventFilter, setEventFilter] = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [draftEvent, setDraftEvent]   = useState('')
  const [draftFrom, setDraftFrom]     = useState('')
  const [draftTo, setDraftTo]         = useState('')
  const [events, setEvents]           = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    if (isLoading) return
    if (!token) { router.replace('/login'); return }
    // load events for filter
    listPublicEvents(1, 50).then((r) => setEvents(r?.events ?? [])).catch(() => {})
  }, [isLoading, token, router])

  useEffect(() => { setPage(1) }, [debouncedSearch, eventFilter, dateFrom, dateTo])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    listPublishedCirculars({
      search:  debouncedSearch || undefined,
      eventId: eventFilter ? Number(eventFilter) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo:  dateTo || undefined,
      page,
      perPage: 15,
    })
      .then((r) => { setItems(r.circulars); setTotal(r.total); setPages(r.pages) })
      .catch((err: ApiError) => toast.error(err.message ?? 'Failed to load circulars.'))
      .finally(() => setLoading(false))
  }, [token, debouncedSearch, eventFilter, dateFrom, dateTo, page])

  if (isLoading || !token) return null

  function fmtDate(iso: string | null) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const activeFilterCount = [eventFilter, dateFrom, dateTo].filter(Boolean).length

  function applyFilters() {
    setEventFilter(draftEvent)
    setDateFrom(draftFrom)
    setDateTo(draftTo)
    setFilterOpen(false)
  }

  function resetFilters() {
    setDraftEvent(''); setDraftFrom(''); setDraftTo('')
    setEventFilter(''); setDateFrom(''); setDateTo('')
    setFilterOpen(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Circulars"
        subtitle="Official notices and communications from the organisation."
      />

      {/* Search + filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars…"
            className="pl-8 h-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <FilterButton
          onClick={() => { setDraftEvent(eventFilter); setDraftFrom(dateFrom); setDraftTo(dateTo); setFilterOpen(true) }}
          activeCount={activeFilterCount}
          className="h-9 text-sm"
        />

        <FilterModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter Circulars"
          onApply={applyFilters}
          onReset={resetFilters}
        >
          <FilterField label="Event">
            <select
              value={draftEvent}
              onChange={(e) => setDraftEvent(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">All events</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </FilterField>
          <FilterField label="Published from">
            <Input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} className="h-8 text-sm" />
          </FilterField>
          <FilterField label="Published to">
            <Input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} className="h-8 text-sm" />
          </FilterField>
        </FilterModal>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 -mt-2">
          {eventFilter && (
            <FilterChip
              label={`Event: ${events.find((e) => String(e.id) === eventFilter)?.name ?? eventFilter}`}
              onRemove={() => setEventFilter('')}
            />
          )}
          {dateFrom && <FilterChip label={`From: ${dateFrom}`} onRemove={() => setDateFrom('')} />}
          {dateTo   && <FilterChip label={`To: ${dateTo}`}     onRemove={() => setDateTo('')} />}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="size-12 rounded-2xl bg-brand-navy/5 flex items-center justify-center">
            <ScrollText className="size-6 text-brand-navy/30" />
          </div>
          <div>
            <p className="font-semibold text-brand-navy">
              {activeFilterCount > 0 || debouncedSearch ? 'No circulars match your filters.' : 'No circulars yet.'}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">Check back later for new notices.</p>
          </div>
          {(activeFilterCount > 0 || debouncedSearch) && (
            <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground -mt-2">
            {total === 1 ? '1 circular' : `${total} circulars`}
          </p>

          <div className="flex flex-col gap-3">
            {items.map((c) => {
              const isExpanded = expanded.has(c.id)
              const isLong = c.body.length > 280
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-card hover:border-brand-orange/20 transition-colors overflow-hidden"
                >
                  <div className="p-4 sm:p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="size-8 rounded-xl bg-brand-navy/8 flex items-center justify-center shrink-0 mt-0.5">
                          <ScrollText className="size-4 text-brand-navy" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-heading font-bold text-brand-navy text-base leading-snug">
                            {c.title}
                          </h3>
                          {c.circularNo && (
                            <p className="font-mono text-xs text-brand-orange mt-0.5">{c.circularNo}</p>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      {c.publishedAt && (
                        <p className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                          <Calendar className="size-3" />
                          {fmtDate(c.publishedAt)}
                        </p>
                      )}
                    </div>

                    {/* Meta */}
                    {c.event && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Tag className="size-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-brand-orange">{c.event.name}</span>
                      </div>
                    )}

                    {/* Body */}
                    <p className={`text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>
                      {c.body}
                    </p>

                    {isLong && (
                      <button
                        onClick={() => toggleExpand(c.id)}
                        className="mt-2 text-xs font-medium text-brand-orange hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">Page {page} / {pages}</span>
              <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
