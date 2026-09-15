import apiClient from './client'
import { apiConfig } from '@/config/api'
import type {
  ApiResponse,
  Meeting,
  PaginatedMeetings,
  MeetingInvitee,
  MeetingAgendaItem,
  MeetingDiscussion,
  AttendanceStatus,
} from '@/types'

const ep = apiConfig.endpoints.meetings

// ── Admin ──────────────────────────────────────────────────────────────────

export interface MeetingsQuery {
  status?:  string
  eventId?: number
  page?:    number
  perPage?: number
}

export async function listAdminMeetings(query: MeetingsQuery = {}): Promise<PaginatedMeetings> {
  const res = await apiClient.get<ApiResponse<PaginatedMeetings>>(ep.list, { params: query })
  return res.data.data
}

export async function createMeeting(input: {
  title:       string
  description?: string | null
  date:        string
  startTime:   string
  endTime:     string
  venue?:      string | null
  meetingType: string
  status:      string
  eventId?:    number | null
}): Promise<Meeting> {
  const res = await apiClient.post<ApiResponse<Meeting>>(ep.create, input)
  return res.data.data
}

export async function getAdminMeeting(id: number): Promise<Meeting> {
  const res = await apiClient.get<ApiResponse<Meeting>>(ep.get(id))
  return res.data.data
}

export async function updateMeeting(
  id: number,
  input: Partial<{
    title:       string
    description: string | null
    date:        string
    startTime:   string
    endTime:     string
    venue:       string | null
    meetingType: string
    status:      string
    eventId:     number | null
  }>,
): Promise<Meeting> {
  const res = await apiClient.patch<ApiResponse<Meeting>>(ep.update(id), input)
  return res.data.data
}

export async function deleteMeeting(id: number): Promise<void> {
  await apiClient.delete(ep.delete(id))
}

// ── Invitees ───────────────────────────────────────────────────────────────

export async function listInvitees(id: number): Promise<MeetingInvitee[]> {
  const res = await apiClient.get<ApiResponse<MeetingInvitee[]>>(ep.invitees(id))
  return res.data.data
}

export async function addInvitees(
  id: number,
  payload: { userIds?: number[]; roles?: string[]; inviteAll?: boolean },
): Promise<{ added: number; invitees: MeetingInvitee[] }> {
  const res = await apiClient.post<ApiResponse<{ added: number; invitees: MeetingInvitee[] }>>(
    ep.invitees(id),
    payload,
  )
  return res.data.data
}

export async function removeInvitee(id: number, userId: number): Promise<void> {
  await apiClient.delete(ep.removeInvitee(id, userId))
}

// ── Agenda ─────────────────────────────────────────────────────────────────

export async function listAgenda(id: number): Promise<MeetingAgendaItem[]> {
  const res = await apiClient.get<ApiResponse<MeetingAgendaItem[]>>(ep.agenda(id))
  return res.data.data
}

export async function createAgendaItem(
  id: number,
  input: { title: string; description?: string | null; sortOrder?: number; ownerId?: number | null; status?: string },
): Promise<MeetingAgendaItem> {
  const res = await apiClient.post<ApiResponse<MeetingAgendaItem>>(ep.agenda(id), input)
  return res.data.data
}

export async function updateAgendaItem(
  itemId: number,
  input: Partial<{ title: string; description: string | null; sortOrder: number; ownerId: number | null; status: string }>,
): Promise<MeetingAgendaItem> {
  const res = await apiClient.patch<ApiResponse<MeetingAgendaItem>>(ep.agendaItem(itemId), input)
  return res.data.data
}

export async function deleteAgendaItem(itemId: number): Promise<void> {
  await apiClient.delete(ep.agendaItem(itemId))
}

// ── Discussions ────────────────────────────────────────────────────────────

export async function listDiscussions(id: number): Promise<MeetingDiscussion[]> {
  const res = await apiClient.get<ApiResponse<MeetingDiscussion[]>>(ep.discussions(id))
  return res.data.data
}

export async function createDiscussion(
  id: number,
  input: { content: string; agendaItemId?: number | null; isVisibleToMembers?: boolean },
): Promise<MeetingDiscussion> {
  const res = await apiClient.post<ApiResponse<MeetingDiscussion>>(ep.discussions(id), input)
  return res.data.data
}

export async function updateDiscussion(
  discId: number,
  input: Partial<{ content: string; isVisibleToMembers: boolean; agendaItemId: number | null }>,
): Promise<MeetingDiscussion> {
  const res = await apiClient.patch<ApiResponse<MeetingDiscussion>>(ep.discussion(discId), input)
  return res.data.data
}

export async function deleteDiscussion(discId: number): Promise<void> {
  await apiClient.delete(ep.discussion(discId))
}

// ── Admin attendance ───────────────────────────────────────────────────────

export async function listAdminAttendance(id: number) {
  const res = await apiClient.get<ApiResponse<{ id: number; user: { id: number; name: string } | null; markedAt: string | null }[]>>(
    ep.adminAttendance(id),
  )
  return res.data.data
}

// ── Member ─────────────────────────────────────────────────────────────────

export async function listMyMeetings(): Promise<Meeting[]> {
  const res = await apiClient.get<ApiResponse<Meeting[]>>(ep.myList)
  return res.data.data ?? []
}

export async function getMyMeeting(id: number): Promise<Meeting | null> {
  const res = await apiClient.get<ApiResponse<Meeting>>(ep.myDetail(id))
  return res.data.data ?? null
}

export async function getMyMeetingAgenda(id: number): Promise<MeetingAgendaItem[]> {
  const res = await apiClient.get<ApiResponse<MeetingAgendaItem[]>>(ep.myAgenda(id))
  return res.data.data ?? []
}

export async function getMyMeetingDiscussions(id: number): Promise<MeetingDiscussion[]> {
  const res = await apiClient.get<ApiResponse<MeetingDiscussion[]>>(ep.myDiscussions(id))
  return res.data.data ?? []
}

export async function getAttendanceStatus(id: number): Promise<AttendanceStatus | null> {
  const res = await apiClient.get<ApiResponse<AttendanceStatus>>(ep.myAttendanceStatus(id))
  return res.data.data ?? null
}

export async function markAttendance(
  id: number,
  deviceToken?: string,
): Promise<{ marked?: boolean; alreadyMarked?: boolean; markedAt?: string | null }> {
  const res = await apiClient.post<ApiResponse<{ marked?: boolean; alreadyMarked?: boolean; markedAt?: string | null }>>(
    ep.myMarkAttendance(id),
    deviceToken ? { deviceToken } : {},
  )
  return res.data.data
}
