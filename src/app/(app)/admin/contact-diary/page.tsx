'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Plus, Search, BookUser, Phone, MapPin, Briefcase,
  Pencil, Trash2, X, StickyNote, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  listContactDiary, createContactDiaryEntry, updateContactDiaryEntry, deleteContactDiaryEntry,
} from '@/lib/api/contact-diary'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { ContactDiaryEntry, ApiError } from '@/types'

export default function ContactDiaryPage() {
  return (
    <RoleGuard permission="users.manage">
      <ContactDiaryContent />
    </RoleGuard>
  )
}

function ContactDiaryContent() {
  const [entries, setEntries]       = useState<ContactDiaryEntry[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const debouncedSearch             = useDebouncedValue(search, 350)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState<ContactDiaryEntry | null>(null)
  const [deleting, setDeleting]     = useState<ContactDiaryEntry | null>(null)

  const PER_PAGE = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listContactDiary({ page, perPage: PER_PAGE, search: debouncedSearch || undefined })
      setEntries(res.entries)
      setTotal(res.total)
    } catch {
      toast.error('Failed to load contact diary.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  function openCreate() { setEditing(null); setDialogOpen(true) }
  function openEdit(e: ContactDiaryEntry) { setEditing(e); setDialogOpen(true) }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteContactDiaryEntry(deleting.id)
      toast.success('Contact deleted.')
      setDeleting(null)
      load()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to delete.')
    }
  }

  function initials(name: string) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
      <PageHeader title="Contact Diary" subtitle="Private contact records for this organisation.">
        <Button onClick={openCreate} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          <Plus className="size-4 mr-2" />Add Contact
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search name, phone, occupation…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-8"
        />
        {search && (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearch('')}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <BookUser className="size-10 opacity-20" />
          <p className="text-sm">{search ? 'No contacts match your search.' : 'No contacts yet. Add one to get started.'}</p>
        </div>
      ) : (
        <>
          {/* ── Desktop table ─────────────────────────────────────── */}
          <div className="hidden sm:block rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Name', 'Phone', 'Occupation', 'Address', 'Notes', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-brand-orange">{initials(entry.name)}</span>
                        </div>
                        <span className="font-medium text-foreground">{entry.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{entry.phone}</td>
                    <td className="px-5 py-3 text-muted-foreground">{entry.occupation ?? '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground max-w-[180px] truncate">{entry.address ?? '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground max-w-[200px]">
                      {entry.notes
                        ? <span className="line-clamp-1 italic text-xs">{entry.notes}</span>
                        : <span>—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm"
                          className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(entry)}>
                          <Pencil className="size-3" />Edit
                        </Button>
                        <Button variant="ghost" size="sm"
                          className="h-7 px-2 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleting(entry)}>
                          <Trash2 className="size-3" />Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ──────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:hidden">
            {entries.map(entry => (
              <div key={entry.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                {/* Header row */}
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-brand-orange">{initials(entry.name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone className="size-3 text-muted-foreground/60 shrink-0" />
                      <p className="text-xs text-muted-foreground">{entry.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(entry)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                      onClick={() => setDeleting(entry)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Detail chips */}
                {(entry.occupation || entry.address || entry.notes) && (
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-border/60">
                    {entry.occupation && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="size-3 text-muted-foreground/60 shrink-0" />
                        <p className="text-xs text-muted-foreground">{entry.occupation}</p>
                      </div>
                    )}
                    {entry.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="size-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{entry.address}</p>
                      </div>
                    )}
                    {entry.notes && (
                      <div className="flex items-start gap-1.5">
                        <StickyNote className="size-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground/80 italic leading-relaxed line-clamp-2">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">{total} contacts</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground px-1">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit dialog */}
      <EntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onDone={() => { setDialogOpen(false); load() }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={o => { if (!o) setDeleting(null) }}
        title="Delete contact?"
        description={deleting ? `Remove "${deleting.name}" from the contact diary? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

function EntryDialog({
  open, onOpenChange, editing, onDone,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: ContactDiaryEntry | null
  onDone: () => void
}) {
  const isEdit = !!editing
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '', occupation: '', notes: '' })

  useEffect(() => {
    if (open) {
      setForm({
        name:       editing?.name       ?? '',
        phone:      editing?.phone      ?? '',
        address:    editing?.address    ?? '',
        occupation: editing?.occupation ?? '',
        notes:      editing?.notes      ?? '',
      })
    }
  }, [open, editing])

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name:       form.name.trim(),
        phone:      form.phone.trim(),
        address:    form.address.trim()    || null,
        occupation: form.occupation.trim() || null,
        notes:      form.notes.trim()      || null,
      }
      if (isEdit && editing) {
        await updateContactDiaryEntry(editing.id, payload)
        toast.success('Contact updated.')
      } else {
        await createContactDiaryEntry(payload)
        toast.success('Contact added.')
      }
      onDone()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to save contact.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cd-name">Name <span className="text-destructive">*</span></Label>
              <Input id="cd-name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cd-phone">Phone <span className="text-destructive">*</span></Label>
              <Input id="cd-phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number" required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cd-occupation">Occupation</Label>
            <Input id="cd-occupation" value={form.occupation} onChange={e => set('occupation', e.target.value)} placeholder="e.g. Doctor, Teacher, Business" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cd-address">Address</Label>
            <Input id="cd-address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street, area, city" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cd-notes">Notes</Label>
            <Textarea id="cd-notes" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
