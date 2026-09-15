'use client'

import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Plus, Pencil, Globe, EyeOff, Trash2, Search, X,
  ChevronLeft, ChevronRight, ScrollText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FilterButton, FilterModal, FilterField } from '@/components/shared/FilterModal'
import { FilterChip } from '@/components/shared/FilterChip'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { adminListCirculars, adminCreateCircular, adminUpdateCircular, adminDeleteCircular } from '@/lib/api/circulars'
import { listActiveEvents } from '@/lib/api/events'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { Circular, EventSummary, ApiError } from '@/types'

export default function AdminCircularsPage() {
  return (
    <RoleGuard permission="content.manage">
      <CircularsContent />
    </RoleGuard>
  )
}

// ── Form schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  title:      z.string().min(1, 'Title is required').max(200),
  body:       z.string().min(1, 'Body is required'),
  circularNo: z.string().optional(),
  eventId:    z.string().optional(),
})
type FormValues = z.infer<typeof formSchema>

// ── Main content ─────────────────────────────────────────────────────────────

function CircularsContent() {
  const [items, setItems]   = useState<Circular[]>([])
  const [events, setEvents] = useState<EventSummary[]>([])
  const [total, setTotal]   = useState(0)
  const [pages, setPages]   = useState(1)
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Search + filter
  const [search, setSearch]             = useState('')
  const debouncedSearch                 = useDebouncedValue(search, 350)
  const [publishedFilter, setPublished] = useState<'' | 'true' | 'false'>('')
  const [draftPublished, setDraftPub]   = useState<'' | 'true' | 'false'>('')
  const [filterOpen, setFilterOpen]     = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<Circular | null>(null)
  const [deleting, setDeleting]     = useState<Circular | null>(null)

  const PER_PAGE = 20

  const load = useCallback(async (p = page) => {
    setLoading(true)
    setError(null)
    try {
      const [res, evs] = await Promise.all([adminListCirculars(p, PER_PAGE), listActiveEvents()])
      setItems(res.circulars)
      setTotal(res.total)
      setPages(res.pages)
      setEvents(evs)
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to load circulars.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load(page) }, [page])
  useEffect(() => { setPage(1) }, [debouncedSearch, publishedFilter])

  // Client-side search + filter on current page data
  const filtered = items.filter((c) => {
    if (publishedFilter === 'true' && !c.isPublished) return false
    if (publishedFilter === 'false' && c.isPublished) return false
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      if (!c.title.toLowerCase().includes(q) && !c.body.toLowerCase().includes(q)) return false
    }
    return true
  })

  async function handleTogglePublish(item: Circular) {
    try {
      const updated = await adminUpdateCircular(item.id, { isPublished: !item.isPublished })
      setItems((prev) => prev.map((c) => (c.id === item.id ? updated : c)))
      toast.success(updated.isPublished ? 'Circular published.' : 'Circular unpublished.')
    } catch { toast.error('Status update failed.') }
  }

  async function handleDelete(item: Circular) {
    try {
      await adminDeleteCircular(item.id)
      setItems((prev) => prev.filter((c) => c.id !== item.id))
      setTotal((t) => t - 1)
      toast.success('Circular deleted.')
    } catch { toast.error('Delete failed.') }
    finally { setDeleting(null) }
  }

  function openCreate() { setEditing(null); setDialogOpen(true) }
  function openEdit(item: Circular) { setEditing(item); setDialogOpen(true) }

  function onSaved(c: Circular) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id)
      return idx >= 0 ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev]
    })
    if (!editing) setTotal((t) => t + 1)
    setDialogOpen(false)
  }

  function fmtDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const activeFilterCount = publishedFilter ? 1 : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
      <PageHeader
        title="Circulars"
        subtitle="Create and publish formal notices for members."
      >
        <Button onClick={openCreate} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          <Plus className="size-4 mr-2" />New Circular
        </Button>
      </PageHeader>

      {/* Search + filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <FilterButton
          onClick={() => { setDraftPub(publishedFilter); setFilterOpen(true) }}
          activeCount={activeFilterCount}
          className="ml-auto h-8 text-xs"
        />

        <FilterModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter Circulars"
          onApply={() => { setPublished(draftPublished); setFilterOpen(false) }}
          onReset={() => { setDraftPub(''); setPublished(''); setFilterOpen(false) }}
        >
          <FilterField label="Status" wide>
            <select
              value={draftPublished}
              onChange={(e) => setDraftPub(e.target.value as '' | 'true' | 'false')}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
          </FilterField>
        </FilterModal>
      </div>

      {publishedFilter && (
        <div className="flex flex-wrap gap-2 -mt-2">
          <FilterChip
            label={`Status: ${publishedFilter === 'true' ? 'Published' : 'Unpublished'}`}
            onRemove={() => setPublished('')}
          />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <ScrollText className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {activeFilterCount > 0 || debouncedSearch ? 'No circulars match the current filters.' : 'No circulars yet.'}
          </p>
          {!activeFilterCount && !debouncedSearch && (
            <Button onClick={openCreate} className="mt-4 bg-brand-orange hover:bg-brand-orange/90 text-white">
              Create first circular
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground -mt-2">
            {total === 1 ? '1 circular' : `${total} circulars`}
          </p>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {filtered.map((item) => (
              <div key={item.id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{item.title}</p>
                    {item.circularNo && (
                      <p className="text-xs text-brand-orange font-mono mt-0.5">{item.circularNo}</p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.body}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    item.isPublished
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {item.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {item.event && <span>{item.event.name}</span>}
                  {item.publishedAt && <span>{fmtDate(item.publishedAt)}</span>}
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1"
                    title={item.isPublished ? 'Unpublish' : 'Publish'}
                    onClick={() => handleTogglePublish(item)}>
                    {item.isPublished ? <EyeOff className="size-3.5" /> : <Globe className="size-3.5" />}
                    {item.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => openEdit(item)}>
                    <Pencil className="size-3.5 mr-1" />Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-destructive border-destructive/20 hover:bg-destructive/5"
                    onClick={() => setDeleting(item)}>
                    <Trash2 className="size-3.5 mr-1" />Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Title / Ref', 'Event', 'Status', 'Published', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.title}</p>
                      {item.circularNo && (
                        <p className="text-xs text-brand-orange font-mono mt-0.5">{item.circularNo}</p>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[220px] mt-0.5">{item.body}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{item.event?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        item.isPublished
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(item.publishedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={item.isPublished ? 'Unpublish' : 'Publish'}
                          onClick={() => handleTogglePublish(item)}>
                          {item.isPublished ? <EyeOff className="size-3.5" /> : <Globe className="size-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleting(item)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Create / Edit dialog */}
      <CircularDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        events={events}
        onSaved={onSaved}
        nextSeq={total + 1}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null) }}
        title="Delete circular?"
        description={deleting ? `"${deleting.title}" will be permanently deleted.` : ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleting && handleDelete(deleting)}
      />
    </div>
  )
}

