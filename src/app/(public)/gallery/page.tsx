import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SectionHeading } from '@/components/public/SectionHeading'
import { listPublicGallery, listPublicEvents, mediaUrl } from '@/lib/api/public'

export const metadata: Metadata = { title: 'Gallery' }

// Placeholder cards shown before any media is uploaded.
// Varying aspect ratios create the Pinterest masonry feel even without real photos.
const PLACEHOLDER_CARDS: { label: string; aspect: string }[] = [
  { label: 'Cultural Programme',   aspect: 'aspect-[3/4]'  },
  { label: 'Community Gathering',  aspect: 'aspect-[4/3]'  },
  { label: 'Stage Performance',    aspect: 'aspect-[2/3]'  },
  { label: 'Sports Meet',          aspect: 'aspect-square' },
  { label: 'Festive Celebration',  aspect: 'aspect-[3/4]'  },
  { label: 'Award Ceremony',       aspect: 'aspect-[4/3]'  },
  { label: 'Youth Programme',      aspect: 'aspect-[2/3]'  },
  { label: 'Community Feast',      aspect: 'aspect-square' },
  { label: 'Volunteer Moments',    aspect: 'aspect-[3/4]'  },
]

export default async function GalleryPage() {
  const [galleryResult, eventsResult] = await Promise.all([
    listPublicGallery(),
    listPublicEvents(1, 20),
  ])

  const galleryImages = galleryResult?.images ?? []
  const allEvents     = eventsResult?.events ?? []

  const hasGallery = galleryImages.length > 0
  const hasCovers  = allEvents.some((e) => e.coverImageUrl)

  return (
    <>
      {/* Hero */}
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">Memories</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">Gallery</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">
          Glimpses of joy, colour, and community — moments from Shatadal celebrations across the years.
        </p>
      </div>

      {/* ── All events gallery — Pinterest masonry ── */}
      {hasGallery && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading label="All Events" title="Photo Gallery" className="mb-12" />
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
              {galleryImages.map((item) => {
                const src = mediaUrl(item.url)
                return (
                  <Link
                    key={item.id}
                    href={`/events/${item.event.slug}`}
                    className="group mb-3 block break-inside-avoid rounded-xl overflow-hidden bg-brand-orange/5 border border-brand-orange/10 relative"
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt={item.altText ?? item.event.name}
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="aspect-square flex items-center justify-center text-4xl text-brand-orange/15">🪷</div>
                    )}
                    {/* Event name overlay — visible on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
                      <p className="text-[11px] font-semibold text-white leading-snug line-clamp-1">{item.event.name}</p>
                      {item.event.isFeatured && (
                        <p className="text-[9px] font-bold uppercase tracking-wider text-brand-orange mt-0.5">Featured</p>
                      )}
                    </div>
                    {item.event.isFeatured && (
                      <span className="absolute top-2 left-2 text-[9px] font-semibold uppercase tracking-wide bg-brand-orange text-white px-1.5 py-0.5 rounded-full group-hover:opacity-0 transition-opacity duration-200">
                        Featured
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Past event covers — Pinterest masonry ── */}
      {hasCovers && (
        <section className={`py-20 ${hasGallery ? 'bg-[oklch(0.985_0.01_90)]' : 'bg-white'}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Our Celebrations" title="Past Events" className="mb-12" />
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
              {allEvents.map((event) => {
                const cover = mediaUrl(event.coverImageUrl)
                if (!cover) return null
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group mb-3 block break-inside-avoid relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-orange/10 to-brand-pink/10 border border-brand-orange/10"
                  >
                    <div className="aspect-[3/4] relative w-full">
                      <Image
                        src={cover}
                        alt={event.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-3">
                        <p className="text-xs font-semibold text-white leading-snug">{event.name}</p>
                        {event.year && <p className="text-[10px] text-white/60 mt-0.5">{event.year}</p>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Empty state — Pinterest masonry placeholders ── */}
      {!hasGallery && !hasCovers && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Photos" title="Our Celebrations" className="mb-12" />

            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
              {PLACEHOLDER_CARDS.map(({ label, aspect }) => (
                <div key={label} className="mb-3 break-inside-avoid rounded-2xl overflow-hidden">
                  <div className={`${aspect} relative w-full bg-gradient-to-br from-brand-orange/10 to-brand-pink/5 border border-brand-orange/10`}>
                    <div className="absolute inset-0 flex items-center justify-center text-5xl text-brand-orange/10">🪷</div>
                    <span className="absolute top-2 right-2 text-[9px] text-muted-foreground/50 italic bg-white/70 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      Coming soon
                    </span>
                    <span className="absolute bottom-3 left-3 text-xs font-medium text-brand-navy/60 bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm">
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-10 italic">
              Photos from our events will be added here after each celebration.
            </p>
          </div>
        </section>
      )}
    </>
  )
}
