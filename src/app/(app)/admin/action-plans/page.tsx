'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight,
  ClipboardList, UserPlus, UserMinus, Loader2,
} from 'lucide-react'
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
import {
  listAdminActionPlans, createActionPlan, updateActionPlan, deleteActionPlan,
  addAssignees, removeAssignee,
} from '@/lib/api/action-plans'
import { listActiveEvents } from '@/lib/api/events'
import { getUsers } from '@/lib/api/users'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { cn } from '@/lib/utils'
import type { ActionPlan, EventSummary, ActionPlanStatus, ActionPlanPriority, ApiError, User } from '@/types'
import { ROLE_LABELS } from '@/config/roles'

const STATUS_LABELS: Record<ActionPlanStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
  on_hold:     'On Hold',
  cancelled:   'Cancelled',
}

const PRIORITY_LABELS: Record<ActionPlanPriority, string> = {
  low:    'Low',
  medium: 'Medium',
  high:   'High',
  urgent: 'Urgent',
}

const STATUS_COLORS: Record<ActionPlanStatus, string> = {
  not_started: 'bg-slate-50 text-slate-500 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed:   'bg-green-50 text-green-700 border-green-200',
  on_hold:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  cancelled:   'bg-red-50 text-red-500 border-red-200',
}

const PRIORITY_COLORS: Record<ActionPlanPriority, string> = {
  low:    'bg-slate-50 text-slate-500 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high:   'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
}

export default function AdminActionPlansPage() {
  return (
    <RoleGuard permission="meeting.manage">
      <ActionPlansContent />
    </RoleGuard>
  )
}

const formSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(300),
  description: z.string().optional(),
  startDate:   z.string().optional(),
  dueDate:     z.string().optional(),
  priority:    z.string().min(1),
  status:      z.string().min(1),
  notes:       z.string().optional(),
  eventId:     z.string().optional(),
})
type FormValues = z.infer<typeof formSchema>

