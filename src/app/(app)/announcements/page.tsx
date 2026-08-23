'use client'

import { useEffect, useMemo, useState } from 'react'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { getDashboardEvents } from '@/lib/api/dashboard'
import { getPublicAnnouncements } from '@/lib/api/public'
import type { PublicAnnouncement, EventStats } from '@/types'
import { Megaphone, Search, X, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

export default function AnnouncementsPage() {
  return (
    <RoleGuard>
      <AnnouncementsContent />
    </RoleGuard>
  )
}

function AnnouncementsContent() {
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([])
  const [events, setEvents]               = useState<EventStats[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [filterEvent, setFilterEvent]     = useState('')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')
  const [showFilters, setShowFilters]     = useState(false)
  const [expanded, setExpanded]           = useState<Set<number>>(new Set())

  const debouncedSearch = useDebouncedValue(search, 300)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getPublicAnnouncements(),
      getDashboardEvents().catch(() => []),
    ]).then(([ann, evs]) => {
      setAnnouncements(ann ?? [])
      setEvents(evs ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return announcements.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q) && !a.body.toLowerCase().includes(q)) return false
      if (filterEvent && String(a.event?.id) !== filterEvent) return false
      if (dateFrom && a.publishedAt && a.publishedAt < dateFrom) return false
      if (dateTo   && a.publishedAt && a.publishedAt.slice(0, 10) > dateTo) return false
      return true
    })
  }, [announcements, debouncedSearch, filterEvent, dateFrom, dateTo])

  function clearFilters() {
    setSearch(''); setFilterEvent(''); setDateFrom(''); setDateTo('')
  }

  const hasActiveFilters = !!(search || filterEvent || dateFrom || dateTo)

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function fmtDate(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
      <PageHeader title="Announcements" subtitle="Published announcements from the organisation." />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
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
          <Calendar className="size-3.5" /> Filters
          {hasActiveFilters && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-orange-500" />}
        </Button>

        {hasActiveFilters && (
          <Button size="sm" variant="ghost" className="h-8 text-muted-foreground gap-1.5" onClick={clearFilters}>
            <X className="size-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Event</label>
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All events</option>
              {events.map((ev) => (
                <option key={ev.event.id} value={ev.event.id}>{ev.event.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">From date</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">To date</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Megaphone className="size-10 opacity-30" />
          <p className="text-sm">{hasActiveFilters ? 'No announcements match your filters.' : 'No announcements yet.'}</p>
          {hasActiveFilters && (
            <Button size="sm" variant="outline" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((a) => {
            const isExpanded = expanded.has(a.id)
            const PREVIEW_LEN = 200
            const needsToggle = a.body.length > PREVIEW_LEN

            return (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <Megaphone className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <h3 className="font-semibold text-sm leading-snug">{a.title}</h3>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {a.publishedAt && (
                      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {fmtDate(a.publishedAt)}
                      </span>
                    )}
                    {a.event && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap">
                        {a.event.name}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pl-6">
                  {isExpanded || !needsToggle ? a.body : `${a.body.slice(0, PREVIEW_LEN)}…`}
                </p>

                {needsToggle && (
                  <button
                    onClick={() => toggleExpand(a.id)}
                    className="self-start pl-6 flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {isExpanded ? (
                      <><ChevronUp className="size-3" /> Show less</>
                    ) : (
                      <><ChevronDown className="size-3" /> Read more</>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {filtered.length} announcement{filtered.length !== 1 ? 's' : ''}
          {hasActiveFilters && ` (filtered from ${announcements.length})`}
        </p>
      )}
    </div>
  )
}
