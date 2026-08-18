import type { Metadata } from 'next'
import { SectionHeading } from '@/components/public/SectionHeading'
import { festivalConfig } from '@/config/festival'
import { Music, Users, Star, Heart } from 'lucide-react'

export const metadata: Metadata = { title: 'Events' }

const events = [
  {
    icon: Music,
    category: 'Cultural',
    title: 'Musical Evening',
    desc: 'An enchanting evening of classical and folk music, featuring artists from across Bengal celebrating the spirit of Durga Puja.',
    day: 'Mahasaptami Evening',
  },
  {
    icon: '🪔',
    category: 'Ritual',
    title: 'Sandhi Puja Special',
    desc: 'The sacred transition between Ashtami and Navami. 108 lamps, 108 lotus flowers, and a moment that transcends time.',
    day: 'Mahashtami Night',
  },
  {
    icon: '🥁',
    category: 'Traditional',
    title: 'Dhunuchi Naach Competition',
    desc: 'Watch as devotees perform the traditional fire dance with earthen incense pots — a breathtaking display of devotion and skill.',
    day: 'Mahanavami Evening',
  },
  {
    icon: Users,
    category: 'Cultural',
    title: 'Theatrical Performance',
    desc: "A stage production by our community members — drama, dance, and storytelling inspired by the mythology of Ma Durga.",
    day: 'Mahashtami Evening',
  },
  {
    icon: Heart,
    category: 'Community',
    title: 'Bhog Prasad Distribution',
    desc: 'Traditional khichuri bhog served to all who come — a meal of devotion and community shared by hundreds.',
    day: 'Ashtami & Navami',
  },
  {
    icon: Star,
    category: 'Special',
    title: 'Sindoor Khela',
    desc: 'The joyful celebration of Vijaya Dashami where married women apply sindoor to Ma Durga and to each other in a vibrant farewell.',
    day: 'Vijaya Dashami Morning',
  },
]

export default function EventsPage() {
  return (
    <>
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">What&apos;s Happening</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">Events & Programs</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">A vibrant lineup of cultural events, rituals, and community programs over four days.</p>
      </div>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading label="Programs" title={`Events — ${festivalConfig.year}`} className="mb-12" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(({ icon, category, title, desc, day }) => {
              const IconComp = typeof icon !== 'string' ? icon : null
              return (
              <div key={title} className="group p-6 rounded-2xl border border-border bg-white hover:border-brand-orange/30 hover:shadow-md hover:shadow-brand-orange/5 transition-all flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                    {typeof icon === 'string'
                      ? <span className="text-xl">{icon}</span>
                      : IconComp && <IconComp className="size-5 text-brand-orange" />
                    }
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-navy/5 text-brand-navy">
                    {category}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-brand-navy mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{desc}</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-brand-orange font-medium">📅 {day}</p>
                </div>
              </div>
            )})}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-10 italic">
            Event schedule is indicative. Exact timings will be announced closer to the festival.
          </p>
        </div>
      </section>
    </>
  )
}