function ActionPlansContent() {
  const [plans, setPlans]   = useState<ActionPlan[]>([])
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal]   = useState(0)
  const [pages, setPages]   = useState(1)
  const [page, setPage]     = useState(1)
  const PER_PAGE = 20

  const [search, setSearch]               = useState('')
  const debouncedSearch                   = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter]   = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [draftStatus, setDraftStatus]     = useState('')
  const [draftPriority, setDraftPriority] = useState('')
  const [filterOpen, setFilterOpen]       = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ActionPlan | null>(null)
  const [deleting, setDeleting]     = useState<ActionPlan | null>(null)

  // Assignee management
  const [assigneeTarget, setAssigneeTarget] = useState<ActionPlan | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, evs] = await Promise.all([
        listAdminActionPlans({
          status:   statusFilter || undefined,
          priority: priorityFilter || undefined,
          search:   debouncedSearch || undefined,
          page,
          perPage:  PER_PAGE,
        }),
        listActiveEvents(),
      ])
      setPlans(data.actionPlans)
      setTotal(data.total)
      setPages(data.pages)
      setEvents(evs)
    } catch {
      toast.error('Failed to load action plans.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter, debouncedSearch, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [statusFilter, priorityFilter, debouncedSearch])

  async function handleDelete(p: ActionPlan) {
    try {
      await deleteActionPlan(p.id)
      toast.success('Action plan deleted.')
      load()
    } catch { toast.error('Delete failed.') }
    finally { setDeleting(null) }
  }

  async function handleAddAssignees(ids: number[]) {
    if (!assigneeTarget || !ids.length) return
    try {
      await addAssignees(assigneeTarget.id, ids)
      toast.success('Assignees added.')
      setAssigneeTarget(null)
      load()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed.')
    }
  }

  async function handleRemoveAssignee(planId: number, userId: number) {
    try {
      await removeAssignee(planId, userId)
      toast.success('Assignee removed.')
      load()
    } catch { toast.error('Failed.') }
  }

  function onSaved() { setDialogOpen(false); load() }

  function fmtDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const activeFilterCount = [statusFilter, priorityFilter].filter(Boolean).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Action Plans"
        subtitle="Manage programme action plans and assign responsibilities."
      >
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true) }}
          className="bg-brand-orange hover:bg-brand-orange/90 text-white"
        >
          <Plus className="size-4 mr-2" />New Plan
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <FilterButton
          onClick={() => { setDraftStatus(statusFilter); setDraftPriority(priorityFilter); setFilterOpen(true) }}
          activeCount={activeFilterCount}
          className="ml-auto h-8 text-xs"
        />
        <FilterModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter Action Plans"
          onApply={() => { setStatusFilter(draftStatus); setPriorityFilter(draftPriority); setFilterOpen(false) }}
          onReset={() => { setDraftStatus(''); setDraftPriority(''); setStatusFilter(''); setPriorityFilter(''); setFilterOpen(false) }}
        >
          <FilterField label="Status">
            <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FilterField>
          <FilterField label="Priority">
            <select value={draftPriority} onChange={(e) => setDraftPriority(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All</option>
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FilterField>
        </FilterModal>
      </div>

      {/* Filter chips */}
      {(statusFilter || priorityFilter) && (
        <div className="flex flex-wrap gap-2">
          {statusFilter && <FilterChip label={`Status: ${STATUS_LABELS[statusFilter as ActionPlanStatus] ?? statusFilter}`} onRemove={() => setStatusFilter('')} />}
          {priorityFilter && <FilterChip label={`Priority: ${PRIORITY_LABELS[priorityFilter as ActionPlanPriority] ?? priorityFilter}`} onRemove={() => setPriorityFilter('')} />}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <ClipboardList className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No action plans found.</p>
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className="mt-4 bg-brand-orange hover:bg-brand-orange/90 text-white">
            Create first plan
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{total} plan{total !== 1 ? 's' : ''}</p>

          <div className="flex flex-col gap-3">
            {plans.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{p.title}</h3>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[p.priority]}`}>
                        {PRIORITY_LABELS[p.priority]}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {fmtDate(p.dueDate)}
                      {p.event && ` · ${p.event.name}`}
                    </p>
                    {p.assignees.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.assignees.map((a) => (
                          <span key={a.id} className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
                            {a.user?.name ?? '—'}
                            <button
                              onClick={() => a.user && handleRemoveAssignee(p.id, a.user.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <UserMinus className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap shrink-0">
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2"
                      onClick={() => setAssigneeTarget(p)}>
                      <UserPlus className="size-3 mr-1" />Assign
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2"
                      onClick={() => { setEditing(p); setDialogOpen(true) }}>
                      <Pencil className="size-3 mr-1" />Edit
                    </Button>
                    <Button variant="outline" size="sm"
                      className="h-7 text-xs px-2 text-destructive border-destructive/20 hover:bg-destructive/5"
                      onClick={() => setDeleting(p)}>
                      <Trash2 className="size-3 mr-1" />Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between">
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

      {/* Create / Edit dialog */}
      <ActionPlanDialog
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
        title="Delete action plan?"
        description={deleting ? `"${deleting.title}" will be permanently deleted.` : ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleting && handleDelete(deleting)}
      />

      {/* Assignee picker dialog */}
      <UserPickerDialog
        open={!!assigneeTarget}
        onOpenChange={(o) => { if (!o) setAssigneeTarget(null) }}
        title="Add Assignees"
        excludeIds={assigneeTarget?.assignees.map((a) => a.user?.id).filter(Boolean) as number[]}
        onSave={handleAddAssignees}
      />
    </div>
  )
}

// ── Reusable user picker dialog ───────────────────────────────────────────────

function UserPickerDialog({ open, onOpenChange, title, excludeIds = [], onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  excludeIds?: number[]
  onSave: (ids: number[]) => Promise<void>
}) {
  const [allUsers, setAllUsers]     = useState<User[]>([])
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!open) return
    setSelected(new Set())
    setSearch('')
    setLoading(true)
    getUsers().then(setAllUsers).catch(() => {}).finally(() => setLoading(false))
  }, [open])

  function toggleUser(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const visible = allUsers
    .filter((u) => u.role !== 'admin' && u.isActive && !excludeIds.includes(u.id))
    .filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    )

  async function handleSave() {
    const ids = [...selected]
    if (!ids.length) return
    setSaving(true)
    try {
      await onSave(ids)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm flex-1"
            />
            {selected.size > 0 && (
              <span className="text-xs text-brand-orange font-medium whitespace-nowrap">{selected.size} selected</span>
            )}
          </div>
          <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : visible.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No members found.</p>
            ) : (
              visible.map((u) => (
                <label key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer border-b border-border last:border-0 transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.has(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="rounded accent-brand-orange shrink-0"
                  />
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="size-7 rounded-full bg-brand-navy/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-brand-navy">
                        {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                      </p>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || selected.size === 0}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            {saving ? 'Adding…' : `Add ${selected.size > 0 ? `(${selected.size})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ActionPlanDialog({ open, onOpenChange, editing, events, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; editing: ActionPlan | null; events: EventSummary[]; onSaved: () => void
}) {
  const isEdit = editing !== null
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  // Assignee picker (create mode only)
  const [allUsers, setAllUsers]           = useState<User[]>([])
  const [loadingUsers, setLoadingUsers]   = useState(false)
  const [userSearch, setUserSearch]       = useState('')
  const [selectedAssignees, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open) {
      reset({
        title:       editing?.title ?? '',
        description: editing?.description ?? '',
        startDate:   editing?.startDate ?? '',
        dueDate:     editing?.dueDate ?? '',
        priority:    editing?.priority ?? 'medium',
        status:      editing?.status ?? 'not_started',
        notes:       editing?.notes ?? '',
        eventId:     editing?.event?.id != null ? String(editing.event.id) : '',
      })
      setSelected(new Set())
      setUserSearch('')
      if (!isEdit && allUsers.length === 0) {
        setLoadingUsers(true)
        getUsers().then(setAllUsers).catch(() => {}).finally(() => setLoadingUsers(false))
      }
    }
  }, [open, editing, reset])

  function toggleUser(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredUsers = allUsers
    .filter((u) => u.role !== 'admin' && u.isActive)
    .filter((u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    )

  async function onSubmit(values: FormValues) {
    const payload = {
      title:       values.title,
      description: values.description || null,
      startDate:   values.startDate || null,
      dueDate:     values.dueDate || null,
      priority:    values.priority,
      status:      values.status,
      notes:       values.notes || null,
      eventId:     values.eventId ? Number(values.eventId) : null,
    }
    try {
      if (isEdit) {
        await updateActionPlan(editing!.id, payload)
      } else {
        const created = await createActionPlan(payload)
        if (selectedAssignees.size > 0) {
          await addAssignees(created.id, [...selectedAssignees])
        }
      }
      toast.success(isEdit ? 'Action plan updated.' : 'Action plan created.')
      onSaved()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Save failed.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Action Plan' : 'New Action Plan'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-2" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input {...register('title')} placeholder="Action plan title" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <select {...register('priority')}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <select {...register('status')}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Start Date</Label>
              <Input type="date" {...register('startDate')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Due Date</Label>
              <Input type="date" {...register('dueDate')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Associated Event</Label>
            <select {...register('eventId')}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">No event</option>
              {events.map((e) => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={3} {...register('description')} placeholder="Optional description…" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} {...register('notes')} placeholder="Optional notes…" />
          </div>

          {/* Assignees — create mode only */}
          {!isEdit && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Assignees <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                {selectedAssignees.size > 0 && (
                  <span className="text-xs text-brand-orange font-medium">{selectedAssignees.size} selected</span>
                )}
              </div>
              <Input
                placeholder="Search members…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-5">No members found.</p>
                ) : (
                  filteredUsers.map((u) => (
                    <label key={u.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer border-b border-border last:border-0 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedAssignees.has(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="rounded accent-brand-orange shrink-0"
                      />
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="size-7 rounded-full bg-brand-navy/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-brand-navy">
                            {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
