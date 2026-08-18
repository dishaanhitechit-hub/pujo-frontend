import type { Metadata } from 'next'
import { SectionHeading } from '@/components/public/SectionHeading'

export const metadata: Metadata = { title: 'Gallery' }

const placeholders = [
  { label: 'Ma Durga Idol', aspect: 'aspect-[3/4]' },
  { label: 'Pandal Decoration', aspect: 'aspect-square' },
  { label: 'Dhunuchi Naach', aspect: 'aspect-[4/3]' },
  { label: 'Anjali Ceremony', aspect: 'aspect-square' },
  { label: 'Sindoor Khela', aspect: 'aspect-[3/4]' },
  { label: 'Cultural Program', aspect: 'aspect-[4/3]' },
  { label: 'Dhak Performance', aspect: 'aspect-square' },
  { label: 'Immersion Procession', aspect: 'aspect-[4/3]' },
  { label: 'Community Feast', aspect: 'aspect-square' },
]

export default function GalleryPage() {
  return (
    <>
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">Memories</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">Gallery</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">Glimpses of the joy, devotion, and colour of Shatadal Durga Puja across the years.</p>
      </div>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Photos" title="Our Celebrations" className="mb-12" />

          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {placeholders.map(({ label, aspect }) => (
              <div
                key={label}
                className={`${aspect} w-full rounded-2xl bg-gradient-to-br from-brand-orange/10 to-brand-pink/10 border border-brand-orange/10 overflow-hidden relative flex items-end p-3 break-inside-avoid`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-5xl text-brand-orange/10 pointer-events-none">
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
            Gallery photos from Puja {new Date().getFullYear()} will be added after the celebration.
          </p>
        </div>
      </section>
    </>
  )
}
