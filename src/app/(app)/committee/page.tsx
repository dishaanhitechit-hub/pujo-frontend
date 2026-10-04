'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, CalendarClock, Users2 } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth/auth-provider'
import { cn } from '@/lib/utils'
import { COMMITTEE_ROLE_LABELS } from '@/config/committee-roles'
import { MEMBER_CATEGORY_LABELS } from '@/config/members'
import {
  getCommitteeYears, getCommitteeYear, getCommitteeEvents, getCommitteeEvent,
} from '@/lib/api/role-assignments'
import type { ClubYear, CommitteeMemberEntry } from '@/types'

export default function CommitteePage() {
  const [tab, setTab] = useState<'year' | 'event'>('year')

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
      <PageHeader title="Committee" subtitle="The club committee and their roles." />

      <div className="flex gap-1 border-b border-border">
        <TabButton active={tab === 'year'} onClick={() => setTab('year')} icon={<CalendarDays className="size-4" />}>Yearly</TabButton>
        <TabButton active={tab === 'event'} onClick={() => setTab('event')} icon={<CalendarClock className="size-4" />}>Event</TabButton>
      </div>

      {tab === 'year' ? <YearlyCommittee /> : <EventCommittee />}
    </div>
  )
}

function TabButton({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <button onClick={onClick} className={cn(
      'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
      active ? 'border-brand-orange text-brand-orange' : 'border-transparent text-muted-foreground hover:text-foreground',
    )}>{icon}{children}</button>
  )
}

function YearlyCommittee() {
  const [years, setYears] = useState<ClubYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [members, setMembers] = useState<CommitteeMemberEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    getCommitteeYears()
      .then((ys) => { setYears(ys); setSelectedYearId(ys.find((y) => y.isCurrent)?.id ?? ys[0]?.id ?? null) })
      .catch(() => toast.error('Failed to load committee.'))
      .finally(() => setLoading(false))
  }, [])

  const load = useCallback(async (yearId: number) => {
    setListLoading(true)
    try { setMembers((await getCommitteeYear(yearId)).members) }
    catch { toast.error('Failed to load committee.') }
    finally { setListLoading(false) }
  }, [])

  useEffect(() => { if (selectedYearId) load(selectedYearId) }, [selectedYearId, load])

  if (loading) return <Skeleton className="h-48 rounded-xl" />
  if (years.length === 0) return <Empty text="No committee set up yet." />

  return (
    <div className="flex flex-col gap-4">
      <select
        value={selectedYearId ?? ''}
        onChange={(e) => setSelectedYearId(Number(e.target.value))}
        className="h-9 w-fit rounded-lg border border-input bg-transparent px-3 text-sm font-medium shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {years.map((y) => <option key={y.id} value={y.id}>{y.label}{y.isCurrent ? ' (current)' : ''}</option>)}
      </select>
      <MemberList members={members} loading={listLoading} />
    </div>
  )
}

function EventCommittee() {
  const [events, setEvents] = useState<{ id: number; name: string; year: number | null }[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [members, setMembers] = useState<CommitteeMemberEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    getCommitteeEvents()
      .then((evs) => { setEvents(evs); setSelectedEventId(evs[0]?.id ?? null) })
      .catch(() => toast.error('Failed to load committee.'))
      .finally(() => setLoading(false))
  }, [])

  const load = useCallback(async (eventId: number) => {
    setListLoading(true)
    try { setMembers((await getCommitteeEvent(eventId)).members) }
    catch { toast.error('Failed to load committee.') }
    finally { setListLoading(false) }
  }, [])

  useEffect(() => { if (selectedEventId) load(selectedEventId) }, [selectedEventId, load])

  if (loading) return <Skeleton className="h-48 rounded-xl" />
  if (events.length === 0) return <Empty text="No event committee set up yet." />

  return (
    <div className="flex flex-col gap-4">
      <select
        value={selectedEventId ?? ''}
        onChange={(e) => setSelectedEventId(Number(e.target.value))}
        className="h-9 w-fit max-w-full rounded-lg border border-input bg-transparent px-3 text-sm font-medium shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <MemberList members={members} loading={listLoading} />
    </div>
  )
}

function MemberList({ members, loading }: { members: CommitteeMemberEntry[]; loading: boolean }) {
  const { user } = useAuth()
  if (loading) return <div className="flex flex-col gap-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
  if (members.length === 0) return <Empty text="No roles assigned yet." />

  return (
    <div className="flex flex-col gap-2">
      {members.map((m) => {
        const isSelf = user?.id === m.userId
        const initials = m.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
        return (
          <div key={m.userId} className={cn(
            'flex items-center gap-3 rounded-xl border px-3 sm:px-4 py-2.5',
            isSelf ? 'border-brand-orange bg-brand-orange/5' : 'border-border bg-card',
          )}>
            <div className={cn('size-9 rounded-full border flex items-center justify-center shrink-0',
              isSelf ? 'bg-brand-orange/15 border-brand-orange/30' : 'bg-brand-orange/10 border-brand-orange/20')}>
              <span className="text-xs font-semibold text-brand-orange">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {m.name}
                {isSelf && <span className="ml-2 text-[10px] font-semibold text-brand-orange uppercase tracking-wide">You</span>}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {[m.memberId, m.memberCategory ? MEMBER_CATEGORY_LABELS[m.memberCategory] : null].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-brand-navy/10 text-brand-navy px-2.5 py-0.5 text-xs font-semibold shrink-0">
              {COMMITTEE_ROLE_LABELS[m.role]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-muted-foreground">
      <Users2 className="size-10 opacity-20" />
      <p className="text-sm">{text}</p>
    </div>
  )
}
