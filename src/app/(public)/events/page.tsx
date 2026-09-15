import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SectionHeading } from '@/components/public/SectionHeading'
import { listPublicEvents, mediaUrl } from '@/lib/api/public'
import { MapPin, Calendar, ChevronRight, Star } from 'lucide-react'
import type { PublicEvent } from '@/types'

export const metadata: Metadata = { title: 'Events' }

function fmtDate(dateStr: string | null, opts: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    ...opts,
    timeZone: 'Asia/Kolkata',
  })
}

function dateRange(event: PublicEvent): string | null {
  const startStr = fmtDate(event.startDate, { day: 'numeric', month: 'long' })
  const endStr   = fmtDate(event.endDate,   { day: 'numeric', month: 'long', year: 'numeric' })
  return startStr && endStr ? `${startStr} – ${endStr}` : startStr || endStr || null
}

function isOver(event: PublicEvent): boolean {
  if (!event.endDate) return false
  const end = new Date(event.endDate + 'T23:59:59+05:30')
  return end < new Date()
}

// ── Shared card ──────────────────────────────────────────────────────────────

function EventCard({ event, featured = false }: { event: PublicEvent; featured?: boolean }) {
  const cover = mediaUrl(event.coverImageUrl)
  const range = dateRange(event)

  if (featured) {
    return (
      <Link
        href={`/events/${event.slug}`}
        className="group relative flex flex-col sm:flex-row rounded-2xl border border-brand-orange/20 overflow-hidden hover:border-brand-orange/50 hover:shadow-lg hover:shadow-brand-orange/10 transition-all bg-white"
      >
        {/* Cover */}
        <div className="relative sm:w-1/2 aspect-video sm:aspect-auto min-h-52 overflow-hidden bg-gradient-to-br from-brand-orange/10 to-brand-pink/10 shrink-0">
          {cover ? (
            <Image
              src={cover}
              alt={event.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl text-brand-orange/20">🪷</div>
          )}
          <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-orange text-white shadow">
            <Star className="size-2.5 fill-white" /> Featured
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-col justify-between p-6 sm:p-8 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {event.year && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-navy/5 text-brand-navy">
                  {event.year}
                </span>
              )}
            </div>
            <h3 className="font-heading font-bold text-2xl sm:text-3xl text-brand-navy mb-3">{event.name}</h3>
            {event.description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{event.description}</p>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-border space-y-1.5">
            {range && (
              <p className="flex items-center gap-1.5 text-xs text-brand-orange font-medium">
                <Calendar className="size-3.5" /> {range}
              </p>
            )}
            {event.location && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" /> {event.location}
              </p>
            )}
            <p className="flex items-center gap-1 text-xs font-semibold text-brand-orange mt-2">
              View details <ChevronRight className="size-3.5" />
            </p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col rounded-2xl border border-border overflow-hidden hover:border-brand-orange/30 hover:shadow-md hover:shadow-brand-orange/5 transition-all bg-white"
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand-orange/10 to-brand-pink/10">
        {cover ? (
          <Image
            src={cover}
            alt={event.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl text-brand-orange/20">🪷</div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-brand-navy">{event.name}</h3>
          {event.year && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-navy/5 text-brand-navy">
              {event.year}
            </span>
          )}
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">{event.description}</p>
        )}
        <div className="mt-auto pt-3 border-t border-border space-y-1.5">
          {range && (
            <p className="flex items-center gap-1.5 text-xs text-brand-orange font-medium">
              <Calendar className="size-3.5" /> {range}
            </p>
          )}
          {event.location && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" /> {event.location}
            </p>
          )}
          <p className="flex items-center gap-1 text-xs font-semibold text-brand-orange mt-2">
            View details <ChevronRight className="size-3.5" />
          </p>
        </div>
      </div>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function EventsPage() {
  const result = await listPublicEvents(1, 50)
  const events = result?.events ?? []

  const featured  = events.filter(e => e.isFeatured)
  const upcoming  = events.filter(e => !e.isFeatured && !isOver(e))
  const past      = events.filter(e => !e.isFeatured && isOver(e))

  const hasAny = events.length > 0

  return (
    <>
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">What&apos;s Happening</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">Events & Programs</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">
          Everything we celebrate — Durga Puja, cultural programmes, community gatherings, and more. Each event a new chapter.
        </p>
      </div>

      <div className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-20">

          {!hasAny && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-4xl mb-4">🪷</p>
              <p className="font-semibold text-brand-navy mb-2">No events published yet</p>
              <p className="text-sm">Check back closer to the festival season.</p>
            </div>
          )}

          {/* ── Featured ── */}
          {featured.length > 0 && (
            <section>
              <SectionHeading label="Celebrations" title="Our Events" className="mb-10" />
              <div className="space-y-6">
                {featured.map(e => <EventCard key={e.id} event={e} featured />)}
              </div>
            </section>
          )}

          {/* ── Upcoming ── */}
          {upcoming.length > 0 && (
            <section>
              {!featured.length && (
                <SectionHeading label="Celebrations" title="Our Events" className="mb-10" />
              )}
              {featured.length > 0 && (
                <h2 className="font-heading font-bold text-2xl text-brand-navy mb-8">Upcoming Events</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            </section>
          )}

          {/* ── Past ── */}
          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="font-heading font-bold text-2xl text-brand-navy">Previous Celebrations</h2>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                {past.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  )
}
