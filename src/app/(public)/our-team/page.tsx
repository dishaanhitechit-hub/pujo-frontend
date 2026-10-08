import type { Metadata } from 'next'
import Image from 'next/image'
import { SectionHeading } from '@/components/public/SectionHeading'
import { getPublicCommitteeFull, getSiteConfig, mediaUrl } from '@/lib/api/public'
import type { PublicCommitteeMember } from '@/types'
import { User } from 'lucide-react'

export const metadata: Metadata = { title: 'Our Team' }

function MemberCard({ member }: { member: PublicCommitteeMember }) {
  const photo = mediaUrl(member.photoUrl)
  return (
    <div className="group p-5 rounded-2xl border border-border bg-white hover:border-brand-orange/20 hover:shadow-md hover:shadow-brand-orange/5 transition-all flex items-start gap-4">
      <div className="size-14 rounded-xl overflow-hidden bg-brand-orange/10 flex items-center justify-center shrink-0">
        {photo ? (
          <Image src={photo} alt={member.name} width={56} height={56} className="w-full h-full object-cover" />
        ) : (
          <User className="size-6 text-brand-orange/50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-heading font-bold text-brand-navy text-sm leading-snug">{member.name}</h3>
        <p className="text-xs text-brand-orange font-medium mt-0.5">{member.roleTitle}</p>
      </div>
    </div>
  )
}

function MemberGrid({ members }: { members: PublicCommitteeMember[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {members.map((m) => <MemberCard key={m.id} member={m} />)}
    </div>
  )
}

export default async function OurTeamPage() {
  const [data, cfg] = await Promise.all([
    getPublicCommitteeFull(),
    getSiteConfig(),
  ])

  const club   = cfg?.club
  const nameEn = club?.nameEn ?? ''
  const city   = club?.city   ?? ''

  const { yearCommittee, eventCommittees, legacyMembers } = data
  const hasAny = !!yearCommittee || eventCommittees.length > 0 || legacyMembers.length > 0

  return (
    <>
      {/* Hero */}
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-brand-navy-hero text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">The People Behind It</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">Our Team</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">
          The dedicated volunteers who plan, organise, and bring every {nameEn} event to life.
        </p>
      </div>

      <div className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-16">

          {!hasAny && (
            <>
              <SectionHeading label="Our Team" title="Meet the Team" className="mb-12" />
              <div className="bg-brand-cream rounded-2xl border border-dashed border-brand-orange/20 p-12 text-center">
                <div className="size-16 mx-auto rounded-full bg-brand-orange/10 flex items-center justify-center mb-4">
                  <User className="size-8 text-brand-orange/50" />
                </div>
                <h3 className="font-heading font-bold text-brand-navy text-lg mb-2">Team Details Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Our committee members will be listed here shortly. Please check back soon.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-white">
                <h3 className="font-semibold text-brand-navy mb-3">About Our Committee</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The {nameEn} committee is a group of dedicated volunteers from the {city}{' '}
                  community who work throughout the year to plan and execute all club events — from
                  our flagship Durga Puja to cultural programmes, sports, and community gatherings.
                  Every aspect, from fundraising to logistics, is handled with care and commitment.
                </p>
              </div>
            </>
          )}

          {/* Year committee */}
          {yearCommittee && (
            <section>
              <SectionHeading
                label="Club Committee"
                title={`${yearCommittee.yearLabel} Committee`}
                className="mb-10"
              />
              <MemberGrid members={yearCommittee.members} />
            </section>
          )}

          {/* Event-specific committees */}
          {eventCommittees.map((ec) => (
            <section key={ec.eventId}>
              <SectionHeading
                label={ec.eventYear ? `${ec.eventYear}` : 'Event Committee'}
                title={ec.eventName}
                className="mb-10"
              />
              <MemberGrid members={ec.members} />
            </section>
          ))}

          {/* Legacy fallback */}
          {legacyMembers.length > 0 && (
            <section>
              <SectionHeading label="Our Team" title="Meet the Team" className="mb-10" />
              <MemberGrid members={legacyMembers} />
            </section>
          )}

        </div>
      </div>
    </>
  )
}
