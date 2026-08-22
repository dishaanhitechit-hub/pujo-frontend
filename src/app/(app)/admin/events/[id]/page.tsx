'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft, Loader2, Save, Star, StarOff, Archive, Globe, Ban,
  Plus, Trash2, Upload, X, Image as ImageIcon, GripVertical, Pencil,
  IndianRupee, Smartphone, Banknote, FileText, CheckCircle2, Clock, Users,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { EventStatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { RoleGuard } from '@/lib/auth/role-guard'
import {
  getEvent, updateEvent, setEventDays, getEventSummary,
  uploadEventCover, uploadEventGallery, deleteEventMedia,
} from '@/lib/api/events'
import { apiConfig } from '@/config/api'
import type { Event, EventDay, DashboardSummary, ApiError } from '@/types'

// ── Types ────────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: number
  url: string
  altText: string | null
  mimeType?: string
}

interface EventDetail extends Event {
  gallery?: GalleryItem[]
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const infoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  year: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  collectionEnabled: z.boolean(),
  isFeatured: z.boolean(),
}).refine(
  (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
  { message: 'End date must be on or after start date', path: ['endDate'] },
)

type InfoFormData = z.infer<typeof infoSchema>

const daySchema = z.object({
  days: z.array(z.object({
    backendId:   z.number().optional(), // tracks whether the item exists in the backend
    key:         z.string().min(1, 'Key is required').max(50),
    label:       z.string().min(1, 'Label is required').max(100),
    date:        z.string().optional(),
    description: z.string().optional(),
    rituals:     z.string(),
    sortOrder:   z.string(),
  })),
})

type DayFormData = z.infer<typeof daySchema>

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard permission="event.manage">
      <EventDetailContent params={params} />
    </RoleGuard>
  )
}

function EventDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const eventId = Number(id)

  const [ev, setEv] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'view' | 'edit'>('view')

  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; description: string; label: string
    variant?: 'destructive' | 'default'; onConfirm: () => void
  }>({ open: false, title: '', description: '', label: 'Confirm', onConfirm: () => {} })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEvent(eventId) as EventDetail
      setEv(data)
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to load event.')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { load() }, [load])

  async function quickPatch(payload: Parameters<typeof updateEvent>[1], msg: string) {
    if (!ev) return
    setBusy(true)
    try {
      const updated = await updateEvent(eventId, payload) as EventDetail
      setEv((prev) => ({ ...updated, gallery: prev?.gallery }))
      toast.success(msg)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Update failed.')
    } finally {
      setBusy(false)
    }
  }

  function openConfirm(opts: typeof confirm) { setConfirm({ ...opts, open: true }) }

  if (loading) return (
    <div className="p-6 lg:p-8 flex flex-col gap-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
  )

  if (error) return (
    <div className="p-6 lg:p-8">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
    </div>
  )

  if (!ev) return null

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-1 text-muted-foreground">
        <Link href="/admin/events"><ArrowLeft className="size-4 mr-1" />Back to Events</Link>
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">{ev.name}</h1>
            <EventStatusBadge status={ev.status} />
            {ev.collectionEnabled && (
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                Collection open
              </span>
            )}
            {ev.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                <Star className="size-3 fill-amber-400 text-amber-400" />Featured
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">{ev.slug}</p>
        </div>
      </div>

      {/* Subtitle line */}
      <p className="text-xs text-muted-foreground mb-4">
        {ev.createdBy && `Created by ${ev.createdBy.name} · `}
        {new Date(ev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        {ev.updatedAt && ` · Updated ${new Date(ev.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      </p>

      {/* Quick actions — always visible */}
      <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-border">
        {ev.status === 'draft' && (
          <Button variant="outline" size="sm" className="text-green-700 border-green-200 hover:bg-green-50" disabled={busy}
            onClick={() => openConfirm({
              open: true, variant: 'default',
              title: `Publish "${ev.name}"?`,
              description: 'Published events are visible on the public website. You can still disable collection separately.',
              label: 'Publish',
              onConfirm: () => quickPatch({ status: 'published' }, 'Event published.'),
            })}>
            {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Globe className="size-3.5 mr-1.5" />}Publish
          </Button>
        )}
        {ev.status === 'published' && (
          <Button variant="outline" size="sm" className="text-slate-600" disabled={busy}
            onClick={() => openConfirm({
              open: true, variant: 'destructive',
              title: `Archive "${ev.name}"?`,
              description: 'Archiving disables collection and marks the event as historical.',
              label: 'Archive',
              onConfirm: () => quickPatch({ status: 'archived' }, 'Event archived.'),
            })}>
            {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Archive className="size-3.5 mr-1.5" />}Archive
          </Button>
        )}
        {ev.status === 'archived' && (
          <Button variant="outline" size="sm" className="text-blue-700 border-blue-200 hover:bg-blue-50" disabled={busy}
            onClick={() => quickPatch({ status: 'published' }, 'Event re-published.')}>
            {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Globe className="size-3.5 mr-1.5" />}Re-publish
          </Button>
        )}

        {ev.status !== 'archived' && (
          <Button variant="outline" size="sm" disabled={busy}
            onClick={() => {
              if (ev.collectionEnabled) {
                openConfirm({
                  open: true, variant: 'destructive',
                  title: 'Disable collection?',
                  description: 'Collectors will no longer see this event in their dropdown. Existing payments are not affected.',
                  label: 'Disable',
                  onConfirm: () => quickPatch({ collectionEnabled: false }, 'Collection disabled.'),
                })
              } else {
                if (ev.status !== 'published') { toast.error('Publish the event before enabling collection.'); return }
                quickPatch({ collectionEnabled: true }, 'Collection enabled.')
              }
            }}>
            {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Ban className="size-3.5 mr-1.5" />}
            {ev.collectionEnabled ? 'Disable Collection' : 'Enable Collection'}
          </Button>
        )}

        {!ev.isFeatured && ev.status === 'published' && (
          <Button variant="outline" size="sm" className="text-amber-700 border-amber-200 hover:bg-amber-50" disabled={busy}
            onClick={() => openConfirm({
              open: true, variant: 'default',
              title: `Feature "${ev.name}"?`,
              description: "This removes the featured flag from any other event. The public homepage will show this event's countdown.",
              label: 'Set Featured',
              onConfirm: () => quickPatch({ isFeatured: true }, 'Event set as featured.'),
            })}>
            {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Star className="size-3.5 mr-1.5" />}Set Featured
          </Button>
        )}
        {ev.isFeatured && (
          <Button variant="outline" size="sm" className="text-amber-700 border-amber-200 hover:bg-amber-50" disabled={busy}
            onClick={() => quickPatch({ isFeatured: false }, 'Event unfeatured.')}>
            {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <StarOff className="size-3.5 mr-1.5" />}Unfeature
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="gap-0">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="media">Cover & Gallery</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {mode === 'view' ? (
            <ViewInfoPanel ev={ev} onEdit={() => setMode('edit')} />
          ) : (
            <InfoTab
              ev={ev}
              eventId={eventId}
              onSaved={(updated) => { setEv((prev) => ({ ...updated, gallery: prev?.gallery })); setMode('view') }}
              onCancel={() => setMode('view')}
            />
          )}
        </TabsContent>

        <TabsContent value="schedule">
          {mode === 'view' ? (
            <ViewSchedulePanel ev={ev} onEdit={() => setMode('edit')} />
          ) : (
            <ScheduleTab
              ev={ev}
              eventId={eventId}
              onSaved={(updated) => { setEv((prev) => ({ ...updated, gallery: prev?.gallery })); setMode('view') }}
              onCancel={() => setMode('view')}
            />
          )}
        </TabsContent>

        <TabsContent value="media">
          <MediaTab ev={ev} eventId={eventId} onRefresh={load} />
        </TabsContent>

        <TabsContent value="summary">
          <SummaryTab eventId={eventId} />
        </TabsContent>
      </Tabs>

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

// ── Field component ──────────────────────────────────────────────────────────

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

// ── View Info Panel ──────────────────────────────────────────────────────────

function ViewInfoPanel({ ev, onEdit }: { ev: EventDetail; onEdit: () => void }) {
  function fmtDate(d: string | null | undefined) {
    if (!d) return '—'
    return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button onClick={onEdit} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          <Pencil className="size-4 mr-2" />Edit Event
        </Button>
      </div>

      {/* Event details */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Event Details</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Name" wide>{ev.name}</Field>
          <Field label="Slug"><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{ev.slug}</code></Field>
          <Field label="Year">{ev.year ?? <span className="text-muted-foreground">—</span>}</Field>
          <Field label="Location">{ev.location ?? <span className="text-muted-foreground">—</span>}</Field>
          <Field label="Start Date">{fmtDate(ev.startDate)}</Field>
          <Field label="End Date">{fmtDate(ev.endDate)}</Field>
          {ev.description ? (
            <Field label="Description" wide>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{ev.description}</p>
            </Field>
          ) : (
            <Field label="Description" wide><span className="text-muted-foreground">—</span></Field>
          )}
        </div>
      </div>

      {/* State & Visibility */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">State & Visibility</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Field label="Status"><EventStatusBadge status={ev.status} /></Field>
          <Field label="Collection">
            {ev.collectionEnabled
              ? <span className="inline-flex items-center text-xs font-semibold text-blue-700">Enabled — collectors can collect</span>
              : <span className="inline-flex items-center text-xs text-muted-foreground">Disabled</span>
            }
          </Field>
          <Field label="Featured">
            {ev.isFeatured
              ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Star className="size-3 fill-amber-400 text-amber-400" />Yes</span>
              : <span className="text-xs text-muted-foreground">No</span>
            }
          </Field>
        </div>
        <div className="px-5 pb-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Note:</strong> Status and Collection are independent.
            Published does not automatically mean Collection is open — it must be toggled separately using the action buttons above.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── View Schedule Panel ──────────────────────────────────────────────────────

function ViewSchedulePanel({ ev, onEdit }: { ev: EventDetail; onEdit: () => void }) {
  const days = [...(ev.days ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button onClick={onEdit} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          <Pencil className="size-4 mr-2" />Edit Schedule
        </Button>
      </div>

      {days.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground text-sm">No schedule days yet.</p>
          <Button onClick={onEdit} variant="outline" className="mt-3">
            <Plus className="size-4 mr-2" />Add Days
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {days.map((day) => (
            <div key={day.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-foreground">{day.label}</p>
                  <code className="text-[11px] text-muted-foreground font-mono">{day.key}</code>
                </div>
                {day.date && (
                  <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                    {new Date(day.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              {day.description && (
                <p className="text-sm text-muted-foreground mb-3">{day.description}</p>
              )}
              {day.rituals && day.rituals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {day.rituals.map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">{r}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Summary Tab ──────────────────────────────────────────────────────────────

function fmt(val: string | number) {
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

function SummaryTab({ eventId }: { eventId: number }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getEventSummary(eventId)
      .then(setSummary)
      .catch((err: ApiError) => setError(err.message ?? 'Failed to load summary.'))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  )

  if (error) return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
  )

  if (!summary) return null

  const hasPayments = summary.confirmedCount > 0 || summary.pendingCount > 0
  const hasPledges = Number(summary.totalPledged) > 0 || summary.openPledgeCount > 0

  if (!hasPayments && !hasPledges) return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-muted-foreground text-sm">No collections recorded for this event yet.</p>
      <p className="text-xs text-muted-foreground mt-1">Data appears here once collectors start recording payments.</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      {/* Collection totals */}
      <div>
        <h2 className="text-sm font-semibold mb-4">Collection Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <StatCard label="Grand Total" value={fmt(summary.grandTotal)} icon={IndianRupee} variant="primary" />
          </div>
          <StatCard label="UPI" value={fmt(summary.upiTotal)} icon={Smartphone} />
          <StatCard label="Cash" value={fmt(summary.cashTotal)} icon={Banknote} />
          <StatCard label="Cheque" value={fmt(summary.chequeTotal)} icon={FileText} />
          <StatCard label="Completed" value={summary.confirmedCount} icon={CheckCircle2} variant="success" />
          <StatCard label="Pending" value={summary.pendingCount} icon={Clock} variant="warning" />
          <StatCard label="Unique Donors" value={summary.totalDonors} icon={Users} />
        </div>
      </div>

      {/* Pledge summary */}
      {hasPledges && (
        <div>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><TrendingUp className="size-4" />Pledge Summary</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Total Pledged</p>
                <p className="font-semibold text-xl">{fmt(summary.totalPledged)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Paid</p>
                <p className="font-semibold text-xl text-green-700">{fmt(summary.totalPledgePaid)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Outstanding</p>
                <p className="font-semibold text-xl text-yellow-700">{fmt(summary.totalPledgeOutstanding)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Open Pledges</p>
                <p className="font-semibold text-xl">{summary.openPledgeCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        These totals use the same business rules as the dashboard — only completed and confirmed payments are counted.
        They reflect all data associated with this event, regardless of any dashboard filters.
      </p>
    </div>
  )
}

// ── Info Tab (edit mode) ─────────────────────────────────────────────────────

interface InfoTabProps {
  ev: EventDetail
  eventId: number
  onSaved: (ev: EventDetail) => void
  onCancel: () => void
}

function InfoTab({ ev, eventId, onSaved, onCancel }: InfoTabProps) {
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = useForm<InfoFormData>({
    resolver: zodResolver(infoSchema),
    defaultValues: {
      name: ev.name,
      year: ev.year != null ? String(ev.year) : '',
      startDate: ev.startDate ?? '',
      endDate: ev.endDate ?? '',
      location: ev.location ?? '',
      description: ev.description ?? '',
      status: ev.status,
      collectionEnabled: ev.collectionEnabled,
      isFeatured: ev.isFeatured,
    },
  })

  useEffect(() => {
    reset({
      name: ev.name,
      year: ev.year != null ? String(ev.year) : '',
      startDate: ev.startDate ?? '',
      endDate: ev.endDate ?? '',
      location: ev.location ?? '',
      description: ev.description ?? '',
      status: ev.status,
      collectionEnabled: ev.collectionEnabled,
      isFeatured: ev.isFeatured,
    })
  }, [ev, reset])

  async function onSubmit(data: InfoFormData) {
    setSaving(true)
    try {
      const yearNum = data.year ? parseInt(data.year, 10) : null
      const updated = await updateEvent(eventId, {
        name: data.name,
        description: data.description || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        location: data.location || null,
        year: yearNum && !isNaN(yearNum) ? yearNum : null,
        status: data.status,
        collectionEnabled: data.collectionEnabled,
        isFeatured: data.isFeatured,
      }) as EventDetail
      toast.success('Event info saved.')
      onSaved(updated)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Save failed.')
      setSaving(false)
    }
  }

  function handleCancel() {
    reset()
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-5">
        <legend className="text-sm font-semibold text-foreground px-1">Event Details</legend>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="e-name">Name <span className="text-destructive">*</span></Label>
          <Input id="e-name" aria-invalid={!!errors.name} {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-year">Year</Label>
            <Input id="e-year" type="number" min="2000" max="2100" {...register('year')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-location">Location</Label>
            <Input id="e-location" placeholder="e.g. Kolaghat" {...register('location')} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-startDate">Start Date</Label>
            <Input id="e-startDate" type="date" {...register('startDate')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-endDate">End Date</Label>
            <Input id="e-endDate" type="date" {...register('endDate')} />
            {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="e-description">Description</Label>
          <Textarea id="e-description" rows={3} {...register('description')} />
        </div>
      </fieldset>

      <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-5">
        <legend className="text-sm font-semibold text-foreground px-1">State & Visibility</legend>

        <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Lifecycle:</strong>
          {' '}Draft → not public, no collection.
          {' '}Published → public, collection depends on its own toggle.
          {' '}Archived → historical, no collection.
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="e-status">Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="e-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="draft">Draft — not public</SelectItem>
                  <SelectItem value="published">Published — public</SelectItem>
                  <SelectItem value="archived">Archived — historical</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Controller control={control} name="collectionEnabled" render={({ field }) => (
              <input id="e-collectionEnabled" type="checkbox"
                className="mt-0.5 size-4 accent-brand-orange cursor-pointer"
                checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
            )} />
            <div>
              <Label htmlFor="e-collectionEnabled" className="cursor-pointer">Enable Collection</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Collectors can record payments against this event. Requires Published status.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Controller control={control} name="isFeatured" render={({ field }) => (
              <input id="e-isFeatured" type="checkbox"
                className="mt-0.5 size-4 accent-brand-orange cursor-pointer"
                checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
            )} />
            <div>
              <Label htmlFor="e-isFeatured" className="cursor-pointer">Featured Event</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Drives public homepage countdown. Checking this will unfeature any other event.</p>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !isDirty}
          className="bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold px-8">
          {saving && <Loader2 className="size-4 animate-spin mr-2" />}
          <Save className="size-4 mr-2" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" className="h-10" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// ── Schedule Tab (edit mode) ─────────────────────────────────────────────────

interface ScheduleTabProps {
  ev: EventDetail
  eventId: number
  onSaved: (ev: EventDetail) => void
  onCancel: () => void
}

function ScheduleTab({ ev, eventId, onSaved, onCancel }: ScheduleTabProps) {
  const [saving, setSaving] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<{ idx: number; label: string } | null>(null)

  const { register, handleSubmit, control, formState: { errors } } = useForm<DayFormData>({
    resolver: zodResolver(daySchema),
    defaultValues: {
      days: (ev.days ?? []).map((d) => ({
        backendId:   d.id,
        key:         d.key,
        label:       d.label,
        date:        d.date ?? '',
        description: d.description ?? '',
        rituals:     (d.rituals ?? []).join(', '),
        sortOrder:   String(d.sortOrder),
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'days' })

  function handleRemoveClick(idx: number) {
    const field = fields[idx]
    if (field.backendId) {
      // persisted — require confirmation
      setPendingRemove({ idx, label: field.label || 'this schedule item' })
    } else {
      // new (unsaved) — remove immediately
      remove(idx)
    }
  }

  async function onSubmit(data: DayFormData) {
    setSaving(true)
    try {
      const updated = await setEventDays(eventId, data.days.map((d, i) => ({
        key:         d.key,
        label:       d.label,
        date:        d.date || null,
        description: d.description || null,
        rituals:     d.rituals.split(',').map((r) => r.trim()).filter(Boolean),
        sortOrder:   d.sortOrder ? parseInt(d.sortOrder, 10) : i,
      }))) as EventDetail
      toast.success('Schedule saved.')
      onSaved(updated)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Save failed.')
      setSaving(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        <div className="bg-muted/40 rounded-lg p-4 flex flex-col gap-1">
          <p className="text-xs font-semibold text-foreground">Event Schedule</p>
          <p className="text-xs text-muted-foreground">Add the important days, sessions, activities, or programme items for this event. Each entry has a key (internal identifier), title, optional date, and activities (comma-separated). This replaces the entire schedule on save.</p>
        </div>

        {fields.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
            No days added yet. Add days below.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {fields.map((field, idx) => {
            const dayErrors = errors.days?.[idx]
            return (
              <div key={field.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="size-4 shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Day {idx + 1}</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveClick(idx)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Key <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g. opening-ceremony" aria-invalid={!!dayErrors?.key} {...register(`days.${idx}.key`)} />
                    {dayErrors?.key && <p className="text-xs text-destructive">{dayErrors.key.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Label <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g. Mahashtami, Opening Ceremony, Cultural Night" aria-invalid={!!dayErrors?.label} {...register(`days.${idx}.label`)} />
                    {dayErrors?.label && <p className="text-xs text-destructive">{dayErrors.label.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Date</Label>
                    <Input type="date" {...register(`days.${idx}.date`)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Sort Order</Label>
                    <Input type="number" min="0" {...register(`days.${idx}.sortOrder`)} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Description</Label>
                  <Input placeholder="Optional short description" {...register(`days.${idx}.description`)} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Activities (comma-separated)</Label>
                  <Input placeholder="e.g. Pushpanjali, Sandhi Puja, Dance Performance, Music Programme" {...register(`days.${idx}.rituals`)} />
                </div>
              </div>
            )
          })}
        </div>

        <Button type="button" variant="outline" className="self-start"
          onClick={() => append({ backendId: undefined, key: '', label: '', date: '', description: '', rituals: '', sortOrder: String(fields.length) })}>
          <Plus className="size-4 mr-2" />Add Day
        </Button>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold px-8">
            {saving && <Loader2 className="size-4 animate-spin mr-2" />}
            <Save className="size-4 mr-2" />
            {saving ? 'Saving…' : 'Save Schedule'}
          </Button>
          <Button type="button" variant="outline" className="h-10" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(o) => { if (!o) setPendingRemove(null) }}
        title="Delete schedule item?"
        description={pendingRemove ? `${pendingRemove.label} will be removed from this event's schedule.` : ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (pendingRemove !== null) {
            remove(pendingRemove.idx)
            setPendingRemove(null)
          }
        }}
      />
    </>
  )
}

