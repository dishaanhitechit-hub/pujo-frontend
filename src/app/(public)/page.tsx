import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { festivalConfig } from '@/config/festival'
import { getFeaturedEvent, listPublicGallery, getPublicStats, mediaUrl } from '@/lib/api/public'
import Image from 'next/image'
import type { PublicGalleryImage } from '@/types'
import { CountdownTimer } from '@/components/public/CountdownTimer'
import { SectionHeading } from '@/components/public/SectionHeading'
import { HeroSection } from '@/components/public/hero/HeroSection'
import type { PublicEventDay } from '@/types'
import {
  Flower2, Star, Music, Users, MapPin, Heart, Calendar,
  ChevronRight, ExternalLink,
} from 'lucide-react'

// Stable emoji mapping for known puja day keys — no yearly code changes needed.
const DAY_EMOJI: Record<string, string> = {
  mahasaptami:    '🌸',
  mahashtami:     '🙏',
  mahanavami:     '🪔',
  vijaya_dashami: '🌊',
}
function dayEmoji(key: string) { return DAY_EMOJI[key] ?? '🪷' }

/** Format a YYYY-MM-DD date pinned to IST to avoid off-by-one in UTC environments. */
function fmtFestivalDate(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    ...opts,
    timeZone: 'Asia/Kolkata',
  })
}

/** Derive a countdown target ISO string from featured event data. */
function countdownTarget(days: PublicEventDay[], startDate: string | null): string {
  const firstDate = days[0]?.date ?? startDate
  return firstDate ? firstDate + 'T06:00:00+05:30' : festivalConfig.countdownTarget
}

/** Derive a countdown end ISO string from featured event data. */
function countdownEnd(days: PublicEventDay[], endDate: string | null): string {
  const lastDate = days[days.length - 1]?.date ?? endDate
  return lastDate ? lastDate + 'T23:59:59+05:30' : festivalConfig.festivalEnd
}

export default async function HomePage() {
  const [featured, galleryResult, stats] = await Promise.all([
    getFeaturedEvent(),
    listPublicGallery(),
    getPublicStats(),
  ])
  const galleryImages = galleryResult?.images.slice(0, 6) ?? []

  const heroProps = featured
    ? {
        eventName: featured.name,
        year:      featured.year,
        startDate: featured.days[0]?.date ?? featured.startDate,
        endDate:   featured.days[featured.days.length - 1]?.date ?? featured.endDate,
      }
    : {}

  const cdTarget = featured
    ? countdownTarget(featured.days, featured.startDate)
    : festivalConfig.countdownTarget
  const cdEnd = featured
    ? countdownEnd(featured.days, featured.endDate)
    : festivalConfig.festivalEnd
  const cdName  = featured?.name   ?? festivalConfig.name

  const activeDays = featured?.days?.length ? featured.days : null

  return (
    <>
      <HeroSection {...heroProps} />
      <AboutSection />
      <CountdownSection
        targetISO={cdTarget}
        endISO={cdEnd}
        festivalName={cdName}
        year={featured?.year ?? festivalConfig.year}
        days={activeDays}
        fallbackDays={festivalConfig.days}
      />
      <PujaSection days={activeDays} />
      <EventsSection />
      <GallerySection images={galleryImages} />
      <CommunitySection
        donorCount={stats?.donorCount ?? null}
        oldestYear={stats?.oldestYear ?? null}
        festivalDays={activeDays?.length ?? null}
      />
      <ContributionCTA />
      <ContactSection
        startDate={featured?.days[0]?.date ?? featured?.startDate ?? null}
        endDate={featured?.days[featured?.days.length - 1]?.date ?? featured?.endDate ?? null}
        year={featured?.year ?? festivalConfig.year}
        eventName={featured?.name ?? null}
      />
    </>
  )
}

