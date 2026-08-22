import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SectionHeading } from '@/components/public/SectionHeading'
import { getFeaturedEvent, listPublicEvents, mediaUrl } from '@/lib/api/public'

export const metadata: Metadata = { title: 'Gallery' }

export default async function GalleryPage() {
  const [featured, eventsResult] = await Promise.all([
    getFeaturedEvent(),
    listPublicEvents(1, 20),
  ])

  const galleryImages = featured?.gallery ?? []
  const allEvents     = eventsResult?.events ?? []

  const hasGallery = galleryImages.length > 0
  const hasCovers  = allEvents.some((e) => e.coverImageUrl)

  return (
    <>
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">Memories</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">Gallery</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">Glimpses of the joy, devotion, and colour of Shatadal Durga Puja across the years.</p>
      </div>

      {/* Featured event gallery */}
      {hasGallery && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              label={featured!.name}
              title="Featured Gallery"
              className="mb-12"
            />

            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {galleryImages.map((item) => {
                const src = mediaUrl(item.url)
                return (
                  <div
                    key={item.id}
                    className="relative w-full rounded-xl overflow-hidden break-inside-avoid bg-brand-orange/5 border border-brand-orange/10"
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt={item.altText ?? 'Gallery photo'}
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="aspect-square flex items-center justify-center text-4xl text-brand-orange/15">
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

      {/* Past events covers grid */}
      {hasCovers && (
        <section className={`py-20 ${hasGallery ? 'bg-[oklch(0.985_0.01_90)]' : 'bg-white'}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Our Celebrations" title="Past Events" className="mb-12" />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {allEvents.map((event) => {
                const cover = mediaUrl(event.coverImageUrl)
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-brand-orange/10 to-brand-pink/10 border border-brand-orange/10 flex items-end p-3 hover:scale-[1.02] transition-transform"
                  >
                    {cover ? (
                      <Image
                        src={cover}
                        alt={event.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl text-brand-orange/10">
                        🪷
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 to-transparent" />
                    <div className="relative">
                      <p className="text-xs font-semibold text-white">{event.name}</p>
                      {event.year && <p className="text-[10px] text-white/60">{event.year}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasGallery && !hasCovers && (
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Photos" title="Our Celebrations" className="mb-12" />

            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {['Ma Durga Idol', 'Pandal Decoration', 'Dhunuchi Naach', 'Anjali Ceremony', 'Sindoor Khela', 'Cultural Program', 'Dhak Performance', 'Immersion Procession', 'Community Feast'].map((label) => (
                <div
                  key={label}
                  className="aspect-square w-full rounded-2xl bg-gradient-to-br from-brand-orange/10 to-brand-pink/10 border border-brand-orange/10 overflow-hidden relative flex items-end p-3 break-inside-avoid"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-5xl text-brand-orange/10">
                    🪷
                  </div>
                  <div className="absolute top-2 right-2 text-[9px] text-muted-foreground/50 italic bg-white/60 px-1.5 py-0.5 rounded">
                    Coming soon
                  </div>
                  <p className="relative text-xs font-medium text-brand-navy/60 bg-white/80 px-2 py-1 rounded-lg backdrop-blur-sm">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-10 italic">
              Gallery photos will be added after the celebration.
            </p>
          </div>
        </section>
      )}
    </>
  )
}
