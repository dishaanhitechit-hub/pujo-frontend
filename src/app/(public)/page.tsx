import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { festivalConfig } from '@/config/festival'
import { CountdownTimer } from '@/components/public/CountdownTimer'
import { SectionHeading } from '@/components/public/SectionHeading'
import { HeroSection } from '@/components/public/hero/HeroSection'
import {
  Flower2, Star, Music, Users, MapPin, Heart, Calendar,
  ChevronRight, ExternalLink,
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <CountdownSection />
      <PujaSection />
      <EventsSection />
      <GallerySection />
      <CommunitySection />
      <ContributionCTA />
      <ContactSection />
    </>
  )
}

/* ── About ─────────────────────────────────────────────────────── */
function AboutSection() {
  const pillars = [
    { icon: Flower2, label: 'Tradition', desc: 'Decades of cultural heritage' },
    { icon: Heart, label: 'Devotion', desc: 'Spiritual celebrations' },
    { icon: Users, label: 'Community', desc: 'United in festivity' },
    { icon: Star, label: 'Excellence', desc: 'Premium pandal & programs' },
  ]

  return (
    <section className="py-20 lg:py-28 bg-white" aria-labelledby="about-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading
              label="Our Story"
              title={`শতদল — The Lotus`}
              subtitle="Like the lotus that blooms from still waters, Shatadal rises every year to celebrate Ma Durga with grandeur, devotion, and the collective spirit of the Kolaghat community."
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

/**
 * Format a 'YYYY-MM-DD' date string for display, pinned to IST (Asia/Kolkata).
 * We cannot rely on toLocaleDateString() alone because date-only ISO strings
 * are parsed as UTC midnight, which can show the previous day in non-IST
 * environments (including server-side rendering in Node.js).
 */
function fmtFestivalDate(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
  // Attach IST noon so UTC-equivalent is always within the same calendar day
  return new Date(dateStr + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    ...opts,
    timeZone: 'Asia/Kolkata',
  })
}

function CountdownSection() {
  const first = festivalConfig.days[0]
  const last  = festivalConfig.days[festivalConfig.days.length - 1]

  const firstDate = fmtFestivalDate(first.date, { day: 'numeric', month: 'long' })
  const lastDate  = fmtFestivalDate(last.date,  { day: 'numeric', month: 'long' })

  return (
    <section
      className="py-20 bg-gradient-to-br from-brand-navy via-[oklch(0.25_0.09_264.5)] to-[oklch(0.2_0.08_264.5)] relative overflow-hidden"
      aria-label={`Countdown to ${festivalConfig.name} ${festivalConfig.year}`}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-brand-orange/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
        {/* Year eyebrow — the only place year appears; driven by festivalConfig */}
        <p className="text-brand-orange/80 text-xs uppercase tracking-[0.25em] font-semibold mb-3">
          {festivalConfig.year}
        </p>
        {/* Heading names the festival; the countdown label (inside CountdownTimer)
            supplies the action phrase "…Begins In" so there is no duplication. */}
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-8">
          {festivalConfig.name}
        </h2>

        <CountdownTimer />

        {/* Footer dates — displayed in IST regardless of visitor's timezone */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-white/55">
          <span>{first.label} · {firstDate}</span>
          <span className="text-brand-orange/35">·</span>
          <span>{last.label} · {lastDate}</span>
        </div>
      </div>
    </section>
  )
}

/* ── Puja Highlights ───────────────────────────────────────────── */
function PujaSection() {
  const highlights = festivalConfig.days.map((day) => ({
    icon: day.emoji,
    title: day.label,
    date: new Date(day.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }),
    desc: day.description,
  }))

  return (
    <section className="py-20 lg:py-28 bg-[oklch(0.985_0.01_90)]" aria-labelledby="puja-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="The Celebration"
          title="Puja Schedule"
          subtitle="Four sacred days of rituals, culture, and devotion. Mark your calendar."
          className="mb-12"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {highlights.map(({ icon, title, date, desc }) => (
            <div
              key={title}
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
            href="/puja"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:gap-3 transition-all"
          >
            Full puja details <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Events ────────────────────────────────────────────────────── */
function EventsSection() {
  const events = [
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
            {events.map(({ icon, title, desc }) => {
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
function GallerySection() {
  const placeholders = [
    { label: 'Durga Idol', bg: 'from-brand-orange/20 to-brand-pink/20' },
    { label: 'Pandal', bg: 'from-brand-navy/20 to-brand-orange/10' },
    { label: 'Dhunuchi', bg: 'from-brand-pink/20 to-brand-green/10' },
    { label: 'Sindoor Khela', bg: 'from-brand-green/10 to-brand-orange/20' },
    { label: 'Immersion', bg: 'from-brand-navy/15 to-brand-pink/15' },
    { label: 'Anjali', bg: 'from-brand-orange/15 to-brand-navy/10' },
  ]

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
          {placeholders.map(({ label, bg }) => (
            <div
              key={label}
              className={`group relative aspect-square rounded-2xl bg-gradient-to-br ${bg} border border-white/10 overflow-hidden flex items-end p-4 cursor-pointer hover:scale-[1.02] transition-transform`}
            >
              <div className="absolute inset-0 bg-brand-navy/30 group-hover:bg-brand-navy/20 transition-colors" />
              <p className="relative text-xs text-white/70 font-medium">{label}</p>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 text-6xl pointer-events-none">
                🪷
              </div>
              <p className="absolute top-3 right-3 text-[10px] text-white/30 italic">Photo coming soon</p>
            </div>
          ))}
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
function CommunitySection() {
  const stats = [
    { value: '50+', label: 'Years of celebration' },
    { value: '5000+', label: 'Community members' },
    { value: '4 Days', label: 'Of festivities' },
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
          <p className="text-white/70 text-xs uppercase tracking-widest mb-3">Support the Celebration</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-4">
            Be Part of Shatadal
          </h2>
          <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Your contribution helps us celebrate Ma Durga with the grandeur and devotion she deserves.
            Every donation, big or small, strengthens our community.
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
function ContactSection() {
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
                <p className="font-semibold text-brand-navy text-sm">Puja Dates {festivalConfig.year}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {new Date(festivalConfig.days[0].date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}
                  {' – '}
                  {new Date(festivalConfig.days[festivalConfig.days.length - 1].date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
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
