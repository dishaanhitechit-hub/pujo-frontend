import type { Metadata } from 'next'
import { SectionHeading } from '@/components/public/SectionHeading'
import { festivalConfig } from '@/config/festival'

export const metadata: Metadata = { title: 'Puja' }

export default function PujaPage() {
  return (
    <>
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">
          {festivalConfig.name} {festivalConfig.year}
        </p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">The Celebration</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">Four sacred days of devotion, ritual, and joy.</p>
      </div>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeading
            label="Schedule"
            title={`Puja ${festivalConfig.year}`}
            className="mb-12"
          />

          <div className="flex flex-col gap-8">
            {festivalConfig.days.map(({ key, label, emoji, date, rituals, highlight }, idx) => (
              <div key={key} className="group relative flex gap-6">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="size-12 rounded-full bg-brand-orange/10 border-2 border-brand-orange/30 flex items-center justify-center text-xl shrink-0 group-hover:border-brand-orange transition-colors">
                    {emoji}
                  </div>
                  {idx < festivalConfig.days.length - 1 && (
                    <div className="w-0.5 flex-1 bg-brand-orange/15 mt-2 min-h-8" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                    <h2 className="font-heading font-bold text-xl text-brand-navy">{label}</h2>
                    <span className="text-xs text-brand-orange font-medium">
                      {new Date(date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-4">{highlight}</p>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
