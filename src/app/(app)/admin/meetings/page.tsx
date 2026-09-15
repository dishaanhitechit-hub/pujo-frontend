'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Search, X, Calendar, Users,
  ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FilterButton, FilterModal, FilterField } from '@/components/shared/FilterModal'
import { FilterChip } from '@/components/shared/FilterChip'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { listAdminMeetings, createMeeting, updateMeeting, deleteMeeting } from '@/lib/api/meetings'
import { listActiveEvents } from '@/lib/api/events'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { Meeting, EventSummary, MeetingStatus, ApiError } from '@/types'

const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  draft:       'Draft',
  scheduled:   'Scheduled',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  general:   'General',
  emergency: 'Emergency',
  committee: 'Committee',
  agm:       'AGM',
  other:     'Other',
}

const STATUS_COLORS: Record<MeetingStatus, string> = {
  draft:       'bg-slate-50 text-slate-500 border-slate-200',
  scheduled:   'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed:   'bg-green-50 text-green-700 border-green-200',
  cancelled:   'bg-red-50 text-red-500 border-red-200',
}

export default function AdminMeetingsPage() {
  return (
    <RoleGuard permission="meeting.manage">
      <MeetingsContent />
    </RoleGuard>
  )
}

const formSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  date:        z.string().min(1, 'Date is required'),
  startTime:   z.string().min(1, 'Start time is required'),
  endTime:     z.string().min(1, 'End time is required'),
  venue:       z.string().optional(),
  meetingType: z.string().min(1),
  status:      z.string().min(1),
  eventId:     z.string().optional(),
})
type FormValues = z.infer<typeof formSchema>

