import type { Metadata } from 'next'
import { SectionHeading } from '@/components/public/SectionHeading'
import { siteConfig } from '@/config/site'
import { Flower2, Heart, Star, Users, Calendar } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <>
      {/* Page hero */}
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">Our Story</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">About {siteConfig.nameEn}</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">A community club rooted in culture, tradition, and togetherness — celebrating every season, every occasion.</p>
      </div>

      <div className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex justify-center mb-10">
            <Image
              src="/assets/branding/club-logo.jpeg"
              alt={`${siteConfig.nameEn} logo`}
              width={120}
              height={120}
              className="rounded-2xl shadow-lg"
            />
          </div>

          <SectionHeading
            label="Our Identity"
            title="শতদল — A Hundred Petals"
            subtitle="Like the hundred-petalled lotus blooming in still water, Shatadal is a symbol of purity, beauty, and collective strength — a name that captures everything this club stands for."
            className="mb-10"
          />

          <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed space-y-6">
            <p>
              Shatadal is a community cultural club founded by and for the people of Kolaghat,
              Purba Medinipur. We are more than an event committee — we are a family that comes
              alive across every season, every occasion, bringing the community together through
              shared culture, celebration, and service.
            </p>
            <p>
              Throughout the year we organise cultural programmes, sports and recreational events,
              social initiatives, and seasonal celebrations that reflect the full rhythm of Bengali
              life. Every event — big or small — is built around one idea: that a community is
              strongest when it gathers with purpose and joy.
            </p>
            <p>
              Our crown event is Durga Puja — an annual celebration that has grown into one of the
              most cherished in the region. Our pandal, cultural evenings, prasad, and the sheer
              spirit of the days draw thousands of visitors and volunteers who return year after
              year. But even between pujas, Shatadal is always in motion, always present.
            </p>
            <p>
              Founded by a handful of dedicated members, we have grown into a thriving organisation
              where families, elders, youth, and artists all have a place. Every person who
              contributes their time, talent, or support becomes part of this hundred-petalled story.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Flower2, title: 'Cultural Legacy', desc: 'Preserving the rich traditions of Bengali culture — from Durga Puja to seasonal festivals and performing arts.' },
              { icon: Heart, title: 'Community First', desc: 'Every programme we run, every rupee we spend — it goes back to the community that built us.' },
              { icon: Calendar, title: 'Year-Round Activity', desc: 'Sports meets, cultural shows, social drives, and multiple celebrations keep Shatadal active all year long.' },
              { icon: Users, title: 'Inclusive & Open', desc: 'Open to all — residents, well-wishers, and visitors. There is always a place for you here.' },
              { icon: Star, title: 'Creative Excellence', desc: 'We set a high bar for every event we present, because our community deserves nothing less.' },
              { icon: Heart, title: 'Voluntary Spirit', desc: 'Shatadal runs on the dedication of volunteers who give their time freely out of love for this community.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-5 rounded-xl border border-border hover:border-brand-orange/30 transition-colors">
                <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                  <Icon className="size-5 text-brand-orange" />
                </div>
                <div>
                  <p className="font-semibold text-brand-navy text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
