'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Plus, Search, X, CalendarDays, CalendarClock, Loader2, Eye, EyeOff, IndianRupee,
  ChevronUp, ChevronDown, Landmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { COMMITTEE_ROLES, COMMITTEE_ROLE_LABELS } from '@/config/committee-roles'
import {
  listClubYears, createClubYear, setCurrentClubYear,
  getYearAssignments, setYearAssignment, clearYearAssignment, reorderYearAssignments,
  getEventAssignments, setEventAssignment, clearEventAssignment, reorderEventAssignments,
} from '@/lib/api/role-assignments'
import { listEvents } from '@/lib/api/events'
import type {
  ClubYear, CommitteeRole, YearAssignmentMember, EventAssignmentMember,
  EventSummary, ApiError,
} from '@/types'

export default function CommitteePage() {
  return (
    <RoleGuard permission="content.manage">
      <CommitteeContent />
    </RoleGuard>
  )
}

function CommitteeContent() {
  const [tab, setTab] = useState<'year' | 'event'>('year')

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
      <PageHeader title="Committee & Roles" subtitle="Assign committee roles to members — by club year and per event." />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <TabButton active={tab === 'year'} onClick={() => setTab('year')} icon={<CalendarDays className="size-4" />}>
          Yearly Roles
        </TabButton>
        <TabButton active={tab === 'event'} onClick={() => setTab('event')} icon={<CalendarClock className="size-4" />}>
          Event Roles
        </TabButton>
      </div>

      {tab === 'year' ? <YearlyRolesTab /> : <EventRolesTab />}
    </div>
  )
}

function TabButton({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
        active
          ? 'border-brand-orange text-brand-orange'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}{children}
    </button>
  )
}

/* ── Role picker + public / collect toggles (shared row controls) ───────────── */

function RolePicker({ value, onChange, disabled }: {
  value: CommitteeRole | null
  onChange: (role: CommitteeRole | '') => void
  disabled?: boolean
}) {
  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as CommitteeRole | '')}
      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
    >
      <option value="">— No role —</option>
      {COMMITTEE_ROLES.map((r) => (
        <option key={r} value={r}>{COMMITTEE_ROLE_LABELS[r]}</option>
      ))}
    </select>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="size-9 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-brand-orange">{initials}</span>
    </div>
  )
}

function MemberInfo({ name, sub }: { name: string; sub?: string | null }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium truncate">{name}</p>
      {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
    </div>
  )
}

/* Small toggle chip */
function ToggleChip({ on, onClick, iconOn, iconOff, label, disabled, activeClass }: {
  on: boolean; onClick: () => void; iconOn: React.ReactNode; iconOff: React.ReactNode
  label: string; disabled?: boolean; activeClass: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40',
        on ? activeClass : 'border-border text-muted-foreground hover:bg-muted/40',
      )}
    >
      {on ? iconOn : iconOff}
      <span>{label}</span>
    </button>
  )
}

/* ── Yearly Roles tab ───────────────────────────────────────────────────────── */

