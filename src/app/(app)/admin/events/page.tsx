'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Plus, Pencil, Star, StarOff, Archive, Globe, Ban, Loader2, Search, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { EventStatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FilterButton, FilterModal, FilterField } from '@/components/shared/FilterModal'
import { FilterChip } from '@/components/shared/FilterChip'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import { listEvents, updateEvent, type EventListQuery } from '@/lib/api/events'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { Event, PaginatedEvents, ApiError } from '@/types'

export default function AdminEventsPage() {
  return (
    <RoleGuard permission="event.manage">
      <EventsContent />
    </RoleGuard>
  )
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', published: 'Published', archived: 'Archived',
}

function EventsContent() {
  const [data, setData] = useState<PaginatedEvents | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  // Search
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)

  // Applied filters
  const [status, setStatus] = useState('')
  const [collection, setCollection] = useState('')  // '' | 'true' | 'false'
  const [featured, setFeatured] = useState('')      // '' | 'true'
  const [year, setYear] = useState('')

  // Draft filters (in modal)
  const [draftStatus, setDraftStatus] = useState('')
  const [draftCollection, setDraftCollection] = useState('')
  const [draftFeatured, setDraftFeatured] = useState('')
  const [draftYear, setDraftYear] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  // Confirm dialog
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; description: string; label: string
    variant?: 'destructive' | 'default'; onConfirm: () => void
  }>({ open: false, title: '', description: '', label: 'Confirm', onConfirm: () => {} })

  // Build query object — excludes page so the page reset effect can run first
  const query: EventListQuery = {
    search: debouncedSearch || undefined,
    status: (status as EventListQuery['status']) || undefined,
    collectionEnabled: collection === '' ? undefined : collection === 'true',
    isFeatured: featured === '' ? undefined : featured === 'true',
    year: year ? Number(year) : undefined,
    page,
    perPage: 20,
  }

  const load = useCallback(async (q: EventListQuery) => {
    setLoading(true)
    setError(null)
    try {
      setData(await listEvents(q))
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to load events.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset page when filters or search change
  useEffect(() => { setPage(1) }, [debouncedSearch, status, collection, featured, year])

  useEffect(() => {
    load(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, collection, featured, year, page])

  async function patch(id: number, payload: Parameters<typeof updateEvent>[1], successMsg: string) {
    setBusy(id)
    try {
      const updated = await updateEvent(id, payload)
      setData((prev) => prev ? {
        ...prev,
        events: prev.events.map((e) => (e.id === id ? updated : e)),
      } : prev)
      toast.success(successMsg)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Update failed.')
    } finally {
      setBusy(null)
    }
  }

  function openConfirm(opts: typeof confirm) { setConfirm({ ...opts, open: true }) }

  function applyFilters() {
    setStatus(draftStatus); setCollection(draftCollection)
    setFeatured(draftFeatured); setYear(draftYear)
    setFilterOpen(false)
  }

  function resetFilters() {
    setDraftStatus(''); setDraftCollection(''); setDraftFeatured(''); setDraftYear('')
    setStatus(''); setCollection(''); setFeatured(''); setYear('')
    setFilterOpen(false)
  }

  function fmt(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const activeFilterCount = [status, collection, featured, year].filter(Boolean).length
  const events = data?.events ?? []

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Events"
        subtitle="Create and manage festival editions. Publish + enable collection to open collector dropdowns."
        className="mb-6"
      >
        <Button asChild className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          <Link href="/admin/events/new"><Plus className="size-4 mr-2" />New Event</Link>
        </Button>
      </PageHeader>

      {/* Search + filter row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <FilterButton
          onClick={() => {
            setDraftStatus(status); setDraftCollection(collection)
            setDraftFeatured(featured); setDraftYear(year)
            setFilterOpen(true)
          }}
          activeCount={activeFilterCount}
          className="ml-auto h-8 text-xs"
        />

        <FilterModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter Events"
          onApply={applyFilters}
          onReset={resetFilters}
        >
          <FilterField label="Status" wide>
            <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </FilterField>

          <FilterField label="Collection">
            <select value={draftCollection} onChange={(e) => setDraftCollection(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </FilterField>

          <FilterField label="Featured">
            <select value={draftFeatured} onChange={(e) => setDraftFeatured(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All</option>
              <option value="true">Featured only</option>
            </select>
          </FilterField>

          <FilterField label="Year">
            <Input
              type="number"
              placeholder="e.g. 2026"
              min={2000} max={2100}
              value={draftYear}
              onChange={(e) => setDraftYear(e.target.value)}
              className="h-8 text-sm"
            />
          </FilterField>
        </FilterModal>
      </div>

      {/* Active filter chips */}
      {(status || collection || featured || year) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {status && <FilterChip label={`Status: ${STATUS_LABELS[status] ?? status}`} onRemove={() => setStatus('')} />}
          {collection && <FilterChip label={`Collection: ${collection === 'true' ? 'Enabled' : 'Disabled'}`} onRemove={() => setCollection('')} />}
          {featured && <FilterChip label="Featured only" onRemove={() => setFeatured('')} />}
          {year && <FilterChip label={`Year: ${year}`} onRemove={() => setYear('')} />}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground text-sm">
            {activeFilterCount > 0 || debouncedSearch ? 'No events match the current filters.' : 'No events yet.'}
          </p>
          {!activeFilterCount && !debouncedSearch && (
            <Button asChild className="mt-4 bg-brand-orange hover:bg-brand-orange/90 text-white">
              <Link href="/admin/events/new">Create your first event</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          {data && (
            <p className="text-xs text-muted-foreground mb-2">
              {data.total === 1 ? '1 event' : `${data.total} events`}
              {(activeFilterCount > 0 || debouncedSearch) && ' matching filters'}
            </p>
          )}
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Name', 'Status', 'Collection', 'Featured', 'Date Range', 'Year', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <EventRow
                    key={ev.id}
                    ev={ev}
                    busy={busy === ev.id}
                    fmt={fmt}
                    onPatch={(payload, msg) => patch(ev.id, payload, msg)}
                    onConfirm={openConfirm}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs text-muted-foreground">
                Page {data.page} of {data.pages} · {data.total} events
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm((c) => ({ ...c, open: o }))}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.label}
        variant={confirm.variant}
        onConfirm={() => { setConfirm((c) => ({ ...c, open: false })); confirm.onConfirm() }}
      />
    </div>
  )
}

// ── Event row ─────────────────────────────────────────────────────────────────

interface EventRowProps {
  ev: Event
  busy: boolean
  fmt: (d: string | null | undefined) => string
  onPatch: (payload: Parameters<typeof updateEvent>[1], msg: string) => void
  onConfirm: (opts: {
    open: boolean; title: string; description: string; label: string
    variant?: 'destructive' | 'default'; onConfirm: () => void
  }) => void
}

function EventRow({ ev, busy, fmt, onPatch, onConfirm }: EventRowProps) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/admin/events/${ev.id}`} className="font-semibold text-foreground hover:text-brand-orange transition-colors">
          {ev.name}
        </Link>
        <div className="text-xs text-muted-foreground font-mono">{ev.slug}</div>
      </td>
      <td className="px-4 py-3"><EventStatusBadge status={ev.status} /></td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
          ev.collectionEnabled ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}>
          {ev.collectionEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </td>
      <td className="px-4 py-3">
        {ev.isFeatured
          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Star className="size-3 fill-amber-400 text-amber-400" />Featured</span>
          : <span className="text-xs text-muted-foreground">—</span>
        }
      </td>
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        {ev.startDate || ev.endDate ? `${fmt(ev.startDate)} – ${fmt(ev.endDate)}` : '—'}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{ev.year ?? '—'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 flex-wrap">
          <Button asChild variant="outline" size="sm" className="h-7 text-xs px-2">
            <Link href={`/admin/events/${ev.id}`}><Pencil className="size-3 mr-1" />View</Link>
          </Button>

          {ev.status === 'draft' && (
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-green-700 border-green-200 hover:bg-green-50"
              disabled={busy}
              onClick={() => onConfirm({
                open: true, variant: 'default',
                title: `Publish "${ev.name}"?`,
                description: 'Published events are visible on the public website.',
                label: 'Publish',
                onConfirm: () => onPatch({ status: 'published' }, `"${ev.name}" published.`),
              })}>
              {busy ? <Loader2 className="size-3 animate-spin" /> : <Globe className="size-3 mr-1" />}Publish
            </Button>
          )}
          {ev.status === 'published' && (
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-slate-600"
              disabled={busy}
              onClick={() => onConfirm({
                open: true, variant: 'destructive',
                title: `Archive "${ev.name}"?`,
                description: 'Archiving disables collection and marks the event as historical.',
                label: 'Archive',
                onConfirm: () => onPatch({ status: 'archived' }, `"${ev.name}" archived.`),
              })}>
              {busy ? <Loader2 className="size-3 animate-spin" /> : <Archive className="size-3 mr-1" />}Archive
            </Button>
          )}
          {ev.status === 'archived' && (
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-blue-700 border-blue-200 hover:bg-blue-50"
              disabled={busy}
              onClick={() => onPatch({ status: 'published' }, `"${ev.name}" re-published.`)}>
              {busy ? <Loader2 className="size-3 animate-spin" /> : <Globe className="size-3 mr-1" />}Re-publish
            </Button>
          )}

          {ev.status !== 'archived' && (
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={busy}
              onClick={() => {
                if (ev.collectionEnabled) {
                  onConfirm({
                    open: true, variant: 'destructive',
                    title: 'Disable collection?',
                    description: `Collectors will no longer collect against "${ev.name}". Existing payments unaffected.`,
                    label: 'Disable',
                    onConfirm: () => onPatch({ collectionEnabled: false }, `Collection disabled for "${ev.name}".`),
                  })
                } else {
                  if (ev.status !== 'published') { toast.error('Publish the event before enabling collection.'); return }
                  onPatch({ collectionEnabled: true }, `Collection enabled for "${ev.name}".`)
                }
              }}>
              {busy ? <Loader2 className="size-3 animate-spin" /> : <Ban className="size-3 mr-1" />}
              {ev.collectionEnabled ? 'Disable' : 'Enable'}
            </Button>
          )}

          {!ev.isFeatured && ev.status === 'published' && (
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-amber-700 border-amber-200 hover:bg-amber-50"
              disabled={busy}
              onClick={() => onConfirm({
                open: true, variant: 'default',
                title: `Feature "${ev.name}"?`,
                description: 'The public homepage will show this event. Any other featured event will be unfeatured.',
                label: 'Set Featured',
                onConfirm: () => onPatch({ isFeatured: true }, `"${ev.name}" is now featured.`),
              })}>
              {busy ? <Loader2 className="size-3 animate-spin" /> : <Star className="size-3 mr-1" />}Feature
            </Button>
          )}
          {ev.isFeatured && (
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-amber-700 border-amber-200 hover:bg-amber-50"
              disabled={busy}
              onClick={() => onPatch({ isFeatured: false }, `"${ev.name}" unfeatured.`)}>
              {busy ? <Loader2 className="size-3 animate-spin" /> : <StarOff className="size-3 mr-1" />}Unfeature
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
