'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft, Calendar, Clock, MapPin, ListChecks, MessageSquare, ClipboardCheck,
  CheckCircle2, XCircle, Timer, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getMyMeeting, getMyMeetingAgenda, getMyMeetingDiscussions,
  getAttendanceStatus, markAttendance,
} from '@/lib/api/meetings'
import type { Meeting, MeetingAgendaItem, MeetingDiscussion, AttendanceStatus, MeetingStatus, ApiError } from '@/types'
import { cn } from '@/lib/utils'

type Tab = 'details' | 'agenda' | 'discussions' | 'attendance'

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard>
      <MeetingDetailContent params={params} />
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

function MeetingDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const meetingId = Number(id)

  const [meeting, setMeeting]           = useState<Meeting | null>(null)
  const [agenda, setAgenda]             = useState<MeetingAgendaItem[]>([])
  const [discussions, setDiscussions]   = useState<MeetingDiscussion[]>([])
  const [attendance, setAttendance]     = useState<AttendanceStatus | null>(null)
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState<Tab>('details')
  const [markingAttendance, setMarking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const m = await getMyMeeting(meetingId)
      setMeeting(m)
      if (m) {
        const [ag, disc, att] = await Promise.all([
          getMyMeetingAgenda(meetingId),
          getMyMeetingDiscussions(meetingId),
          getAttendanceStatus(meetingId),
        ])
        setAgenda(ag)
        setDiscussions(disc)
        setAttendance(att)
      }
    } catch {
      // 404 = not invited
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  useEffect(() => { load() }, [load])

  async function handleMarkAttendance() {
    setMarking(true)
    try {
      // Get or create device token (stored in localStorage)
      let deviceToken: string | undefined
      try {
        deviceToken = localStorage.getItem('pujopay_device_token') ?? undefined
        if (!deviceToken) {
          deviceToken = crypto.randomUUID()
          localStorage.setItem('pujopay_device_token', deviceToken)
        }
      } catch {}

      await markAttendance(meetingId, deviceToken)
      toast.success('Attendance marked!')
      const att = await getAttendanceStatus(meetingId)
      setAttendance(att)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to mark attendance.')
    } finally {
      setMarking(false)
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  function fmtTs(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'details',     label: 'Details',     icon: <ListChecks className="size-4" /> },
    { id: 'agenda',      label: 'Agenda',      icon: <ListChecks className="size-4" /> },
    { id: 'discussions', label: 'Discussions', icon: <MessageSquare className="size-4" /> },
    { id: 'attendance',  label: 'Attendance',  icon: <ClipboardCheck className="size-4" /> },
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
        <Link href="/meetings">
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4">
            <ArrowLeft className="size-4" />Back
          </Button>
        </Link>
        <p className="text-muted-foreground text-sm">Meeting not found or you are not invited.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/meetings">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />Back
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading font-bold text-2xl text-foreground">{meeting.title}</h1>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[meeting.status]}`}>
              {STATUS_LABELS[meeting.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />{fmtDate(meeting.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />{meeting.startTime} – {meeting.endTime}
            </span>
            {meeting.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />{meeting.venue}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="rounded-xl border border-border bg-card p-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Type</p>
            <p className="text-sm capitalize">{meeting.meetingType}</p>
          </div>
          {meeting.event && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Event</p>
              <p className="text-sm">{meeting.event.name}</p>
            </div>
          )}
          {meeting.description && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm whitespace-pre-wrap">{meeting.description}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'agenda' && (
        <div>
          {agenda.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No agenda items yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {agenda.map((item, idx) => (
                <div key={item.id} className="rounded-xl border border-border bg-card p-4 flex gap-3">
                  <span className="shrink-0 size-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'discussions' && (
        <div>
          {discussions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No discussion notes available.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {discussions.map((d) => (
                <div key={d.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm whitespace-pre-wrap">{d.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {d.createdBy?.name ?? '—'} · {fmtTs(d.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'attendance' && attendance && (
        <div className="flex flex-col items-center gap-4 py-8">
          <AttendanceWidget attendance={attendance} onMark={handleMarkAttendance} marking={markingAttendance} />
        </div>
      )}
    </div>
  )
}

function AttendanceWidget({
  attendance,
  onMark,
  marking,
}: {
  attendance: AttendanceStatus
  onMark: () => void
  marking: boolean
}) {
  switch (attendance.phase) {
    case 'before':
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <Timer className="size-10 text-muted-foreground/40" />
          <p className="font-semibold text-sm">Attendance not open yet</p>
          <p className="text-xs text-muted-foreground">
            Opens at {attendance.startTime} IST and closes at {attendance.endTime} IST
          </p>
        </div>
      )
    case 'open':
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <ClipboardCheck className="size-10 text-green-500" />
          <div>
            <p className="font-semibold text-sm">Attendance is open</p>
            <p className="text-xs text-muted-foreground">Closes at {attendance.endTime} IST</p>
          </div>
          <Button
            onClick={onMark}
            disabled={marking}
            className="bg-green-600 hover:bg-green-700 text-white px-8"
          >
            {marking ? <><RefreshCw className="size-4 mr-2 animate-spin" />Marking…</> : 'Mark My Attendance'}
          </Button>
        </div>
      )
    case 'marked':
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-10 text-green-500" />
          <p className="font-semibold text-sm">Attendance marked</p>
          {attendance.markedAt && (
            <p className="text-xs text-muted-foreground">
              Recorded at {new Date(attendance.markedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })} IST
            </p>
          )}
        </div>
      )
    case 'closed':
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <XCircle className="size-10 text-muted-foreground/40" />
          <p className="font-semibold text-sm">Attendance window closed</p>
          <p className="text-xs text-muted-foreground">Your attendance was not marked for this meeting.</p>
        </div>
      )
    default:
      return null
  }
}
