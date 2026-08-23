import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SectionHeading } from '@/components/public/SectionHeading'
import { listPublicEvents, mediaUrl } from '@/lib/api/public'
import { MapPin, Calendar, ChevronRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Events' }

function fmtDate(dateStr: string | null, opts: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    ...opts,
    timeZone: 'Asia/Kolkata',
  })
}

export default async function EventsPage() {
  const result = await listPublicEvents(1, 20)
  const events = result?.events ?? []

  return (
    <>
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">What&apos;s Happening</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">Events & Programs</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">
          Everything we celebrate — Durga Puja, cultural programmes, community gatherings, and more. Each event a new chapter.
        </p>
      </div>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading label="Celebrations" title="Our Events" className="mb-12" />

          {events.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-4xl mb-4">🪷</p>
              <p className="font-semibold text-brand-navy mb-2">No events published yet</p>
              <p className="text-sm">Check back closer to the festival season.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const cover = mediaUrl(event.coverImageUrl)
                const startStr = fmtDate(event.startDate, { day: 'numeric', month: 'long' })
                const endStr   = fmtDate(event.endDate,   { day: 'numeric', month: 'long', year: 'numeric' })
                const dateRange = startStr && endStr ? `${startStr} – ${endStr}` : startStr || endStr || null

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group flex flex-col rounded-2xl border border-border overflow-hidden hover:border-brand-orange/30 hover:shadow-md hover:shadow-brand-orange/5 transition-all bg-white"
                  >
                    {/* Cover image */}
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
                        <div className="absolute inset-0 flex items-center justify-center text-5xl text-brand-orange/20">
                          🪷
                        </div>
                      )}
                      {event.isFeatured && (
                        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-orange text-white">
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Card body */}
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
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">
                          {event.description}
                        </p>
                      )}

                      <div className="mt-auto pt-3 border-t border-border space-y-1.5">
                        {dateRange && (
                          <p className="flex items-center gap-1.5 text-xs text-brand-orange font-medium">
                            <Calendar className="size-3.5" /> {dateRange}
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
              })}
            </div>
          )}

          {result && result.pages > 1 && (
            <p className="text-center text-sm text-muted-foreground mt-10">
              Showing page {result.page} of {result.pages} ({result.total} events)
            </p>
          )}
        </div>
      </section>
    </>
  )
}