/* ── About ─────────────────────────────────────────────────────── */
function AboutSection() {
  const pillars = [
    { icon: Flower2, label: 'Tradition', desc: 'Decades of cultural heritage' },
    { icon: Heart,   label: 'Devotion',  desc: 'Spiritual celebrations' },
    { icon: Users,   label: 'Community', desc: 'United in festivity' },
    { icon: Star,    label: 'Excellence',desc: 'Artful pandal & cultural shows' },
  ]

  return (
    <section className="py-20 lg:py-28 bg-white" aria-labelledby="about-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading
              label="Our Story"
              title={`শতদল — The Lotus`}
              subtitle="Like the lotus that blooms from still waters, Shatadal blooms every year to celebrate Ma Durga with grandeur, devotion, and the collective spirit of the Kolaghat community."
              align="left"
            />
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Rooted in the cultural heartland of Purba Medinipur, our Durga Puja is more than a
              festival — it is an expression of identity, community, and faith that brings
              generations together every autumn.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:gap-3 transition-all"
            >
              Read our full story <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {pillars.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="group p-5 rounded-2xl border border-border bg-white hover:border-brand-orange/30 hover:shadow-md hover:shadow-brand-orange/5 transition-all"
              >
                <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center mb-3 group-hover:bg-brand-orange/15 transition-colors">
                  <Icon className="size-5 text-brand-orange" />
                </div>
                <p className="font-semibold text-brand-navy text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Countdown ─────────────────────────────────────────────────── */
function CountdownSection({
  targetISO,
  endISO,
  festivalName,
  year,
  days,
  fallbackDays,
}: {
  targetISO: string
  endISO: string
  festivalName: string
  year: number
  days: PublicEventDay[] | null
  fallbackDays: typeof festivalConfig.days
}) {
  const firstDay = days?.[0]
  const lastDay  = days?.[days.length - 1]

  const firstDate = firstDay?.date
    ? fmtFestivalDate(firstDay.date, { day: 'numeric', month: 'long' })
    : fmtFestivalDate(fallbackDays[0].date, { day: 'numeric', month: 'long' })

  const lastDate = lastDay?.date
    ? fmtFestivalDate(lastDay.date, { day: 'numeric', month: 'long' })
    : fmtFestivalDate(fallbackDays[fallbackDays.length - 1].date, { day: 'numeric', month: 'long' })

  const firstLabel = firstDay?.label ?? fallbackDays[0].label
  const lastLabel  = lastDay?.label  ?? fallbackDays[fallbackDays.length - 1].label

  return (
    <section
      className="py-20 bg-gradient-to-br from-brand-navy via-[oklch(0.25_0.09_264.5)] to-[oklch(0.2_0.08_264.5)] relative overflow-hidden"
      aria-label={`Countdown to ${festivalName} ${year}`}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-brand-orange/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <p className="text-brand-orange/80 text-xs uppercase tracking-[0.25em] font-semibold mb-3">
          {year}
        </p>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-8">
          {festivalName}
        </h2>

        <CountdownTimer
          targetISO={targetISO}
          endISO={endISO}
          festivalName={festivalName}
          label={`${festivalName} Begins In`}
        />

        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-white/55">
          <span>{firstLabel} · {firstDate}</span>
          <span className="text-brand-orange/35">·</span>
          <span>{lastLabel} · {lastDate}</span>
        </div>
      </div>
    </section>
  )
}

/* ── Puja Highlights ───────────────────────────────────────────── */
function PujaSection({ days }: { days: PublicEventDay[] | null }) {
  const highlights = days?.length
    ? days.map((day) => ({
        id:   day.key,
        icon: dayEmoji(day.key),
        title: day.label,
        date: day.date
          ? new Date(day.date + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
              weekday: 'long', month: 'long', day: 'numeric',
            })
          : '',
        desc: day.description ?? '',
      }))
    : festivalConfig.days.map((day) => ({
        id:   day.key,
        icon: day.emoji,
        title: day.label,
        date: new Date(day.date + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
          weekday: 'long', month: 'long', day: 'numeric',
        }),
        desc: day.description,
      }))

  return (
    <section className="py-20 lg:py-28 bg-[oklch(0.985_0.01_90)]" aria-labelledby="puja-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="The Celebration"
          title="Event Schedule"
          subtitle={`${highlights.length} sacred day${highlights.length !== 1 ? 's' : ''} of rituals, culture, and devotion. Mark your calendar.`}
          className="mb-12"
        />

        <div className={`grid grid-cols-1 gap-5 ${
          highlights.length <= 2
            ? 'sm:grid-cols-2 max-w-2xl mx-auto'
            : highlights.length === 3
            ? 'sm:grid-cols-2 lg:grid-cols-3'
            : 'sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {highlights.map(({ id, icon, title, date, desc }) => (
            <div
              key={id}
              className="group relative p-6 bg-white rounded-2xl shadow-sm border border-border hover:shadow-md hover:border-brand-orange/20 transition-all"
            >
              <div className="text-3xl mb-4">{icon}</div>
              <div className="h-0.5 w-8 bg-brand-orange rounded-full mb-4" />
              <h3 className="font-heading font-bold text-brand-navy text-lg mb-1">{title}</h3>
              <p className="text-xs text-brand-orange font-medium mb-3">{date}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/upcoming"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:gap-3 transition-all"
          >
            Full event details <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Events ────────────────────────────────────────────────────── */
function EventsSection() {
  const programs = [
    { icon: Music, title: 'Cultural Programs', desc: 'An evening of music, dance, and theatrical performances by talented artists from Kolaghat and beyond.' },
    { icon: '🥁' as const, title: 'Dhunuchi Naach', desc: 'The mesmerising traditional dance with earthen incense pots, a symbol of devotion to Ma Durga.' },
    { icon: '🍽️' as const, title: 'Community Feast', desc: 'Traditional Bengali cuisine served to all — bhog prasad, sweets, and more through the festive days.' },
    { icon: Users, title: 'Procession', desc: 'The grand Vijaya Dashami immersion procession through Kolaghat, a sight of colour and emotion.' },
  ]

  return (
    <section className="py-20 lg:py-28 bg-white" aria-labelledby="events-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <SectionHeading
            label="What's Happening"
            title="Events & Programs"
            subtitle="Beyond the rituals, Shatadal brings a rich program of cultural events for the whole community."
            align="left"
            className="lg:sticky lg:top-24"
          />

          <div className="flex flex-col gap-5">
            {programs.map(({ icon, title, desc }) => {
              const IconComp = typeof icon !== 'string' ? icon : null
              return (
                <div key={title} className="group flex items-start gap-4 p-5 rounded-xl bg-[oklch(0.985_0.01_90)] border border-transparent hover:border-brand-orange/20 hover:bg-white transition-all">
                  <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                    {typeof icon === 'string'
                      ? <span className="text-xl">{icon}</span>
                      : IconComp && <IconComp className="size-5 text-brand-orange" />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-navy text-sm mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link href="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:gap-3 transition-all">
            All events <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Gallery Preview ───────────────────────────────────────────── */
const GALLERY_PLACEHOLDERS = [
  { label: 'Durga Idol',   bg: 'from-brand-orange/20 to-brand-pink/20' },
  { label: 'Pandal',       bg: 'from-brand-navy/20 to-brand-orange/10' },
  { label: 'Dhunuchi',     bg: 'from-brand-pink/20 to-brand-green/10' },
  { label: 'Sindoor Khela',bg: 'from-brand-green/10 to-brand-orange/20' },
  { label: 'Immersion',    bg: 'from-brand-navy/15 to-brand-pink/15' },
  { label: 'Anjali',       bg: 'from-brand-orange/15 to-brand-navy/10' },
]

function GallerySection({ images }: { images: PublicGalleryImage[] }) {
  const hasImages = images.length > 0

  return (
    <section className="py-20 lg:py-28 bg-brand-navy relative overflow-hidden" aria-labelledby="gallery-heading">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-orange/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-brand-pink/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Memories"
          title="Gallery"
          subtitle="Glimpses of our celebrations across the years."
          inverted
          className="mb-12"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {hasImages
            ? images.map((item) => {
                const src = mediaUrl(item.url)
                return (
                  <Link
                    key={item.id}
                    href={`/events/${item.event.slug}`}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:scale-[1.02] transition-transform"
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt={item.altText ?? item.event.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl text-white/10">🪷</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                      <p className="text-[11px] font-semibold text-white line-clamp-1">{item.event.name}</p>
                    </div>
                  </Link>
                )
              })
            : GALLERY_PLACEHOLDERS.map(({ label, bg }) => (
                <div
                  key={label}
                  className={`group relative aspect-square rounded-2xl bg-gradient-to-br ${bg} border border-white/10 overflow-hidden flex items-end p-4`}
                >
                  <div className="absolute inset-0 bg-brand-navy/30" />
                  <p className="relative text-xs text-white/70 font-medium">{label}</p>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 text-6xl pointer-events-none">
                    🪷
                  </div>
                </div>
              ))
          }
        </div>

        <div className="text-center mt-10">
          <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:gap-3 transition-all">
            View full gallery <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Community ─────────────────────────────────────────────────── */
function CommunitySection({
  donorCount,
  oldestYear,
  festivalDays,
}: {
  donorCount: number | null
  oldestYear: number | null
  festivalDays: number | null
}) {
  const currentYear = new Date().getFullYear()

  const startYear = oldestYear ?? festivalConfig.foundingYear
  const yearsCount = Math.max(1, currentYear - startYear)

  const stats = [
    {
      value: `${yearsCount}+`,
      label: 'Years of celebration',
    },
    {
      value: donorCount !== null ? (donorCount > 999 ? `${(donorCount / 1000).toFixed(1)}k+` : `${donorCount}+`) : '—',
      label: 'Community donors',
    },
    {
      value: festivalDays !== null ? `${festivalDays} Day${festivalDays !== 1 ? 's' : ''}` : '4 Days',
      label: 'Of festivities',
    },
    { value: '∞', label: 'Devotion' },
  ]

  return (
    <section className="py-20 bg-brand-pink-light" aria-label="Community statistics">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Our Community"
          title="United in Devotion"
          subtitle="Shatadal Kolaghat is not just a Puja — it is a family that grows stronger every year."
          className="mb-12"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-heading font-bold text-4xl sm:text-5xl text-brand-orange">{value}</p>
              <p className="text-sm text-muted-foreground mt-2">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Contribution CTA ──────────────────────────────────────────── */
function ContributionCTA() {
  return (
    <section className="py-20 lg:py-28 bg-white" aria-label="Contribution call to action">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-brand-orange via-[oklch(0.62_0.2_30)] to-[oklch(0.58_0.22_25)] p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-0 right-0 text-white/5 text-9xl pointer-events-none select-none rotate-12">🪷</div>
          </div>
          <p className="text-white/70 text-xs uppercase tracking-widest mb-3">Support Our Community</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-4">
            Be Part of Shatadal
          </h2>
          <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Your support keeps our celebrations alive — grand, joyful, and rooted in the spirit of Kolaghat.
            Every contribution, big or small, makes a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-brand-orange font-semibold text-sm hover:bg-brand-cream transition-all shadow-lg"
            >
              <Heart className="size-4" />
              Contribute
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-8 py-3.5 text-white font-semibold text-sm hover:bg-white/10 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Contact ───────────────────────────────────────────────────── */
function ContactSection({
  startDate,
  endDate,
  year,
  eventName,
}: {
  startDate: string | null
  endDate: string | null
  year: number
  eventName: string | null
}) {
  const start = startDate
    ? new Date(startDate + 'T12:00:00+05:30').toLocaleDateString('en-IN', { month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })
    : new Date(festivalConfig.days[0].date + 'T12:00:00+05:30').toLocaleDateString('en-IN', { month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })

  const end = endDate
    ? new Date(endDate + 'T12:00:00+05:30').toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : new Date(festivalConfig.days[festivalConfig.days.length - 1].date + 'T12:00:00+05:30').toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })

  return (
    <section className="py-20 bg-[oklch(0.985_0.01_90)]" aria-labelledby="contact-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <SectionHeading
            label="Find Us"
            title="Visit Shatadal"
            subtitle="Come celebrate with us in Kolaghat during the festive season."
            align="left"
          />

          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-border">
              <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                <MapPin className="size-5 text-brand-orange" />
              </div>
              <div>
                <p className="font-semibold text-brand-navy text-sm">Address</p>
                <p className="text-sm text-muted-foreground mt-0.5">{siteConfig.contact.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-border">
              <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                <Calendar className="size-5 text-brand-orange" />
              </div>
              <div>
                <p className="font-semibold text-brand-navy text-sm">{eventName ?? 'Event Dates'}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {start} – {end}
                </p>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-8 py-3.5 text-white font-semibold text-sm hover:bg-brand-orange/90 transition-all w-full sm:w-auto"
            >
              <ExternalLink className="size-4" />
              Get Directions & Contact
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
