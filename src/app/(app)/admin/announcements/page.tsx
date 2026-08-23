'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus, Pencil, Globe, EyeOff, Trash2, Search, X,
  ChevronLeft, ChevronRight, Megaphone,
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
import {
  listAdminAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
} from '@/lib/api/announcements'
import { listActiveEvents } from '@/lib/api/events'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { AdminAnnouncement, EventSummary, ApiError } from '@/types'

export default function AnnouncementsPage() {
  return (
    <RoleGuard permission="content.manage">
      <AnnouncementsContent />
    </RoleGuard>
  )
}

// ── Form schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  title:   z.string().min(1, 'Title is required').max(200),
  body:    z.string().min(1, 'Body is required'),
  eventId: z.string().optional(),
})
type FormValues = z.infer<typeof formSchema>

// ── Main content ─────────────────────────────────────────────────────────────

function AnnouncementsContent() {
  const [items, setItems] = useState<AdminAnnouncement[]>([])
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search + filter
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [publishedFilter, setPublishedFilter] = useState<'' | 'true' | 'false'>('')
  const [draftPublished, setDraftPublished] = useState<'' | 'true' | 'false'>('')
  const [filterOpen, setFilterOpen] = useState(false)

  // Create/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null)

  // Confirm delete
  const [deleting, setDeleting] = useState<AdminAnnouncement | null>(null)

  // Pagination (client-side since API returns all)
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [anns, evs] = await Promise.all([listAdminAnnouncements(), listActiveEvents()])
      setItems(anns)
      setEvents(evs)
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to load announcements.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedSearch, publishedFilter])

  // Filtered + searched list
  const filtered = items.filter((a) => {
    if (publishedFilter === 'true' && !a.isPublished) return false
    if (publishedFilter === 'false' && a.isPublished) return false
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      if (!a.title.toLowerCase().includes(q) && !a.body.toLowerCase().includes(q)) return false
    }
    return true
  })
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  async function handleTogglePublish(item: AdminAnnouncement) {
    try {
      const updated = await updateAnnouncement(item.id, { isPublished: !item.isPublished })
      setItems((prev) => prev.map((a) => (a.id === item.id ? updated : a)))
      toast.success(updated.isPublished ? 'Announcement published.' : 'Announcement unpublished.')
    } catch {
      toast.error('Status update failed.')
    }
  }

  async function handleDelete(item: AdminAnnouncement) {
    try {
      await deleteAnnouncement(item.id)
      setItems((prev) => prev.filter((a) => a.id !== item.id))
      toast.success('Announcement deleted.')
    } catch {
      toast.error('Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  function openCreate() { setEditing(null); setDialogOpen(true) }
  function openEdit(item: AdminAnnouncement) { setEditing(item); setDialogOpen(true) }

  function onSaved(ann: AdminAnnouncement) {
    setItems((prev) => {
      const idx = prev.findIndex((a) => a.id === ann.id)
      return idx >= 0 ? prev.map((a) => (a.id === ann.id ? ann : a)) : [ann, ...prev]
    })
    setDialogOpen(false)
  }

  function fmtDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const activeFilterCount = publishedFilter ? 1 : 0

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Announcements"
        subtitle="Create and publish announcements visible on the public website."
        className="mb-6"
      >
        <Button onClick={openCreate} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          <Plus className="size-4 mr-2" />New Announcement
        </Button>
      </PageHeader>

      {/* Search + filter */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <FilterButton
          onClick={() => { setDraftPublished(publishedFilter); setFilterOpen(true) }}
          activeCount={activeFilterCount}
          className="ml-auto h-8 text-xs"
        />

        <FilterModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter Announcements"
          onApply={() => { setPublishedFilter(draftPublished); setFilterOpen(false) }}
          onReset={() => { setDraftPublished(''); setPublishedFilter(''); setFilterOpen(false) }}
        >
          <FilterField label="Published" wide>
            <select
              value={draftPublished}
              onChange={(e) => setDraftPublished(e.target.value as '' | 'true' | 'false')}
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
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterChip
            label={`Status: ${publishedFilter === 'true' ? 'Published' : 'Unpublished'}`}
            onRemove={() => setPublishedFilter('')}
          />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Megaphone className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {activeFilterCount > 0 || debouncedSearch
              ? 'No announcements match the current filters.'
              : 'No announcements yet.'}
          </p>
          {!activeFilterCount && !debouncedSearch && (
            <Button onClick={openCreate} className="mt-4 bg-brand-orange hover:bg-brand-orange/90 text-white">
              Create first announcement
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-2">
            {filtered.length === 1 ? '1 announcement' : `${filtered.length} announcements`}
            {(activeFilterCount > 0 || debouncedSearch) && ' matching filters'}
          </p>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Title', 'Event', 'Status', 'Published', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[220px]">{item.body}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.event?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        item.isPublished
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(item.publishedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => openEdit(item)}>
                          <Pencil className="size-3 mr-1" />Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-7 text-xs px-2 ${item.isPublished ? 'text-slate-600' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
                          onClick={() => handleTogglePublish(item)}
                        >
                          {item.isPublished
                            ? <><EyeOff className="size-3 mr-1" />Unpublish</>
                            : <><Globe className="size-3 mr-1" />Publish</>}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 text-destructive border-destructive/20 hover:bg-destructive/5"
                          onClick={() => setDeleting(item)}
                        >
                          <Trash2 className="size-3 mr-1" />Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs text-muted-foreground">Page {page} of {pages} · {filtered.length} announcements</p>
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

      {/* Create / Edit dialog */}
      <AnnouncementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        events={events}
        onSaved={onSaved}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null) }}
        title="Delete announcement?"
        description={deleting ? `"${deleting.title}" will be permanently deleted.` : ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleting && handleDelete(deleting)}
      />
    </div>
  )
}

// ── Create / Edit dialog ─────────────────────────────────────────────────────

function AnnouncementDialog({
  open, onOpenChange, editing, events, onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: AdminAnnouncement | null
  events: EventSummary[]
  onSaved: (ann: AdminAnnouncement) => void
}) {
  const isEdit = editing !== null
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    if (open) {
      reset({
        title:   editing?.title ?? '',
        body:    editing?.body ?? '',
        eventId: editing?.event?.id != null ? String(editing.event.id) : '',
      })
    }
  }, [open, editing, reset])

  async function onSubmit(values: FormValues) {
    const payload = {
      title:   values.title,
      body:    values.body,
      eventId: values.eventId ? Number(values.eventId) : null,
    }
    try {
      const result = isEdit
        ? await updateAnnouncement(editing!.id, payload)
        : await createAnnouncement(payload)
      toast.success(isEdit ? 'Announcement updated.' : 'Announcement created.')
      onSaved(result)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Save failed.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-2" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ann-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="ann-title"
              autoFocus
              placeholder="Announcement title"
              {...register('title')}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ann-body">Body <span className="text-destructive">*</span></Label>
            <Textarea
              id="ann-body"
              rows={5}
              placeholder="Announcement content…"
              {...register('body')}
              aria-invalid={!!errors.body}
            />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ann-event">Associated Event <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <select
              id="ann-event"
              {...register('eventId')}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">No event</option>
              {events.map((e) => (
                <option key={e.id} value={String(e.id)}>{e.name}</option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
