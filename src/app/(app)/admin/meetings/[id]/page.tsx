'use client'

import { useCallback, useEffect, useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft, Users, ListChecks, MessageSquare, ClipboardCheck,
  Plus, Trash2, UserMinus, Loader2, Lock, Eye, CheckCircle2,
  Calendar, Clock, MapPin,
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  draft:       'bg-slate-100 text-slate-600 border-slate-200',
  scheduled:   'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed:   'bg-green-50 text-green-700 border-green-200',
  cancelled:   'bg-red-50 text-red-500 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  draft:       'Draft',
  scheduled:   'Scheduled',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
}

const TYPE_LABELS: Record<string, string> = {
  general:   'General',
  emergency: 'Emergency',
  committee: 'Committee',
  agm:       'AGM',
  other:     'Other',
}

const AGENDA_STATUS_COLORS: Record<string, string> = {
  open:        'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed:   'bg-green-50 text-green-700 border-green-200',
  deferred:    'bg-slate-50 text-slate-500 border-slate-200',
}
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  getAdminMeeting, listInvitees, addInvitees, removeInvitee,
  listAgenda, createAgendaItem, deleteAgendaItem,
  listDiscussions, createDiscussion, deleteDiscussion,
  listAdminAttendance,
} from '@/lib/api/meetings'
import { getUsers } from '@/lib/api/users'
import type {
  Meeting, MeetingInvitee, MeetingAgendaItem, MeetingDiscussion, User, ApiError,
} from '@/types'
import { ROLE_LABELS } from '@/config/roles'
import { cn } from '@/lib/utils'

type Tab = 'details' | 'invitees' | 'agenda' | 'discussions' | 'attendance'

export default function AdminMeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard permission="meeting.manage">
      <MeetingDetailContent params={params} />
    </RoleGuard>
  )
}

function MeetingDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const meetingId = Number(id)

  const [meeting, setMeeting]       = useState<Meeting | null>(null)
  const [invitees, setInvitees]     = useState<MeetingInvitee[]>([])
  const [agenda, setAgenda]         = useState<MeetingAgendaItem[]>([])
  const [discussions, setDiscussions] = useState<MeetingDiscussion[]>([])
  const [attendance, setAttendance] = useState<{ id: number; user: { id: number; name: string } | null; markedAt: string | null }[]>([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState<Tab>('details')

  // Invite dialog state
  const [inviteOpen, setInviteOpen]   = useState(false)
  const [removingUser, setRemovingUser] = useState<MeetingInvitee | null>(null)

  // Agenda dialog state
  const [agendaOpen, setAgendaOpen]         = useState(false)
  const [deletingAgenda, setDeletingAgenda] = useState<MeetingAgendaItem | null>(null)

  // Discussion dialog state
  const [discOpen, setDiscOpen]         = useState(false)
  const [deletingDisc, setDeletingDisc] = useState<MeetingDiscussion | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const m = await getAdminMeeting(meetingId)
      setMeeting(m)
      const [inv, ag, disc, att] = await Promise.all([
        listInvitees(meetingId),
        listAgenda(meetingId),
        listDiscussions(meetingId),
        listAdminAttendance(meetingId),
      ])
      setInvitees(inv)
      setAgenda(ag)
      setDiscussions(disc)
      setAttendance(att)
    } catch {
      toast.error('Failed to load meeting.')
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  useEffect(() => { load() }, [load])

  function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  function fmtTs(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'details',     label: 'Details',     icon: <ListChecks className="size-4" /> },
    { id: 'invitees',    label: 'Invitees',    icon: <Users className="size-4" />,     count: invitees.length },
    { id: 'agenda',      label: 'Agenda',      icon: <ListChecks className="size-4" />, count: agenda.length },
    { id: 'discussions', label: 'Discussions', icon: <MessageSquare className="size-4" />, count: discussions.length },
    { id: 'attendance',  label: 'Attendance',  icon: <ClipboardCheck className="size-4" />, count: attendance.length },
  ]

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-muted-foreground">Meeting not found.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/meetings">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />Back
          </Button>
        </Link>
        <PageHeader title={meeting.title} subtitle={`${fmtDate(meeting.date)} · ${meeting.startTime} – ${meeting.endTime}`} />
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="overflow-x-auto border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 min-w-max pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                tab === t.id
                  ? 'border-brand-orange text-brand-orange'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1 text-xs bg-muted rounded-full px-1.5 py-0.5">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'details' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Status + type header */}
          <div className="px-5 py-4 flex flex-wrap items-center gap-3 border-b border-border bg-muted/20">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[meeting.status] ?? ''}`}>
              {STATUS_LABELS[meeting.status] ?? meeting.status}
            </span>
            <span className="text-xs text-muted-foreground font-medium px-2.5 py-1 rounded-full border border-border bg-background">
              {TYPE_LABELS[meeting.meetingType] ?? meeting.meetingType}
            </span>
          </div>
          {/* Detail rows */}
          <div className="divide-y divide-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="px-5 py-4 flex items-start gap-3">
                <Calendar className="size-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Date</p>
                  <p className="text-sm font-medium">{fmtDate(meeting.date)}</p>
                </div>
              </div>
              <div className="px-5 py-4 flex items-start gap-3">
                <Clock className="size-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Time</p>
                  <p className="text-sm font-medium">{meeting.startTime} – {meeting.endTime}</p>
                </div>
              </div>
            </div>
            {meeting.venue && (
              <div className="px-5 py-4 flex items-start gap-3">
                <MapPin className="size-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Venue</p>
                  <p className="text-sm">{meeting.venue}</p>
                </div>
              </div>
            )}
            {meeting.event && (
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Associated Event</p>
                <p className="text-sm font-medium text-brand-orange">{meeting.event.name}</p>
              </div>
            )}
            {meeting.createdBy && (
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Created by</p>
                <p className="text-sm">{meeting.createdBy.name}</p>
              </div>
            )}
            {meeting.description && (
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground font-medium mb-1.5">Description</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">{meeting.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'invitees' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {invitees.length} {invitees.length === 1 ? 'person' : 'people'} invited
            </p>
            <Button onClick={() => setInviteOpen(true)} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              <Plus className="size-4 mr-2" />Add Invitees
            </Button>
          </div>
          {invitees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
              <Users className="size-8 opacity-20" />
              <p className="text-sm">No invitees yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {invitees.map((inv) => {
                const role = inv.user?.role ? (ROLE_LABELS[inv.user.role as keyof typeof ROLE_LABELS] ?? inv.user.role) : '—'
                const initials = (inv.user?.name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div key={inv.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/10 transition-colors">
                    <div className="size-9 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-brand-orange">{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{inv.user?.name ?? '—'}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center rounded-full bg-muted/60 border border-border px-1.5 py-px text-xs text-muted-foreground">
                          {role}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-muted/60 border border-border px-1.5 py-px text-xs text-muted-foreground capitalize">
                          {inv.invitationType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                      onClick={() => setRemovingUser(inv)}>
                      <UserMinus className="size-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'agenda' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {agenda.length} {agenda.length === 1 ? 'item' : 'items'}
            </p>
            <Button onClick={() => setAgendaOpen(true)} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              <Plus className="size-4 mr-2" />Add Item
            </Button>
          </div>
          {agenda.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
              <ListChecks className="size-8 opacity-20" />
              <p className="text-sm">No agenda items yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {agenda.map((item, idx) => (
                <div key={item.id}
                  className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                  {/* Number */}
                  <span className="shrink-0 w-6 text-center text-sm font-semibold text-muted-foreground tabular-nums mt-0.5">
                    {idx + 1}.
                  </span>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                    )}
                    {item.owner && (
                      <p className="text-xs text-muted-foreground mt-1">Owner: {item.owner.name}</p>
                    )}
                  </div>
                  {/* Status */}
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${AGENDA_STATUS_COLORS[item.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  {/* Delete */}
                  <Button variant="ghost" size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                    onClick={() => setDeletingAgenda(item)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'discussions' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {discussions.length} {discussions.length === 1 ? 'note' : 'notes'}
            </p>
            <Button onClick={() => setDiscOpen(true)} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              <Plus className="size-4 mr-2" />Add Note
            </Button>
          </div>
          {discussions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
              <MessageSquare className="size-8 opacity-20" />
              <p className="text-sm">No discussion notes yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {discussions.map((d) => {
                const initials = (d.createdBy?.name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div key={d.id}
                    className={cn(
                      'rounded-xl border border-border bg-card overflow-hidden',
                      !d.isVisibleToMembers && 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/10',
                    )}>
                    {/* Author header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                      <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold text-foreground">{d.createdBy?.name ?? '—'}</p>
                          {!d.isVisibleToMembers ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-1.5 py-px">
                              <Lock className="size-2.5" />Admin only
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="size-2.5" />Visible to members
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{fmtTs(d.createdAt)}</p>
                      </div>
                      <Button variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                        onClick={() => setDeletingDisc(d)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    {/* Content */}
                    <div className="px-4 pl-[3.25rem] py-3">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">{d.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="flex flex-col gap-4">
          {attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
              <ClipboardCheck className="size-8 opacity-20" />
              <p className="text-sm">No attendance marked yet.</p>
            </div>
          ) : (
            <>
              {/* Summary card */}
              <div className="rounded-xl border border-green-200 bg-green-50/60 dark:bg-green-950/10 px-5 py-4 flex items-center gap-3">
                <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700">{attendance.length} attended</p>
                  {invitees.length > 0 && (
                    <p className="text-xs text-green-600/80">out of {invitees.length} invited</p>
                  )}
                </div>
              </div>
              {/* Avatar list */}
              <div className="flex flex-col gap-2">
                {attendance.map((a) => {
                  const initials = (a.user?.name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div key={a.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                      <div className="size-9 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-green-700">{initials}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{a.user?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">Marked at {fmtTs(a.markedAt)}</p>
                      </div>
                      <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Invite Dialog */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        meetingId={meetingId}
        onDone={() => { setInviteOpen(false); load() }}
      />

      {/* Remove invitee confirm */}
      <ConfirmDialog
        open={!!removingUser}
        onOpenChange={(o) => { if (!o) setRemovingUser(null) }}
        title="Remove invitee?"
        description={removingUser ? `Remove ${removingUser.user?.name ?? 'this user'} from the meeting?` : ''}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={async () => {
          if (!removingUser?.user) return
          try {
            await removeInvitee(meetingId, removingUser.user.id)
            toast.success('Invitee removed.')
            const updated = await listInvitees(meetingId)
            setInvitees(updated)
          } catch { toast.error('Failed to remove.') }
          finally { setRemovingUser(null) }
        }}
      />

      {/* Add agenda item dialog */}
      <AddAgendaItemDialog
        open={agendaOpen}
        onOpenChange={setAgendaOpen}
        meetingId={meetingId}
        onDone={() => { setAgendaOpen(false); load() }}
      />

      {/* Delete agenda item confirm */}
      <ConfirmDialog
        open={!!deletingAgenda}
        onOpenChange={(o) => { if (!o) setDeletingAgenda(null) }}
        title="Delete agenda item?"
        description={deletingAgenda ? `"${deletingAgenda.title}" will be removed.` : ''}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!deletingAgenda) return
          try {
            await deleteAgendaItem(deletingAgenda.id)
            toast.success('Agenda item deleted.')
            const updated = await listAgenda(meetingId)
            setAgenda(updated)
          } catch { toast.error('Failed.') }
          finally { setDeletingAgenda(null) }
        }}
      />

      {/* Add discussion dialog */}
      <AddDiscussionDialog
        open={discOpen}
        onOpenChange={setDiscOpen}
        meetingId={meetingId}
        onDone={() => { setDiscOpen(false); load() }}
      />

      {/* Delete discussion confirm */}
      <ConfirmDialog
        open={!!deletingDisc}
        onOpenChange={(o) => { if (!o) setDeletingDisc(null) }}
        title="Delete discussion note?"
        description="This note will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!deletingDisc) return
          try {
            await deleteDiscussion(deletingDisc.id)
            toast.success('Note deleted.')
            const updated = await listDiscussions(meetingId)
            setDiscussions(updated)
          } catch { toast.error('Failed.') }
          finally { setDeletingDisc(null) }
        }}
      />
    </div>
  )
}

// InfoRow kept for compatibility
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm capitalize">{value}</p>
    </div>
  )
}

function InviteDialog({ open, onOpenChange, meetingId, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; meetingId: number; onDone: () => void
}) {
  const [mode, setMode]           = useState<'roles' | 'all' | 'individual'>('individual')
  const [roles, setRoles]         = useState<string[]>([])
  const [allUsers, setAllUsers]   = useState<User[]>([])
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [search, setSearch]       = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [saving, setSaving]       = useState(false)

  const ROLE_OPTIONS = [
    { value: 'managing_committee', label: 'Managing Committee' },
    { value: 'core_committee',     label: 'Core Committee' },
    { value: 'executive',          label: 'Executive' },
    { value: 'cashier',            label: 'Cashier' },
    { value: 'collector',          label: 'Collector' },
  ]

  useEffect(() => {
    if (!open) return
    setSelected(new Set()); setSearch(''); setRoles([])
    if (mode === 'individual' && allUsers.length === 0) {
      setLoadingUsers(true)
      getUsers().then(setAllUsers).catch(() => {}).finally(() => setLoadingUsers(false))
    }
  }, [open])

  useEffect(() => {
    if (mode !== 'individual' || allUsers.length > 0) return
    setLoadingUsers(true)
    getUsers().then(setAllUsers).catch(() => {}).finally(() => setLoadingUsers(false))
  }, [mode])

  function toggleRole(r: string) {
    setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])
  }

  function toggleUser(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const nonAdminUsers = allUsers.filter((u) => u.role !== 'admin' && u.isActive)
  const filtered = nonAdminUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  function selectAll() { setSelected(new Set(filtered.map((u) => u.id))) }
  function clearAll()  { setSelected(new Set()) }

  async function handleSave() {
    setSaving(true)
    try {
      const payload: { userIds?: number[]; roles?: string[]; inviteAll?: boolean } = {}
      if (mode === 'all') {
        payload.inviteAll = true
      } else if (mode === 'roles') {
        payload.roles = roles
      } else {
        payload.userIds = [...selected]
      }
      await addInvitees(meetingId, payload)
      toast.success('Invitees added.')
      onDone()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = mode === 'all' || (mode === 'roles' && roles.length > 0) || (mode === 'individual' && selected.size > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Invitees</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 py-2">

          {/* Mode tabs */}
          <div className="flex gap-2">
            {([
              { id: 'individual', label: 'Select Members' },
              { id: 'roles',      label: 'By Role'        },
              { id: 'all',        label: 'Everyone'       },
            ] as const).map(({ id, label }) => (
              <button key={id} onClick={() => setMode(id)}
                className={cn(
                  'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  mode === id
                    ? 'bg-brand-orange text-white border-brand-orange'
                    : 'border-border text-muted-foreground hover:border-foreground',
                )}>
                {label}
              </button>
            ))}
          </div>

          {/* Individual member picker */}
          {mode === 'individual' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search members…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                <button onClick={selectAll} className="text-xs text-brand-orange hover:underline whitespace-nowrap">
                  Select all
                </button>
                <button onClick={clearAll} className="text-xs text-muted-foreground hover:underline whitespace-nowrap">
                  Clear
                </button>
              </div>

              {selected.size > 0 && (
                <p className="text-xs text-brand-orange font-medium">{selected.size} selected</p>
              )}

              <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No members found.</p>
                ) : (
                  filtered.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer border-b border-border last:border-0 transition-colors"
                    >
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
          )}

          {/* Role picker */}
          {mode === 'roles' && (
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={roles.includes(value)}
                    onChange={() => toggleRole(value)}
                    className="rounded accent-brand-orange"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          )}

          {/* Everyone */}
          {mode === 'all' && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              All active non-admin members will be invited. Duplicates are automatically skipped.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !canSave} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            {saving ? 'Adding…' : 'Add Invitees'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddAgendaItemDialog({ open, onOpenChange, meetingId, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; meetingId: number; onDone: () => void
}) {
  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => { if (open) { setTitle(''); setDesc('') } }, [open])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await createAgendaItem(meetingId, { title, description: description || null })
      toast.success('Agenda item added.')
      onDone()
    } catch { toast.error('Failed.') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Agenda Item</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Agenda item title" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Optional…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            {saving ? 'Adding…' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddDiscussionDialog({ open, onOpenChange, meetingId, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; meetingId: number; onDone: () => void
}) {
  const [content, setContent]         = useState('')
  const [visibleToMembers, setVisible] = useState(true)
  const [saving, setSaving]           = useState(false)

  useEffect(() => { if (open) { setContent(''); setVisible(true) } }, [open])

  async function handleSave() {
    if (!content.trim()) return
    setSaving(true)
    try {
      await createDiscussion(meetingId, { content, isVisibleToMembers: visibleToMembers })
      toast.success('Discussion note added.')
      onDone()
    } catch { toast.error('Failed.') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Discussion Note</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Content <span className="text-destructive">*</span></Label>
            <Textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Note content…" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={visibleToMembers} onChange={(e) => setVisible(e.target.checked)} className="rounded" />
            <span className="text-sm">Visible to members</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !content.trim()} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            {saving ? 'Saving…' : 'Add Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
