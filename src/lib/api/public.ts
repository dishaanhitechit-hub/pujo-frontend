import { apiConfig } from '@/config/api'
import type {
  PublicEventDetail,
  PublicEventsList,
  PublicCommitteeMember,
  PublicCommitteeFull,
  PublicAnnouncement,
  PublicSiteConfig,
  PublicGalleryResponse,
  PublicStats,
  ContactQueryInput,
  ContactQuery,
} from '@/types'

const BASE = apiConfig.baseUrl
const ORG_SLUG = process.env.NEXT_PUBLIC_ORG_SLUG ?? ''

if (!ORG_SLUG) {
  // Shows in `npm run build` / server logs. Without it every public page renders empty.
  console.warn('[public-site] NEXT_PUBLIC_ORG_SLUG is not set — public pages will show no events, team or gallery.')
}

/**
 * Convert a relative media path (/media/...) returned by the public API
 * into a full absolute URL suitable for <img src> or next/image.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return `${BASE}${path}`
}

function withOrg(path: string, extraParams?: string): string {
  const slug = ORG_SLUG ? `orgSlug=${encodeURIComponent(ORG_SLUG)}` : ''
  const parts = [slug, extraParams].filter(Boolean).join('&')
  return parts ? `${path}?${parts}` : path
}

async function publicGet<T>(
  path: string,
  revalidate: number = 300,
): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      next: { revalidate },
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json.data ?? null) as T | null
  } catch {
    return null
  }
}

export async function getFeaturedEvent(): Promise<PublicEventDetail | null> {
  return publicGet<PublicEventDetail>(withOrg(apiConfig.endpoints.public.featuredEvent), 60)
}

export async function listPublicEvents(
  page = 1,
  perPage = 12,
  includeDays = false,
): Promise<PublicEventsList | null> {
  const extra = `page=${page}&perPage=${perPage}${includeDays ? '&includeDays=true' : ''}`
  return publicGet<PublicEventsList>(withOrg(apiConfig.endpoints.public.events, extra), 60)
}

export async function getPublicEventBySlug(slug: string): Promise<PublicEventDetail | null> {
  return publicGet<PublicEventDetail>(withOrg(apiConfig.endpoints.public.eventBySlug(slug)), 60)
}

export async function getPublicCommittee(eventId?: number): Promise<PublicCommitteeMember[]> {
  const extra = eventId ? `eventId=${eventId}` : undefined
  const data = await publicGet<PublicCommitteeMember[]>(
    withOrg(apiConfig.endpoints.public.committee, extra),
    300,
  )
  return data ?? []
}

export async function getPublicCommitteeFull(): Promise<PublicCommitteeFull> {
  const data = await publicGet<PublicCommitteeFull>(
    withOrg(apiConfig.endpoints.public.committeeFull),
    300,
  )
  return data ?? { yearCommittee: null, eventCommittees: [], legacyMembers: [] }
}

export async function getPublicAnnouncements(eventId?: number): Promise<PublicAnnouncement[]> {
  const extra = eventId ? `eventId=${eventId}` : undefined
  const data = await publicGet<PublicAnnouncement[]>(
    withOrg(apiConfig.endpoints.public.announcements, extra),
    60,
  )
  return data ?? []
}

export async function getSiteConfig(): Promise<PublicSiteConfig | null> {
  return publicGet<PublicSiteConfig>(withOrg(apiConfig.endpoints.public.siteConfig), 300)
}

export async function listPublicGallery(): Promise<PublicGalleryResponse | null> {
  return publicGet<PublicGalleryResponse>(withOrg(apiConfig.endpoints.public.gallery), 300)
}

export async function getPublicStats(): Promise<PublicStats | null> {
  return publicGet<PublicStats>(withOrg(apiConfig.endpoints.public.stats), 300)
}

export interface OrgRequestInput {
  orgName: string
  contactName: string
  contactEmail: string
  contactPhone?: string
}

export async function submitOrgRequest(input: OrgRequestInput): Promise<void> {
  const res = await fetch(`${BASE}${apiConfig.endpoints.public.orgRequest}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Submission failed. Please try again.')
}

export async function submitContactQuery(input: ContactQueryInput): Promise<ContactQuery> {
  const res = await fetch(`${BASE}${apiConfig.endpoints.contact.submit}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, orgSlug: ORG_SLUG }),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Submission failed. Please try again.')
  return json.data as ContactQuery
}