function MeetingsContent() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [events, setEvents]     = useState<EventSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [total, setTotal]       = useState(0)
  const [pages, setPages]       = useState(1)
  const [page, setPage]         = useState(1)
  const PER_PAGE = 20

  const [search, setSearch]             = useState('')
  const debouncedSearch                 = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] = useState('')
  const [draftStatus, setDraftStatus]   = useState('')
  const [filterOpen, setFilterOpen]     = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<Meeting | null>(null)
  const [deleting, setDeleting]     = useState<Meeting | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, evs] = await Promise.all([
        listAdminMeetings({ status: statusFilter || undefined, page, perPage: PER_PAGE }),
        listActiveEvents(),
      ])
      setMeetings(data.meetings)
      setTotal(data.total)
      setPages(data.pages)
      setEvents(evs)
    } catch {
      toast.error('Failed to load meetings.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [statusFilter, debouncedSearch])

  const filtered = debouncedSearch
    ? meetings.filter((m) => m.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : meetings

  async function handleDelete(m: Meeting) {
    try {
      await deleteMeeting(m.id)
      toast.success('Meeting deleted.')
      load()
    } catch {
      toast.error('Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  function onSaved() {
    setDialogOpen(false)
    load()
  }

  function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  const activeFilterCount = statusFilter ? 1 : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Meetings"
        subtitle="Schedule and manage meetings with invitations and attendance."
      >
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true) }}
          className="bg-brand-orange hover:bg-brand-orange/90 text-white"
        >
          <Plus className="size-4 mr-2" />New Meeting
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <FilterButton
          onClick={() => { setDraftStatus(statusFilter); setFilterOpen(true) }}
          activeCount={activeFilterCount}
          className="ml-auto h-8 text-xs"
        />
        <FilterModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter Meetings"
          onApply={() => { setStatusFilter(draftStatus); setFilterOpen(false) }}
          onReset={() => { setDraftStatus(''); setStatusFilter(''); setFilterOpen(false) }}
        >
          <FilterField label="Status" wide>
            <select
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">All statuses</option>
              {Object.entries(MEETING_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FilterField>
        </FilterModal>
      </div>

      {statusFilter && (
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label={`Status: ${MEETING_STATUS_LABELS[statusFilter as MeetingStatus] ?? statusFilter}`}
            onRemove={() => setStatusFilter('')}
          />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Calendar className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No meetings found.</p>
          <Button
            onClick={() => { setEditing(null); setDialogOpen(true) }}
            className="mt-4 bg-brand-orange hover:bg-brand-orange/90 text-white"
          >
            Schedule first meeting
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {total} meeting{total !== 1 ? 's' : ''}
            {activeFilterCount > 0 && ' matching filters'}
          </p>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {filtered.map((m) => (
              <div key={m.id} className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(m.date)} · {m.startTime} – {m.endTime}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[m.status] ?? ''}`}>
                    {MEETING_STATUS_LABELS[m.status] ?? m.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{MEETING_TYPE_LABELS[m.meetingType] ?? m.meetingType}</span>
                  {m.event && <span>{m.event.name}</span>}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <Link href={`/admin/meetings/${m.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                      <ExternalLink className="size-3 mr-1" />Details
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2"
                    onClick={() => { setEditing(m); setDialogOpen(true) }}>
                    <Pencil className="size-3 mr-1" />Edit
                  </Button>
                  <Button variant="outline" size="sm"
                    className="h-7 text-xs px-2 text-destructive border-destructive/20 hover:bg-destructive/5"
                    onClick={() => setDeleting(m)}>
                    <Trash2 className="size-3 mr-1" />Delete
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
                  {['Title', 'Date', 'Time', 'Type', 'Status', 'Event', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-medium">{m.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(m.date)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {m.startTime} – {m.endTime}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{MEETING_TYPE_LABELS[m.meetingType] ?? m.meetingType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[m.status] ?? ''}`}>
                        {MEETING_STATUS_LABELS[m.status] ?? m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{m.event?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Link href={`/admin/meetings/${m.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                            <ExternalLink className="size-3 mr-1" />Details
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2"
                          onClick={() => { setEditing(m); setDialogOpen(true) }}>
                          <Pencil className="size-3 mr-1" />Edit
                        </Button>
                        <Button variant="outline" size="sm"
                          className="h-7 text-xs px-2 text-destructive border-destructive/20 hover:bg-destructive/5"
                          onClick={() => setDeleting(m)}>
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
            <div className="flex items-center justify-between mt-2">
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

      <MeetingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        events={events}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null) }}
        title="Delete meeting?"
        description={deleting ? `"${deleting.title}" will be permanently deleted.` : ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleting && handleDelete(deleting)}
      />
    </div>
  )
}

// ── Create / Edit Dialog ───────────────────────────────────────────────────

function MeetingDialog({
  open, onOpenChange, editing, events, onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: Meeting | null
  events: EventSummary[]
  onSaved: () => void
}) {
  const isEdit = editing !== null
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    if (open) {
      reset({
        title:       editing?.title ?? '',
        description: editing?.description ?? '',
        date:        editing?.date ?? '',
        startTime:   editing?.startTime ?? '',
        endTime:     editing?.endTime ?? '',
        venue:       editing?.venue ?? '',
        meetingType: editing?.meetingType ?? 'general',
        status:      editing?.status ?? 'draft',
        eventId:     editing?.event?.id != null ? String(editing.event.id) : '',
      })
    }
  }, [open, editing, reset])

  async function onSubmit(values: FormValues) {
    const payload = {
      title:       values.title,
      description: values.description || null,
      date:        values.date,
      startTime:   values.startTime,
      endTime:     values.endTime,
      venue:       values.venue || null,
      meetingType: values.meetingType,
      status:      values.status,
      eventId:     values.eventId ? Number(values.eventId) : null,
    }
    try {
      if (isEdit) {
        await updateMeeting(editing!.id, payload)
      } else {
        await createMeeting(payload)
      }
      toast.success(isEdit ? 'Meeting updated.' : 'Meeting created.')
      onSaved()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Save failed.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Meeting' : 'New Meeting'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-2" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mtg-title">Title <span className="text-destructive">*</span></Label>
            <Input id="mtg-title" {...register('title')} placeholder="Meeting title" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mtg-type">Type</Label>
              <select id="mtg-type" {...register('meetingType')}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                {Object.entries(MEETING_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mtg-status">Status</Label>
              <select id="mtg-status" {...register('status')}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                {Object.entries(MEETING_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mtg-date">Date <span className="text-destructive">*</span></Label>
            <Input id="mtg-date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mtg-start">Start Time <span className="text-destructive">*</span></Label>
              <Input id="mtg-start" type="time" {...register('startTime')} />
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mtg-end">End Time <span className="text-destructive">*</span></Label>
              <Input id="mtg-end" type="time" {...register('endTime')} />
              {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mtg-venue">Venue</Label>
            <Input id="mtg-venue" {...register('venue')} placeholder="Meeting venue (optional)" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mtg-event">Event <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <select id="mtg-event" {...register('eventId')}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">No event</option>
              {events.map((e) => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mtg-desc">Description</Label>
            <Textarea id="mtg-desc" rows={3} {...register('description')} placeholder="Optional notes…" />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
