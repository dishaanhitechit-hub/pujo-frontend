'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getFeaturedEvent, listPublicEvents } from '@/lib/api/public'
import type { PublicEvent, PublicEventDetail, PublicEventDay } from '@/types'
import {
  Calendar, MapPin, Search, Star, X, Clock,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

const PER_PAGE = 10

export default function EventsPage() {
  return (
    <RoleGuard>
      <EventsContent />
    </RoleGuard>
  )
}

function EventsContent() {
  const [featured, setFeatured]     = useState<PublicEventDetail | null | undefined>(undefined)
  const [events, setEvents]         = useState<PublicEvent[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const [search, setSearch]         = useState('')

  // Featured event — loaded once
  useEffect(() => {
    getFeaturedEvent()
      .then((ev) => setFeatured(ev ?? null))
      .catch(() => setFeatured(null))
  }, [])

  // Paginated list — reload on page change or when search clears back to empty
  const loadPage = useCallback(async (p: number, searchMode: boolean) => {
    setLoadingList(true)
    try {
      const perPage = searchMode ? 50 : PER_PAGE
      const res = await listPublicEvents(searchMode ? 1 : p, perPage, true)
      setEvents(res?.events ?? [])
      setTotalPages(searchMode ? 1 : (res?.pages ?? 1))
      setTotal(res?.total ?? 0)
    } catch {
      setEvents([])
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    loadPage(page, search.trim().length > 0)
  }, [page, loadPage]) // intentionally excludes search — search is client-side only

  // When search starts, fetch a bigger page so client-side filter has full data
  useEffect(() => {
    if (search.trim()) {
      loadPage(1, true)
      setPage(1)
    } else {
      loadPage(page, false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return events
    return events.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.days?.some((d) => d.label.toLowerCase().includes(q)),
    )
  }, [events, search])

  const showPagination = !search.trim() && totalPages > 1

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      <PageHeader title="Events" subtitle="Published events and their schedules." />

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events or schedule…"
          className="pl-8 h-8 text-xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Featured event */}
      {featured === undefined ? (
        <Skeleton className="h-52 rounded-2xl" />
      ) : featured ? (
        <FeaturedCard event={featured} />
      ) : null}

      {/* All events */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            All Events
            {!loadingList && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({search.trim() ? `${filtered.length} match${filtered.length !== 1 ? 'es' : ''}` : `${total} total`})
              </span>
            )}
          </h2>
          {showPagination && (
            <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
          )}
        </div>

        {loadingList ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Calendar className="size-10 opacity-30" />
            <p className="text-sm">{search ? 'No events match your search.' : 'No published events yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}

        {showPagination && filtered.length > 0 && (
          <div className="flex justify-end pt-1">
            <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </section>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(
  iso: string | null,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string | null {
  if (!iso) return null
  return new Date(iso + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    ...opts,
    timeZone: 'Asia/Kolkata',
  })
}

function fmtTime(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`
}

function dateRange(startDate: string | null, endDate: string | null): string | null {
  const s = fmtDate(startDate)
  const e = fmtDate(endDate)
  if (s && e && s !== e) return `${s} – ${e}`
  return s ?? e ?? null
}

// ── Pagination controls ───────────────────────────────────────────────────────

function PaginationControls({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline" size="sm"
        className="h-7 px-2 text-xs"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="size-3.5" />
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline" size="sm"
        className="h-7 px-2 text-xs"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="size-3.5" />
      </Button>
    </div>
  )
}

// ── Featured card ─────────────────────────────────────────────────────────────

function FeaturedCard({ event }: { event: PublicEventDetail }) {
  const range = dateRange(event.startDate, event.endDate)

  return (
    <div className="rounded-2xl overflow-hidden border border-sky-200 bg-sky-50">
      {/* Top section */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-brand-orange text-white">
            <Star className="size-3 fill-white" />Featured Event
          </span>
          {event.year && (
            <span className="text-xs text-sky-400 font-semibold">{event.year}</span>
          )}
        </div>

        <h2 className="font-heading font-bold text-2xl text-brand-navy leading-snug mb-3">
          {event.name}
        </h2>

        <div className="flex flex-wrap gap-3 text-xs text-sky-700">
          {range && (
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-brand-orange/70" />{range}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-brand-orange/70" />{event.location}
            </span>
          )}
          {event.days.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-brand-orange/70" />
              {event.days.length} day{event.days.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {event.description && (
          <p className="mt-3 text-sm text-sky-600 leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}
      </div>

      {/* Schedule section */}
      {event.days.length > 0 && (
        <div className="border-t border-sky-200">
          <div className="px-6 py-2 bg-sky-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Schedule</p>
          </div>
          <div className="divide-y divide-sky-100">
            {event.days.map((day) => (
              <DayRow key={day.id} day={day} dark={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Regular event card ────────────────────────────────────────────────────────

function EventCard({ event }: { event: PublicEvent }) {
  const range = dateRange(event.startDate, event.endDate)
  const days  = event.days ?? []

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {event.isFeatured && (
              <Star className="size-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
            )}
            <h3 className="font-semibold text-sm leading-snug">{event.name}</h3>
            {event.year && (
              <span className="text-xs text-muted-foreground">· {event.year}</span>
            )}
          </div>
          {event.isFeatured && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              Featured
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {range && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3 text-brand-orange/60" />{range}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 text-brand-orange/60" />{event.location}
            </span>
          )}
          {days.length > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-brand-orange/60" />
              {days.length} day{days.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {event.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}
      </div>

      {/* Schedule */}
      {days.length > 0 && (
        <div className="border-t border-border mt-auto">
          <div className="px-5 py-2 bg-muted/40">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Schedule</p>
          </div>
          <div className="divide-y divide-border">
            {days.map((day) => (
              <DayRow key={day.id} day={day} dark={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared day row ────────────────────────────────────────────────────────────

function DayRow({ day, dark }: { day: PublicEventDay; dark: boolean }) {
  const dayDate  = fmtDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' })
  const activities = day.activities ?? []
  const hasTimes = activities.some((a) => a.time)

  return (
    <div className={`px-5 sm:px-6 py-3 flex flex-col gap-1.5 ${dark ? '' : ''}`}>
      {/* Day label + date */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className={`font-medium text-xs ${dark ? 'text-white' : 'text-foreground'}`}>
          {day.label}
        </span>
        {dayDate && (
          <span className={`text-[11px] font-medium shrink-0 ${dark ? 'text-brand-orange/80' : 'text-brand-orange'}`}>
            {dayDate}
          </span>
        )}
      </div>

      {/* Description */}
      {day.description && (
        <p className={`text-[11px] italic ${dark ? 'text-white/40' : 'text-muted-foreground'}`}>
          {day.description}
        </p>
      )}

      {/* Activities */}
      {activities.length > 0 && (
        hasTimes ? (
          <div className="flex flex-col gap-1">
            {activities.map((act, i) => (
              <div key={i} className="flex items-start gap-3">
                {act.time && (
                  <span className={`font-mono text-[10px] font-semibold w-14 shrink-0 pt-px ${dark ? 'text-brand-orange/70' : 'text-brand-orange'}`}>
                    {fmtTime(act.time)}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className={`text-[11px] ${dark ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {act.name}
                  </span>
                  {act.description && (
                    <span className={`text-[10px] italic ${dark ? 'text-white/35' : 'text-muted-foreground/60'}`}>
                      {act.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {activities.map((act, i) => (
              <span
                key={i}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  dark
                    ? 'bg-white/10 text-white/70 border-white/15'
                    : 'bg-brand-orange/8 text-brand-navy border-brand-orange/15'
                }`}
              >
                {act.name}
              </span>
            ))}
          </div>
        )
      )}
    </div>
  )
}
