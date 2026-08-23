'use client'

import { useEffect, useMemo, useState } from 'react'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { listPublicEvents } from '@/lib/api/public'
import type { PublicEvent } from '@/types'
import { Calendar, MapPin, Search, Star, X } from 'lucide-react'

export default function EventsPage() {
  return (
    <RoleGuard>
      <EventsContent />
    </RoleGuard>
  )
}

function EventsContent() {
  const [events, setEvents]   = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Load up to 200 — events are few; client-side filter is sufficient
        const res = await listPublicEvents(1, 200)
        setEvents(res?.events ?? [])
      } catch {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return events
    return events.filter(
      (e) => e.name.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q),
    )
  }, [events, search])

  function fmtDate(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
      <PageHeader title="Events" subtitle="Published events by the organisation." />

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
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

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Calendar className="size-10 opacity-30" />
          <p className="text-sm">{search ? 'No events match your search.' : 'No published events yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ev) => (
            <EventCard key={ev.id} event={ev} fmtDate={fmtDate} />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          {search && events.length !== filtered.length && ` (filtered from ${events.length})`}
        </p>
      )}
    </div>
  )
}

function EventCard({
  event,
  fmtDate,
}: {
  event: PublicEvent
  fmtDate: (iso: string | null) => string | null
}) {
  const dateRange = (() => {
    const s = fmtDate(event.startDate)
    const e = fmtDate(event.endDate)
    if (s && e && s !== e) return `${s} – ${e}`
    return s ?? e ?? null
  })()

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {event.isFeatured && (
              <Star className="size-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
            )}
            <h3 className="font-semibold text-sm leading-snug break-words">{event.name}</h3>
          </div>
          {event.year && (
            <span className="text-xs text-muted-foreground">{event.year}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 flex flex-col gap-2 flex-1">
        {dateRange && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            <span>{dateRange}</span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        {event.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mt-0.5">
            {event.description}
          </p>
        )}
      </div>
    </div>
  )
}
