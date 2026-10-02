import apiClient from './client'
import { apiConfig } from '@/config/api'
import type {
  ApiResponse, ClubYear, CommitteeRole,
  YearAssignmentsResponse, EventAssignmentsResponse, MyRoles, ContributionStats,
} from '@/types'

const ep = apiConfig.endpoints.roleAssignments

export interface MyProfileExtras {
  roles: MyRoles
  contributionStats: ContributionStats
}

export async function getMyRoles(): Promise<MyRoles> {
  const res = await apiClient.get<ApiResponse<MyRoles>>(ep.myRoles)
  return res.data.data
}

/** Bundled profile extras (committee roles + contribution stats) in a single request. */
export async function getMyProfileExtras(): Promise<MyProfileExtras> {
  const res = await apiClient.get<ApiResponse<MyProfileExtras>>(ep.myProfile)
  return res.data.data
}

// ── Club years ───────────────────────────────────────────────────────────────

export async function listClubYears(): Promise<ClubYear[]> {
  const res = await apiClient.get<ApiResponse<ClubYear[]>>(ep.years)
  return res.data.data
}

export async function createClubYear(label: string): Promise<ClubYear> {
  const res = await apiClient.post<ApiResponse<ClubYear>>(ep.years, { label })
  return res.data.data
}

export async function setCurrentClubYear(yearId: number): Promise<ClubYear> {
  const res = await apiClient.post<ApiResponse<ClubYear>>(ep.setCurrentYear(yearId), {})
  return res.data.data
}

// ── Year assignments ─────────────────────────────────────────────────────────

export async function getYearAssignments(yearId: number): Promise<YearAssignmentsResponse> {
  const res = await apiClient.get<ApiResponse<YearAssignmentsResponse>>(ep.yearAssignments(yearId))
  return res.data.data
}

export async function setYearAssignment(
  yearId: number, userId: number, role: CommitteeRole, isPublic: boolean,
): Promise<void> {
  await apiClient.put(ep.yearAssignments(yearId), { userId, role, isPublic })
}

export async function clearYearAssignment(yearId: number, userId: number): Promise<void> {
  await apiClient.delete(ep.yearAssignment(yearId, userId))
}

// ── Event assignments ────────────────────────────────────────────────────────

export async function getEventAssignments(eventId: number): Promise<EventAssignmentsResponse> {
  const res = await apiClient.get<ApiResponse<EventAssignmentsResponse>>(ep.eventAssignments(eventId))
  return res.data.data
}

export async function setEventAssignment(
  eventId: number, userId: number, role: CommitteeRole, canCollect: boolean, isPublic: boolean,
): Promise<void> {
  await apiClient.put(ep.eventAssignments(eventId), { userId, role, canCollect, isPublic })
}

export async function clearEventAssignment(eventId: number, userId: number): Promise<void> {
  await apiClient.delete(ep.eventAssignment(eventId, userId))
}
