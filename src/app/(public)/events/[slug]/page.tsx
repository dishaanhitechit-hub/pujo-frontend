import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SectionHeading } from '@/components/public/SectionHeading'
import { getPublicEventBySlug, getPublicAnnouncements, mediaUrl } from '@/lib/api/public'
import { festivalConfig } from '@/config/festival'
import { MapPin, Calendar, ChevronLeft } from 'lucide-react'

// Stable emoji map for known day keys
const DAY_EMOJI: Record<string, string> = {
  mahasaptami:    '🌸',
  mahashtami:     '🙏',
  mahanavami:     '🪔',
  vijaya_dashami: '🌊',
}

function fmtDate(dateStr: string | null, opts: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    ...opts,
    timeZone: 'Asia/Kolkata',
  })
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await getPublicEventBySlug(slug)
  if (!event) return { title: 'Event Not Found' }
  return {
    title: event.name,
    description: event.description ?? undefined,
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const [event, announcements] = await Promise.all([
    getPublicEventBySlug(slug),
    getPublicAnnouncements(),
  ])

  if (!event) notFound()

  const cover = mediaUrl(event.coverImageUrl)
  const startStr = fmtDate(event.startDate, { day: 'numeric', month: 'long' })
  const endStr   = fmtDate(event.endDate,   { day: 'numeric', month: 'long', year: 'numeric' })
  const dateRange = startStr && endStr ? `${startStr} – ${endStr}` : startStr || endStr || null

  const eventAnnouncements = announcements.filter(
    (a) => a.event?.id === event.id || !a.event,
  )

  return (
    <>
      {/* Hero */}
      <div className="relative pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] overflow-hidden">
        {cover && (
          <Image
            src={cover}
            alt={event.name}
            fill
            className="object-cover opacity-20"
            sizes="100vw"
            priority
          />
        )}
        <div className="relative text-center px-4">
          {event.isFeatured && (
            <span className="inline-block mb-3 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
              Featured Event
            </span>
          )}
          {event.year && (
            <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">
              {event.year}
            </p>
          )}
          <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">{event.name}</h1>
          {event.description && (
            <p className="text-white/60 mt-4 max-w-2xl mx-auto leading-relaxed">{event.description}</p>
          )}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-white/50">
            {dateRange && (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4 text-brand-orange/60" /> {dateRange}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-brand-orange/60" /> {event.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cover image (full display) */}
      {cover && (
        <div className="bg-brand-navy">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 -mt-6 relative z-10 pb-8">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <Image
                src={cover}
                alt={event.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          </div>
        </div>
      )}

      {/* Schedule */}
      {event.days.length > 0 && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <SectionHeading label="Schedule" title="Event Programme" className="mb-12" />

            <div className="flex flex-col gap-8">
              {event.days.map(({ key, label, date, description, rituals }, idx) => (
                <div key={key} className="group relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="size-12 rounded-full bg-brand-orange/10 border-2 border-brand-orange/30 flex items-center justify-center text-xl shrink-0 group-hover:border-brand-orange transition-colors">
                      {DAY_EMOJI[key] ?? '🪷'}
                    </div>
                    {idx < event.days.length - 1 && (
                      <div className="w-0.5 flex-1 bg-brand-orange/15 mt-2 min-h-8" />
                    )}
                  </div>

                  <div className="pb-8 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                      <h2 className="font-heading font-bold text-xl text-brand-navy">{label}</h2>
                      {date && (
                        <span className="text-xs text-brand-orange font-medium">
                          {fmtDate(date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {description && (
                      <p className="text-sm text-muted-foreground italic mb-4">{description}</p>
                    )}
                    {rituals.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {rituals.map((r) => (
                          <span
                            key={r}
                            className="text-xs px-3 py-1 rounded-full bg-brand-orange/8 text-brand-navy border border-brand-orange/15 font-medium"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {event.gallery.length > 0 && (
        <section className="py-20 bg-[oklch(0.985_0.01_90)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Photos" title="Gallery" className="mb-12" />

            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {event.gallery.map((item) => {
                const imgSrc = mediaUrl(item.url)
                return (
                  <div
                    key={item.id}
                    className="relative w-full rounded-xl overflow-hidden break-inside-avoid bg-brand-orange/5"
                  >
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={item.altText ?? event.name}
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="aspect-square flex items-center justify-center text-3xl text-brand-orange/20">
                        🪷
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Announcements */}
      {eventAnnouncements.length > 0 && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <SectionHeading label="Updates" title="Announcements" className="mb-8" />

            <div className="flex flex-col gap-4">
              {eventAnnouncements.map((ann) => (
                <div key={ann.id} className="p-5 rounded-xl border border-border bg-white hover:border-brand-orange/20 transition-colors">
                  <h3 className="font-semibold text-brand-navy mb-1">{ann.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ann.body}</p>
                  {ann.publishedAt && (
                    <p className="text-[11px] text-muted-foreground/60 mt-2">
                      {new Date(ann.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state when event has no days AND no gallery */}
      {event.days.length === 0 && event.gallery.length === 0 && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center text-muted-foreground">
            <p className="text-4xl mb-4">🪷</p>
            <p className="font-semibold text-brand-navy mb-2">Schedule & gallery coming soon</p>
            <p className="text-sm">Details will be published closer to the celebration.</p>
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="bg-[oklch(0.985_0.01_90)] py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:gap-3 transition-all"
          >
            <ChevronLeft className="size-4" /> All events
          </Link>
        </div>
      </div>
    </>
  )
}