function YearlyRolesTab() {
  const [years, setYears] = useState<ClubYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [members, setMembers] = useState<YearAssignmentMember[]>([])
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [newYearOpen, setNewYearOpen] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [reordering, setReordering] = useState(false)

  const loadYears = useCallback(async () => {
    setLoading(true)
    try {
      const ys = await listClubYears()
      setYears(ys)
      setSelectedYearId((prev) => prev ?? ys.find((y) => y.isCurrent)?.id ?? ys[0]?.id ?? null)
    } catch {
      toast.error('Failed to load club years.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadYears() }, [loadYears])

  const loadMembers = useCallback(async (yearId: number) => {
    setMembersLoading(true)
    try {
      const res = await getYearAssignments(yearId)
      setMembers(res.members)
    } catch {
      toast.error('Failed to load assignments.')
    } finally {
      setMembersLoading(false)
    }
  }, [])

  useEffect(() => { if (selectedYearId) loadMembers(selectedYearId) }, [selectedYearId, loadMembers])

  async function handleRole(m: YearAssignmentMember, role: CommitteeRole | '') {
    if (!selectedYearId) return
    setSavingId(m.id)
    try {
      if (role === '') {
        await clearYearAssignment(selectedYearId, m.id)
        setMembers((p) => p.map((x) => (x.id === m.id ? { ...x, role: null } : x)))
      } else {
        await setYearAssignment(selectedYearId, m.id, role, m.isPublic)
        setMembers((p) => p.map((x) => (x.id === m.id ? { ...x, role } : x)))
      }
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to save.')
    } finally {
      setSavingId(null)
    }
  }

  async function handlePublic(m: YearAssignmentMember) {
    if (!selectedYearId || !m.role) return
    const next = !m.isPublic
    setSavingId(m.id)
    try {
      await setYearAssignment(selectedYearId, m.id, m.role, next)
      setMembers((p) => p.map((x) => (x.id === m.id ? { ...x, isPublic: next } : x)))
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleMove(m: YearAssignmentMember, dir: 'up' | 'down') {
    if (!selectedYearId) return
    const idx = members.findIndex((x) => x.id === m.id)
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swap < 0 || swap >= members.length) return
    const prev = members
    const next = [...members]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setMembers(next)
    setReordering(true)
    try {
      await reorderYearAssignments(selectedYearId, next.map((x) => x.id))
    } catch {
      toast.error('Failed to reorder.')
      setMembers(prev)
    } finally {
      setReordering(false)
    }
  }

  async function handleCreateYear(label: string) {
    try {
      const y = await createClubYear(label)
      toast.success(`Year "${y.label}" started.`)
      setNewYearOpen(false)
      setYears((p) => [y, ...p.map((x) => ({ ...x, isCurrent: false }))])
      setSelectedYearId(y.id)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to start year.')
    }
  }

  async function handleSetCurrent(yearId: number) {
    try {
      await setCurrentClubYear(yearId)
      setYears((p) => p.map((y) => ({ ...y, isCurrent: y.id === yearId })))
      toast.success('Current year updated.')
    } catch {
      toast.error('Failed to update current year.')
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? members.filter((m) => [m.name, m.phone, m.memberId].some((v) => v?.toLowerCase().includes(q)))
    : members

  const selectedYear = years.find((y) => y.id === selectedYearId)

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <div className="flex flex-col gap-4">
      {/* Year controls */}
      <div className="flex flex-wrap items-center gap-2">
        {years.length > 0 && (
          <select
            value={selectedYearId ?? ''}
            onChange={(e) => setSelectedYearId(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm font-medium shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.label}{y.isCurrent ? ' (current)' : ''}</option>
            ))}
          </select>
        )}
        {selectedYear && !selectedYear.isCurrent && (
          <Button variant="outline" size="sm" onClick={() => handleSetCurrent(selectedYear.id)}>
            Set as current
          </Button>
        )}
        <Button onClick={() => setNewYearOpen(true)} className="bg-brand-orange hover:bg-brand-orange/90 text-white ml-auto">
          <Plus className="size-4 mr-1.5" />Start New Year
        </Button>
      </div>

      {years.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-10 opacity-20" />}
          text="No club year yet. Start one to begin assigning roles."
          action={<Button onClick={() => setNewYearOpen(true)} className="bg-brand-orange hover:bg-brand-orange/90 text-white">Start first year</Button>}
        />
      ) : (
        <>
          <SearchBar value={search} onChange={setSearch} />
          <AssignmentList
            loading={membersLoading}
            members={filtered}
            savingId={savingId}
            canReorder={!q}
            reordering={reordering}
            onMove={(m, dir) => handleMove(m as YearAssignmentMember, dir)}
            legend={<Legend items={[
              { icon: <CalendarDays className="size-3.5" />, text: 'Pick a role to add the member to this year’s committee' },
              { icon: <Eye className="size-3.5" />, text: 'On website = shown in the public committee list; Hidden = kept private' },
              { icon: <ChevronUp className="size-3.5" />, text: 'Use the arrows to set the display order (clear search first)' },
            ]} />}
            renderExtra={(m) => (
              <ToggleChip
                on={m.isPublic}
                disabled={!m.role}
                onClick={() => handlePublic(m as YearAssignmentMember)}
                iconOn={<Eye className="size-3.5" />}
                iconOff={<EyeOff className="size-3.5" />}
                label={m.isPublic ? 'Public' : 'Hidden'}
                activeClass="border-green-200 bg-green-50 text-green-700"
              />
            )}
            onRole={(m, r) => handleRole(m as YearAssignmentMember, r)}
          />
        </>
      )}

      <NewYearDialog open={newYearOpen} onOpenChange={setNewYearOpen} onCreate={handleCreateYear} hasPrevious={years.length > 0} />
    </div>
  )
}

/* ── Event Roles tab ────────────────────────────────────────────────────────── */

function EventRolesTab() {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [members, setMembers] = useState<EventAssignmentMember[]>([])
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'draft' | 'published' | 'archived'>('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const res = await listEvents({ perPage: 200 })
        // ongoing/published first, then by year desc
        const sorted = [...res.events].sort((a, b) => {
          const rank = (s: string) => (s === 'published' ? 0 : s === 'draft' ? 1 : 2)
          if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status)
          return (b.year ?? 0) - (a.year ?? 0)
        })
        setEvents(sorted)
        setSelectedEventId((prev) => prev ?? sorted[0]?.id ?? null)
      } catch {
        toast.error('Failed to load events.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const loadMembers = useCallback(async (eventId: number) => {
    setMembersLoading(true)
    try {
      const res = await getEventAssignments(eventId)
      setMembers(res.members)
    } catch {
      toast.error('Failed to load assignments.')
    } finally {
      setMembersLoading(false)
    }
  }, [])

  useEffect(() => { if (selectedEventId) loadMembers(selectedEventId) }, [selectedEventId, loadMembers])

  async function handleRole(m: EventAssignmentMember, role: CommitteeRole | '') {
    if (!selectedEventId) return
    setSavingId(m.id)
    try {
      if (role === '') {
        await clearEventAssignment(selectedEventId, m.id)
        setMembers((p) => p.map((x) => (x.id === m.id ? { ...x, role: null, canCollect: false, canCashier: false } : x)))
      } else {
        await setEventAssignment(selectedEventId, m.id, role, m.canCollect, m.isPublic, m.canCashier)
        setMembers((p) => p.map((x) => (x.id === m.id ? { ...x, role } : x)))
      }
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to save.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleToggle(m: EventAssignmentMember, field: 'isPublic' | 'canCollect' | 'canCashier') {
    if (!selectedEventId || !m.role) return
    const next = !m[field]
    setSavingId(m.id)
    try {
      await setEventAssignment(
        selectedEventId, m.id, m.role,
        field === 'canCollect' ? next : m.canCollect,
        field === 'isPublic' ? next : m.isPublic,
        field === 'canCashier' ? next : m.canCashier,
      )
      setMembers((p) => p.map((x) => (x.id === m.id ? { ...x, [field]: next } : x)))
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleMove(m: EventAssignmentMember, dir: 'up' | 'down') {
    if (!selectedEventId) return
    const idx = members.findIndex((x) => x.id === m.id)
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swap < 0 || swap >= members.length) return
    const prev = members
    const next = [...members]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setMembers(next)
    setReordering(true)
    try {
      await reorderEventAssignments(selectedEventId, next.map((x) => x.id))
    } catch {
      toast.error('Failed to reorder.')
      setMembers(prev)
    } finally {
      setReordering(false)
    }
  }

  const q = search.trim().toLowerCase()
  const visibleEvents = statusFilter ? events.filter((e) => e.status === statusFilter) : events
  const filtered = q
    ? members.filter((m) => [m.name, m.phone, m.memberId].some((v) => v?.toLowerCase().includes(q)))
    : members

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  if (events.length === 0) {
    return <EmptyState icon={<CalendarClock className="size-10 opacity-20" />} text="No events yet. Create an event first." />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedEventId ?? ''}
          onChange={(e) => setSelectedEventId(Number(e.target.value))}
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm font-medium shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 max-w-[60%]"
        >
          {visibleEvents.map((e) => (
            <option key={e.id} value={e.id}>{e.name}{e.status !== 'published' ? ` · ${e.status}` : ''}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <SearchBar value={search} onChange={setSearch} />
      <AssignmentList
        loading={membersLoading}
        members={filtered}
        savingId={savingId}
        canReorder={!q}
        reordering={reordering}
        onMove={(m, dir) => handleMove(m as EventAssignmentMember, dir)}
        legend={<Legend items={[
          { icon: <CalendarClock className="size-3.5" />, text: 'Pick a role to add the member to this event’s committee' },
          { icon: <IndianRupee className="size-3.5" />, text: 'Can collect = allowed to take payments for this event' },
          { icon: <Landmark className="size-3.5" />, text: 'Cashier = approve/view payments & manage expenses, handovers for this event' },
          { icon: <Eye className="size-3.5" />, text: 'On website = shown in the public committee for this event' },
          { icon: <ChevronUp className="size-3.5" />, text: 'Use the arrows to set the display order (clear search first)' },
        ]} />}
        renderExtra={(m) => {
          const em = m as EventAssignmentMember
          return (
            <div className="flex items-center gap-1.5">
              <ToggleChip
                on={em.canCollect}
                disabled={!em.role}
                onClick={() => handleToggle(em, 'canCollect')}
                iconOn={<IndianRupee className="size-3.5" />}
                iconOff={<IndianRupee className="size-3.5" />}
                label={em.canCollect ? 'Can collect' : 'No collect'}
                activeClass="border-amber-200 bg-amber-50 text-amber-700"
              />
              <ToggleChip
                on={em.canCashier}
                disabled={!em.role}
                onClick={() => handleToggle(em, 'canCashier')}
                iconOn={<Landmark className="size-3.5" />}
                iconOff={<Landmark className="size-3.5" />}
                label={em.canCashier ? 'Cashier' : 'No cashier'}
                activeClass="border-indigo-200 bg-indigo-50 text-indigo-700"
              />
              <ToggleChip
                on={em.isPublic}
                disabled={!em.role}
                onClick={() => handleToggle(em, 'isPublic')}
                iconOn={<Eye className="size-3.5" />}
                iconOff={<EyeOff className="size-3.5" />}
                label={em.isPublic ? 'Public' : 'Hidden'}
                activeClass="border-green-200 bg-green-50 text-green-700"
              />
            </div>
          )
        }}
        onRole={(m, r) => handleRole(m as EventAssignmentMember, r)}
      />
    </div>
  )
}

/* ── Shared assignment list ─────────────────────────────────────────────────── */

type AnyMember = YearAssignmentMember | EventAssignmentMember

function AssignmentList({ loading, members, savingId, renderExtra, onRole, legend, canReorder, onMove, reordering }: {
  loading: boolean
  members: AnyMember[]
  savingId: number | null
  renderExtra: (m: AnyMember) => React.ReactNode
  onRole: (m: AnyMember, role: CommitteeRole | '') => void
  legend?: React.ReactNode
  canReorder: boolean
  onMove: (m: AnyMember, dir: 'up' | 'down') => void
  reordering: boolean
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    )
  }
  if (members.length === 0) {
    return <EmptyState icon={<Search className="size-10 opacity-20" />} text="No members found." />
  }
  return (
    <div className="flex flex-col gap-2">
      {legend}
      {members.map((m, i) => {
        const sub = [m.memberId, m.phone].filter(Boolean).join(' · ') || null
        return (
          <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 rounded-xl border border-border bg-card px-3 sm:px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <ReorderArrows
                canReorder={canReorder}
                disabled={reordering}
                isFirst={i === 0}
                isLast={i === members.length - 1}
                onUp={() => onMove(m, 'up')}
                onDown={() => onMove(m, 'down')}
              />
              <Avatar name={m.name} />
              <MemberInfo name={m.name} sub={sub} />
            </div>
            <div className="flex items-center gap-2 flex-wrap pl-12 sm:pl-0 sm:shrink-0 sm:justify-end">
              {savingId === m.id && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
              {renderExtra(m)}
              <RolePicker value={m.role} onChange={(r) => onRole(m, r)} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* Up/down reorder control — hidden while a search filter is active (can't
   meaningfully reorder a filtered subset). */
function ReorderArrows({ canReorder, disabled, isFirst, isLast, onUp, onDown }: {
  canReorder: boolean; disabled: boolean; isFirst: boolean; isLast: boolean
  onUp: () => void; onDown: () => void
}) {
  if (!canReorder) return null
  return (
    <div className="flex flex-col shrink-0 -my-1">
      <button
        type="button"
        onClick={onUp}
        disabled={disabled || isFirst}
        aria-label="Move up"
        className="text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronUp className="size-4" />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disabled || isLast}
        aria-label="Move down"
        className="text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  )
}

/* ── Small shared bits ──────────────────────────────────────────────────────── */

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search member by name, ID, phone…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8"
      />
      {value && (
        <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => onChange('')} aria-label="Clear">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function Legend({ items }: { items: { icon: React.ReactNode; text: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-muted/40 border border-border/60 px-3 py-2 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span className="text-foreground/70">{it.icon}</span>
          {it.text}
        </span>
      ))}
    </div>
  )
}

function EmptyState({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-muted-foreground">
      {icon}
      <p className="text-sm">{text}</p>
      {action}
    </div>
  )
}

function NewYearDialog({ open, onOpenChange, onCreate, hasPrevious }: {
  open: boolean; onOpenChange: (o: boolean) => void; onCreate: (label: string) => void; hasPrevious: boolean
}) {
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open) setLabel('') }, [open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) { toast.error('Enter a year label.'); return }
    setSaving(true)
    await onCreate(label.trim())
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Start New Year</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ny-label">Year label</Label>
            <Input id="ny-label" placeholder="e.g. 2025-26" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
            {hasPrevious && (
              <p className="text-xs text-muted-foreground">Role assignments from the current year will be copied over — you can change them after.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}Start Year
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
