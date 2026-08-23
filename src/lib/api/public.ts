import { apiConfig } from '@/config/api'
import type {
  PublicEventDetail,
  PublicEventsList,
  PublicCommitteeMember,
  PublicAnnouncement,
  PublicSiteConfig,
  PublicGalleryResponse,
  PublicStats,
  ContactQueryInput,
  ContactQuery,
} from '@/types'

const BASE = apiConfig.baseUrl

/**
 * Convert a relative media path (/media/...) returned by the public API
 * into a full absolute URL suitable for <img src> or next/image.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return `${BASE}${path}`
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
  return publicGet<PublicEventDetail>(apiConfig.endpoints.public.featuredEvent, 300)
}

export async function listPublicEvents(
  page = 1,
  perPage = 12,
  includeDays = false,
): Promise<PublicEventsList | null> {
  const qs = `?page=${page}&perPage=${perPage}${includeDays ? '&includeDays=true' : ''}`
  return publicGet<PublicEventsList>(apiConfig.endpoints.public.events + qs, 300)
}

export async function getPublicEventBySlug(slug: string): Promise<PublicEventDetail | null> {
  return publicGet<PublicEventDetail>(apiConfig.endpoints.public.eventBySlug(slug), 300)
}

export async function getPublicCommittee(eventId?: number): Promise<PublicCommitteeMember[]> {
  const qs = eventId ? `?eventId=${eventId}` : ''
  const data = await publicGet<PublicCommitteeMember[]>(
    apiConfig.endpoints.public.committee + qs,
    600,
  )
  return data ?? []
}

export async function getPublicAnnouncements(eventId?: number): Promise<PublicAnnouncement[]> {
  const qs = eventId ? `?eventId=${eventId}` : ''
  const data = await publicGet<PublicAnnouncement[]>(
    apiConfig.endpoints.public.announcements + qs,
    300,
  )
  return data ?? []
}

export async function getSiteConfig(): Promise<PublicSiteConfig | null> {
  return publicGet<PublicSiteConfig>(apiConfig.endpoints.public.siteConfig, 3600)
}

export async function listPublicGallery(): Promise<PublicGalleryResponse | null> {
  return publicGet<PublicGalleryResponse>(apiConfig.endpoints.public.gallery, 300)
}

export async function getPublicStats(): Promise<PublicStats | null> {
  return publicGet<PublicStats>(apiConfig.endpoints.public.stats, 3600)
}

export async function submitContactQuery(input: ContactQueryInput): Promise<ContactQuery> {
  const res = await fetch(`${BASE}${apiConfig.endpoints.contact.submit}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Submission failed. Please try again.')
  return json.data as ContactQuery
}