// ── Create / Edit dialog ───────────────────────────────────────────────────

function CircularDialog({ open, onOpenChange, editing, events, onSaved, nextSeq }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: Circular | null
  events: EventSummary[]
  onSaved: (c: Circular) => void
  nextSeq: number
}) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    if (open) {
      const year = new Date().getFullYear()
      const suggested = `CIR/${year}/${String(nextSeq).padStart(3, '0')}`
      reset({
        title:      editing?.title      ?? '',
        body:       editing?.body       ?? '',
        circularNo: editing?.circularNo ?? (editing ? '' : suggested),
        eventId:    editing?.event ? String(editing.event.id) : '',
      })
    }
  }, [open, editing, reset, nextSeq])

  async function onSubmit(values: FormValues) {
    const payload = {
      title:      values.title,
      body:       values.body,
      circularNo: values.circularNo?.trim() || null,
      eventId:    values.eventId ? Number(values.eventId) : null,
    }
    try {
      const saved = editing
        ? await adminUpdateCircular(editing.id, payload)
        : await adminCreateCircular(payload)
      toast.success(editing ? 'Circular updated.' : 'Circular created.')
      onSaved(saved)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Save failed.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Circular' : 'New Circular'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input {...register('title')} placeholder="Circular title" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Reference No. <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input {...register('circularNo')} placeholder="e.g. CIR/2026/001" className="font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Related Event <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <select
                {...register('eventId')}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">None</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Content / Body <span className="text-destructive">*</span></Label>
              <Textarea {...register('body')} rows={6} placeholder="Circular content…" className="resize-none" />
              {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Circular'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
