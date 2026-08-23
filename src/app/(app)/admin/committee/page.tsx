'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight,
  Users2, Upload, ImageOff, ToggleLeft, ToggleRight,
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FilterButton, FilterModal, FilterField } from '@/components/shared/FilterModal'
import { FilterChip } from '@/components/shared/FilterChip'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  listAdminCommittee, createCommitteeMember, updateCommitteeMember,
  deleteCommitteeMember, uploadCommitteeMemberPhoto,
} from '@/lib/api/committee'
import { listActiveEvents } from '@/lib/api/events'
import { mediaUrl } from '@/lib/api/public'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { AdminCommitteeMember, EventSummary, ApiError } from '@/types'

export default function CommitteePage() {
  return (
    <RoleGuard permission="content.manage">
      <CommitteeContent />
    </RoleGuard>
  )
}

// ── Form schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  name:      z.string().min(1, 'Name is required').max(150),
  roleTitle: z.string().min(1, 'Role/Title is required').max(150),
  phone:     z.string().max(20).optional(),
  eventId:   z.string().optional(),
  sortOrder: z.string().optional(),
  isActive:  z.boolean(),
})
type FormValues = z.infer<typeof formSchema>

// ── Main content ─────────────────────────────────────────────────────────────

function CommitteeContent() {
  const [members, setMembers] = useState<AdminCommitteeMember[]>([])
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
  const [draftActive, setDraftActive] = useState<'' | 'true' | 'false'>('')
  const [filterOpen, setFilterOpen] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCommitteeMember | null>(null)
  const [deleting, setDeleting] = useState<AdminCommitteeMember | null>(null)

  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetId = useRef<number | null>(null)

  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mem, evs] = await Promise.all([listAdminCommittee(), listActiveEvents()])
      setMembers(mem)
      setEvents(evs)
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to load committee members.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedSearch, activeFilter])

  const filtered = members.filter((m) => {
    if (activeFilter === 'true' && !m.isActive) return false
    if (activeFilter === 'false' && m.isActive) return false
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      if (!m.name.toLowerCase().includes(q) && !m.roleTitle.toLowerCase().includes(q)) return false
    }
    return true
  })
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  async function handleToggleActive(m: AdminCommitteeMember) {
    try {
      const updated = await updateCommitteeMember(m.id, { isActive: !m.isActive })
      setMembers((prev) => prev.map((x) => (x.id === m.id ? updated : x)))
      toast.success(updated.isActive ? 'Member activated.' : 'Member deactivated.')
    } catch {
      toast.error('Update failed.')
    }
  }

  async function handleDelete(m: AdminCommitteeMember) {
    try {
      await deleteCommitteeMember(m.id)
      setMembers((prev) => prev.filter((x) => x.id !== m.id))
      toast.success('Member deleted.')
    } catch {
      toast.error('Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const id = uploadTargetId.current
    if (!file || !id) return
    setUploadingId(id)
    try {
      await uploadCommitteeMemberPhoto(id, file)
      // Reload to get updated photoPath
      const fresh = await listAdminCommittee()
      setMembers(fresh)
      toast.success('Photo uploaded.')
    } catch {
      toast.error('Photo upload failed.')
    } finally {
      setUploadingId(null)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  function triggerPhotoUpload(id: number) {
    uploadTargetId.current = id
    photoInputRef.current?.click()
  }

  function onSaved(member: AdminCommitteeMember) {
    setMembers((prev) => {
      const idx = prev.findIndex((x) => x.id === member.id)
      return idx >= 0
        ? prev.map((x) => (x.id === member.id ? member : x))
        : [...prev, member]
    })
    setDialogOpen(false)
  }

  const activeFilterCount = activeFilter ? 1 : 0

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Committee"
        subtitle="Manage committee members shown on the public website."
        className="mb-6"
      >
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          <Plus className="size-4 mr-2" />Add Member
        </Button>
      </PageHeader>

      {/* Hidden photo input */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handlePhotoChange}
      />

      {/* Search + filter */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or role…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <FilterButton
          onClick={() => { setDraftActive(activeFilter); setFilterOpen(true) }}
          activeCount={activeFilterCount}
          className="ml-auto h-8 text-xs"
        />

        <FilterModal
          open={filterOpen}
          onOpenChange={setFilterOpen}
          title="Filter Members"
          onApply={() => { setActiveFilter(draftActive); setFilterOpen(false) }}
          onReset={() => { setDraftActive(''); setActiveFilter(''); setFilterOpen(false) }}
        >
          <FilterField label="Status" wide>
            <select
              value={draftActive}
              onChange={(e) => setDraftActive(e.target.value as '' | 'true' | 'false')}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </FilterField>
        </FilterModal>
      </div>

      {activeFilter && (
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterChip
            label={`Status: ${activeFilter === 'true' ? 'Active' : 'Inactive'}`}
            onRemove={() => setActiveFilter('')}
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
          <Users2 className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {activeFilterCount > 0 || debouncedSearch
              ? 'No members match the current filters.'
              : 'No committee members yet.'}
          </p>
          {!activeFilterCount && !debouncedSearch && (
            <Button onClick={() => { setEditing(null); setDialogOpen(true) }} className="mt-4 bg-brand-orange hover:bg-brand-orange/90 text-white">
              Add first member
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-2">
            {filtered.length === 1 ? '1 member' : `${filtered.length} members`}
            {(activeFilterCount > 0 || debouncedSearch) && ' matching filters'}
          </p>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Photo', 'Name', 'Role', 'Event', 'Sort', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((m) => {
                  const photoSrc = mediaUrl(m.photoPath)
                  const isUploading = uploadingId === m.id
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          title="Click to upload photo"
                          disabled={isUploading}
                          onClick={() => triggerPhotoUpload(m.id)}
                          className="relative size-10 rounded-full overflow-hidden border border-border bg-muted hover:opacity-80 transition-opacity flex items-center justify-center"
                        >
                          {isUploading ? (
                            <span className="text-[9px] text-muted-foreground font-medium">…</span>
                          ) : photoSrc ? (
                            <Image src={photoSrc} alt={m.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <ImageOff className="size-4 text-muted-foreground/40" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{m.roleTitle}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{m.event?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-center">{m.sortOrder}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                          m.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {m.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => { setEditing(m); setDialogOpen(true) }}>
                            <Pencil className="size-3 mr-1" />Edit
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={isUploading} onClick={() => triggerPhotoUpload(m.id)}>
                            <Upload className="size-3 mr-1" />Photo
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-7 text-xs px-2 ${m.isActive ? 'text-slate-600' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
                            onClick={() => handleToggleActive(m)}
                          >
                            {m.isActive ? <><ToggleLeft className="size-3 mr-1" />Deactivate</> : <><ToggleRight className="size-3 mr-1" />Activate</>}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 text-destructive border-destructive/20 hover:bg-destructive/5"
                            onClick={() => setDeleting(m)}
                          >
                            <Trash2 className="size-3 mr-1" />Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs text-muted-foreground">Page {page} of {pages} · {filtered.length} members</p>
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

      <CommitteeMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        events={events}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null) }}
        title="Delete member?"
        description={deleting ? `${deleting.name} will be permanently removed from the committee.` : ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleting && handleDelete(deleting)}
      />
    </div>
  )
}

// ── Create / Edit dialog ─────────────────────────────────────────────────────

function CommitteeMemberDialog({
  open, onOpenChange, editing, events, onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: AdminCommitteeMember | null
  events: EventSummary[]
  onSaved: (m: AdminCommitteeMember) => void
}) {
  const isEdit = editing !== null
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  useEffect(() => {
    if (open) {
      reset({
        name:      editing?.name ?? '',
        roleTitle: editing?.roleTitle ?? '',
        phone:     editing?.phone ?? '',
        eventId:   editing?.event?.id != null ? String(editing.event.id) : '',
        sortOrder: String(editing?.sortOrder ?? 0),
        isActive:  editing?.isActive ?? true,
      })
    }
  }, [open, editing, reset])

  async function onSubmit(values: FormValues) {
    const payload = {
      name:      values.name,
      roleTitle: values.roleTitle,
      phone:     values.phone?.trim() || null,
      eventId:   values.eventId ? Number(values.eventId) : null,
      sortOrder: values.sortOrder ? parseInt(values.sortOrder, 10) : 0,
      isActive:  values.isActive,
    }
    try {
      const result = isEdit
        ? await updateCommitteeMember(editing!.id, payload)
        : await createCommitteeMember(payload)
      toast.success(isEdit ? 'Member updated.' : 'Member added.')
      onSaved(result)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Save failed.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Member' : 'Add Committee Member'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-2" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="cm-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="cm-name"
                autoFocus
                placeholder="Full name"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="cm-role">Role / Title <span className="text-destructive">*</span></Label>
              <Input
                id="cm-role"
                placeholder="e.g. President, Secretary"
                {...register('roleTitle')}
                aria-invalid={!!errors.roleTitle}
              />
              {errors.roleTitle && <p className="text-xs text-destructive">{errors.roleTitle.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cm-phone">Phone</Label>
              <Input id="cm-phone" type="tel" placeholder="+91 …" {...register('phone')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cm-sort">Sort Order</Label>
              <Input id="cm-sort" type="number" min={0} {...register('sortOrder')} className="h-9" />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="cm-event">Associated Event <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <select
                id="cm-event"
                {...register('eventId')}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">No event</option>
                {events.map((e) => (
                  <option key={e.id} value={String(e.id)}>{e.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 col-span-2">
              <input
                id="cm-active"
                type="checkbox"
                className="size-4 rounded border-input accent-brand-orange"
                {...register('isActive')}
              />
              <Label htmlFor="cm-active" className="cursor-pointer">Active (visible on public website)</Label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
