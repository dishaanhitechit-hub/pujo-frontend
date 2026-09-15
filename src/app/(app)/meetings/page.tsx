'use client'

import { useEffect, useMemo, useState } from 'react'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { listMyMeetings } from '@/lib/api/meetings'
import type { Meeting, MeetingStatus } from '@/types'
import { cn } from '@/lib/utils'

export default function MeetingsPage() {
  return (
    <RoleGuard>
      <MeetingsContent />
    </RoleGuard>
  )
}

const STATUS_LABELS: Record<MeetingStatus, string> = {
  draft:       'Draft',
  scheduled:   'Scheduled',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
}

const STATUS_COLORS: Record<MeetingStatus, string> = {
  draft:       'bg-slate-50 text-slate-500 border-slate-200',
  scheduled:   'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed:   'bg-green-50 text-green-700 border-green-200',
  cancelled:   'bg-red-50 text-red-500 border-red-200',
}

function MeetingsContent() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    listMyMeetings()
      .then(setMeetings)
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const upcoming  = useMemo(() => meetings.filter((m) => m.date >= today && m.status !== 'cancelled' && m.status !== 'completed').sort((a, b) => a.date.localeCompare(b.date)), [meetings, today])
  const past      = useMemo(() => meetings.filter((m) => (m.date < today || m.status === 'completed') && m.status !== 'cancelled').sort((a, b) => b.date.localeCompare(a.date)), [meetings, today])
  const cancelled = useMemo(() => meetings.filter((m) => m.status === 'cancelled').sort((a, b) => b.date.localeCompare(a.date)), [meetings])

  function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
        <PageHeader title="My Meetings" subtitle="Meetings you are invited to." />
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (meetings.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
        <PageHeader title="My Meetings" subtitle="Meetings you are invited to." />
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Calendar className="size-10 opacity-30" />
          <p className="text-sm">You have no meeting invitations yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      <PageHeader title="My Meetings" subtitle={`${meetings.length} meeting${meetings.length !== 1 ? 's' : ''} you are invited to.`} />

      {upcoming.length > 0 && (
        <Section title="Upcoming" count={upcoming.length}>
          {upcoming.map((m) => (
            <MeetingCard key={m.id} meeting={m} fmtDate={fmtDate} />
          ))}
        </Section>
      )}

      {past.length > 0 && (
        <Section title="Past" count={past.length}>
          {past.map((m) => (
            <MeetingCard key={m.id} meeting={m} fmtDate={fmtDate} />
          ))}
        </Section>
      )}

      {cancelled.length > 0 && (
        <Section title="Cancelled" count={cancelled.length}>
          {cancelled.map((m) => (
            <MeetingCard key={m.id} meeting={m} fmtDate={fmtDate} />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title} <span className="text-xs font-normal">({count})</span>
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function MeetingCard({ meeting: m, fmtDate }: { meeting: Meeting; fmtDate: (d: string) => string }) {
  return (
    <Link href={`/meetings/${m.id}`} className="block rounded-xl border border-border bg-card p-4 sm:p-5 hover:bg-muted/10 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-sm leading-snug">{m.title}</h3>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[m.status]}`}>
              {STATUS_LABELS[m.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />{fmtDate(m.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />{m.startTime} – {m.endTime}
            </span>
            {m.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />{m.venue}
              </span>
            )}
          </div>
        </div>
        {m.event && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap shrink-0">
            {m.event.name}
          </span>
        )}
      </div>
    </Link>
  )
}
