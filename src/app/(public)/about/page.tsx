import type { Metadata } from 'next'
import { SectionHeading } from '@/components/public/SectionHeading'
import { siteConfig } from '@/config/site'
import { Flower2, Heart, Star, Users } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <>
      {/* Page hero */}
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">Our Story</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">About {siteConfig.nameEn}</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">The history, values, and community behind Shatadal Kolaghat.</p>
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
            subtitle="Like the hundred-petalled lotus blooming in still water, Shatadal is a symbol of purity, beauty, and collective strength."
            className="mb-10"
          />

          <div className="prose prose-slate max-w-none text-muted-foreground leading-relaxed space-y-6">
            <p>
              Shatadal Kolaghat is a community organization dedicated to celebrating Durga Puja with
              cultural richness and spiritual depth. Founded by the people of Kolaghat, our annual
              Durga Puja has become one of the most cherished celebrations in the region.
            </p>
            <p>
              Every year, we bring together families, elders, youth, and artists to create a
              celebration that honors both the divine and the human — a festival that is as much
              about togetherness as it is about devotion.
            </p>
            <p>
              Our pandal, our cultural programs, our prasad — everything we do reflects the spirit
              of community and the love our members have for this annual tradition.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: Flower2, title: 'Cultural Legacy', desc: 'Preserving and celebrating the rich traditions of Bengali Durga Puja.' },
              { icon: Heart, title: 'Community First', desc: 'Every decision we make puts our community at the centre.' },
              { icon: Users, title: 'Inclusive Celebration', desc: 'Open to all — believers and admirers alike are welcome.' },
              { icon: Star, title: 'Creative Excellence', desc: 'Each year we strive to create something extraordinary.' },
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
