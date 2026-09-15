import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicAnnouncements } from '@/lib/api/public'
import { Megaphone, Calendar, ArrowRight } from 'lucide-react'
import type { PublicAnnouncement } from '@/types'

export const metadata: Metadata = { title: 'Announcements' }
export const revalidate = 300

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

// Group announcements by event (null event → "General")
function groupByEvent(items: PublicAnnouncement[]) {
  const map = new Map<string, { label: string; slug: string | null; items: PublicAnnouncement[] }>()

  for (const ann of items) {
    const key  = ann.event ? String(ann.event.id) : '__general__'
    const label = ann.event?.name ?? 'General'
    const slug  = ann.event?.slug ?? null
    if (!map.has(key)) map.set(key, { label, slug, items: [] })
    map.get(key)!.items.push(ann)
  }

  // Featured / general first, then events by their first announcement order
  const general = map.get('__general__')
  const eventGroups = [...map.entries()]
    .filter(([k]) => k !== '__general__')
    .map(([, v]) => v)

  return general ? [general, ...eventGroups] : eventGroups
}

export default async function AnnouncementsPage() {
  const announcements = await getPublicAnnouncements()
  const groups = groupByEvent(announcements)

  return (
    <>
      {/* Hero */}
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">Stay Informed</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">Announcements</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">
          Updates, notices, and news from Shatadal — all in one place.
        </p>
      </div>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">

          {announcements.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="size-16 mx-auto rounded-full bg-brand-orange/10 flex items-center justify-center mb-4">
                <Megaphone className="size-7 text-brand-orange/50" />
              </div>
              <p className="font-semibold text-brand-navy mb-2">No announcements yet</p>
              <p className="text-sm">Check back soon for updates from the team.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {groups.map((group) => (
                <div key={group.label}>
                  {/* Group header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-2">
                      <Megaphone className="size-4 text-brand-orange" />
                      {group.slug ? (
                        <Link
                          href={`/events/${group.slug}`}
                          className="font-heading font-bold text-lg text-brand-navy hover:text-brand-orange transition-colors flex items-center gap-1"
                        >
                          {group.label}
                          <ArrowRight className="size-3.5" />
                        </Link>
                      ) : (
                        <span className="font-heading font-bold text-lg text-brand-navy">{group.label}</span>
                      )}
                    </div>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground shrink-0">
                      {group.items.length} update{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-4">
                    {group.items.map((ann) => (
                      <div
                        key={ann.id}
                        className="rounded-2xl border border-border bg-white p-5 hover:border-brand-orange/20 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-heading font-bold text-brand-navy leading-snug">{ann.title}</h3>
                          {ann.publishedAt && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 mt-0.5">
                              <Calendar className="size-3" />
                              {fmtDate(ann.publishedAt)}
                            </p>
                          )}
                        </div>
                        {ann.body && (
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {ann.body}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>
    </>
  )
}
