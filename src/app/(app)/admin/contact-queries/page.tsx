'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Search, X, ChevronLeft, ChevronRight, MessageSquare, Phone, MapPin,
  Clock, CheckCircle2, Circle, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { FilterButton, FilterModal, FilterField } from '@/components/shared/FilterModal'
import { FilterChip } from '@/components/shared/FilterChip'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { listContactQueries, getContactQuery, updateContactQueryStatus } from '@/lib/api/contact'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { ContactQuery, ContactQueryList, ContactQueryStatus, ApiError } from '@/types'

export default function ContactQueriesPage() {
  return (
    <RoleGuard permission="content.manage">
      <ContactQueriesContent />
    </RoleGuard>
  )
}

const STATUS_LABELS: Record<ContactQueryStatus, string> = {
  new:      'New',
  read:     'Read',
  resolved: 'Resolved',
}

const STATUS_COLORS: Record<ContactQueryStatus, string> = {
  new:      'bg-blue-50 text-blue-700 border-blue-200',
  read:     'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
}

function ContactQueriesContent() {
  const [data, setData] = useState<ContactQueryList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)

  const [status, setStatus] = useState<ContactQueryStatus | ''>('')
  const [draftStatus, setDraftStatus] = useState<ContactQueryStatus | ''>('')
  const [filterOpen, setFilterOpen] = useState(false)

  const [detail, setDetail] = useState<ContactQuery | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(
        await listContactQueries({
          page,
          perPage: 20,
          status: status || undefined,
          search: debouncedSearch || undefined,
        }),
      )
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to load queries.')
    } finally {
      setLoading(false)
    }
  }, [page, status, debouncedSearch])

  useEffect(() => { setPage(1) }, [debouncedSearch, status])
  useEffect(() => { load() }, [load])

  async function openDetail(id: number) {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const q = await getContactQuery(id)
      setDetail(q)
    } catch {
      toast.error('Could not load query details.')
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleStatusChange(id: number, newStatus: ContactQueryStatus) {
    setUpdatingStatus(true)
    try {
      const updated = await updateContactQueryStatus(id, newStatus)
      setDetail(updated)
      setData((prev) =>
        prev
          ? { ...prev, queries: prev.queries.map((q) => (q.id === id ? updated : q)) }
          : prev,
      )
      toast.success(`Marked as ${STATUS_LABELS[newStatus]}.`)
    } catch {
      toast.error('Status update failed.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  function applyFilters() {
    setStatus(draftStatus)
    setFilterOpen(false)
  }

  function resetFilters() {
    setDraftStatus('')
    setStatus('')
    setFilterOpen(false)
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const queries = data?.queries ?? []
  const activeFilterCount = status ? 1 : 0

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Contact Queries"
        subtitle="Messages submitted through the public contact form."
        className="mb-6"
      />

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, message…"
            className="pl-8 h-8 text-sm"
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

        <FilterButton
          onClick={() => { setDraftStatus(status); setFilterOpen(true) }}
          activeCount={activeFilterCount}
          className="ml-auto h-8 text-xs"
        />

        <FilterModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter Queries"
          onApply={applyFilters}
          onReset={resetFilters}
        >
          <FilterField label="Status" wide>
            <select
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value as ContactQueryStatus | '')}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="resolved">Resolved</option>
            </select>
          </FilterField>
        </FilterModal>
      </div>

      {status && (
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterChip
            label={`Status: ${STATUS_LABELS[status]}`}
            onRemove={() => setStatus('')}
          />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : queries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MessageSquare className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {activeFilterCount > 0 || debouncedSearch
              ? 'No queries match the current filters.'
              : 'No contact queries yet.'}
          </p>
        </div>
      ) : (
        <>
          {data && (
            <p className="text-xs text-muted-foreground mb-2">
              {data.total === 1 ? '1 query' : `${data.total} queries`}
              {(activeFilterCount > 0 || debouncedSearch) && ' matching filters'}
            </p>
          )}

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Name', 'Phone', 'Location', 'Message', 'Status', 'Received', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queries.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{q.name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap font-mono text-xs">{q.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{q.location ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                      <span className="line-clamp-2 text-xs">{q.message}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[q.status]}`}>
                        {STATUS_LABELS[q.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{fmtDate(q.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => openDetail(q.id)}
                      >
                        <Eye className="size-3 mr-1" />View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs text-muted-foreground">
                Page {data.page} of {data.pages} · {data.total} queries
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

      {/* Detail modal */}
      <Dialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) setDetail(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Query</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex flex-col gap-3 py-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detail ? (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <span className="font-semibold">{detail.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-mono">
                  <Phone className="size-3.5" />
                  {detail.phone}
                </div>
                {detail.location && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {detail.location}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {fmtDate(detail.createdAt)}
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                {detail.message}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {(['new', 'read', 'resolved'] as ContactQueryStatus[]).map((s) => (
                    <Button
                      key={s}
                      variant={detail.status === s ? 'default' : 'outline'}
                      size="sm"
                      disabled={updatingStatus || detail.status === s}
                      className={detail.status === s ? 'bg-brand-orange hover:bg-brand-orange/90 text-white' : ''}
                      onClick={() => handleStatusChange(detail.id, s)}
                    >
                      {s === 'new' ? <Circle className="size-3 mr-1.5" />
                        : s === 'read' ? <Eye className="size-3 mr-1.5" />
                        : <CheckCircle2 className="size-3 mr-1.5" />}
                      {STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