// ── Media Tab ────────────────────────────────────────────────────────────────

function MediaTab({ ev, eventId, onRefresh }: { ev: EventDetail; eventId: number; onRefresh: () => Promise<void> }) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; mediaId: number | null }>({ open: false, mediaId: null })

  const base = apiConfig.baseUrl

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      await uploadEventCover(eventId, file)
      toast.success('Cover image uploaded.')
      await onRefresh()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Cover upload failed.')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingGallery(true)
    try {
      for (const file of files) {
        await uploadEventGallery(eventId, file)
      }
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} added to gallery.`)
      await onRefresh()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Gallery upload failed.')
    } finally {
      setUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  async function deleteMedia(mediaId: number) {
    setDeletingId(mediaId)
    try {
      await deleteEventMedia(mediaId)
      toast.success('Image removed.')
      await onRefresh()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Delete failed.')
    } finally {
      setDeletingId(null)
    }
  }

  const gallery: GalleryItem[] = ev.gallery ?? []

  return (
    <div className="flex flex-col gap-8">
      {/* Cover image */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-foreground text-sm">Cover Image</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Displayed on the public events list and event detail page. Replaces any existing cover.</p>
        </div>

        {ev.coverImagePath ? (
          <div className="relative rounded-xl overflow-hidden border border-border w-full max-w-sm aspect-video bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${base}/media/${ev.coverImagePath}`} alt="Event cover" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border w-full max-w-sm aspect-video bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8 opacity-30" />
            <span className="text-xs">No cover image</span>
          </div>
        )}

        <div>
          <input ref={coverInputRef} type="file" accept="image/*" className="sr-only" onChange={handleCoverUpload} />
          <Button type="button" variant="outline" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()}>
            {uploadingCover ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
            {ev.coverImagePath ? 'Replace Cover' : 'Upload Cover'}
          </Button>
        </div>
      </section>

      {/* Gallery */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-foreground text-sm">Gallery</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Images shown on the public event detail and gallery pages. You can upload multiple images at once. Max 10 MB each.</p>
        </div>

        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gallery.map((img) => (
              <div key={img.id} className="relative rounded-xl overflow-hidden border border-border aspect-square bg-muted group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${base}${img.url}`} alt={img.altText ?? 'Gallery image'} className="w-full h-full object-cover" />
                <button type="button" disabled={deletingId === img.id}
                  onClick={() => setConfirmDelete({ open: true, mediaId: img.id })}
                  className="absolute top-1.5 right-1.5 size-7 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  aria-label="Delete image">
                  {deletingId === img.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
            No gallery images yet.
          </div>
        )}

        <div>
          <input ref={galleryInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleGalleryUpload} />
          <Button type="button" variant="outline" disabled={uploadingGallery} onClick={() => galleryInputRef.current?.click()}>
            {uploadingGallery ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
            {uploadingGallery ? 'Uploading…' : 'Add to Gallery'}
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(o) => setConfirmDelete((c) => ({ ...c, open: o }))}
        title="Delete image?"
        description="This will permanently remove the image. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          const id = confirmDelete.mediaId
          setConfirmDelete({ open: false, mediaId: null })
          if (id != null) deleteMedia(id)
        }}
      />
    </div>
  )
}
