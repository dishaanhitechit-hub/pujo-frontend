import type { Metadata } from 'next'
import Image from 'next/image'
import { SectionHeading } from '@/components/public/SectionHeading'
import { getPublicCommittee, mediaUrl } from '@/lib/api/public'
import { User, Phone } from 'lucide-react'

export const metadata: Metadata = { title: 'Committee' }

export default async function CommitteePage() {
  const members = await getPublicCommittee()

  return (
    <>
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">The People Behind It</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">Our Committee</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">The dedicated volunteers who make Shatadal Puja possible every year.</p>
      </div>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <SectionHeading label="Committee" title="Meet the Team" className="mb-12" />

          {members.length === 0 ? (
            <>
              <div className="bg-[oklch(0.985_0.01_90)] rounded-2xl border border-dashed border-brand-orange/20 p-12 text-center">
                <div className="size-16 mx-auto rounded-full bg-brand-orange/10 flex items-center justify-center mb-4">
                  <User className="size-8 text-brand-orange/50" />
                </div>
                <h3 className="font-heading font-bold text-brand-navy text-lg mb-2">Committee Details Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Committee details will be published here before the Puja. Please check back closer to the festival.
                </p>
              </div>

              <div className="mt-10 p-6 rounded-xl border border-border bg-white">
                <h3 className="font-semibold text-brand-navy mb-3">About Our Committee</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The Shatadal Puja committee is a group of dedicated volunteers from the Kolaghat
                  community who work tirelessly throughout the year to organize and execute the
                  annual Durga Puja. From fundraising to decoration, from cultural programs to
                  logistics — every aspect is handled with love and dedication.
                </p>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {members.map((member) => {
                const photo = mediaUrl(member.photoUrl)
                return (
                  <div
                    key={member.id}
                    className="group p-5 rounded-2xl border border-border bg-white hover:border-brand-orange/20 hover:shadow-md hover:shadow-brand-orange/5 transition-all flex items-start gap-4"
                  >
                    {/* Avatar */}
                    <div className="size-14 rounded-xl overflow-hidden bg-brand-orange/10 flex items-center justify-center shrink-0">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={member.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="size-6 text-brand-orange/50" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-brand-navy text-sm leading-snug">
                        {member.name}
                      </h3>
                      <p className="text-xs text-brand-orange font-medium mt-0.5">
                        {member.roleTitle}
                      </p>
                      {member.phone && (
                        <a
                          href={`tel:${member.phone}`}
                          className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-orange transition-colors"
                        >
                          <Phone className="size-3" /> {member.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
