'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { festivalConfig } from '@/config/festival'

function fmtDate(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    ...opts,
    timeZone: 'Asia/Kolkata',
  })
}

export interface HeroSectionProps {
  /** Featured event name — overrides festivalConfig.name */
  eventName?: string
  /** Featured event year — overrides festivalConfig.year */
  year?: number | null
  /** YYYY-MM-DD start date — overrides first day from festivalConfig */
  startDate?: string | null
  /** YYYY-MM-DD end date — overrides last day from festivalConfig */
  endDate?: string | null
}

export function HeroSection({ eventName, year, startDate, endDate }: HeroSectionProps = {}) {
  const displayName = eventName ?? festivalConfig.name
  const displayYear = year ?? festivalConfig.year

  const firstDateStr = startDate ?? festivalConfig.days[0].date
  const lastDateStr  = endDate   ?? festivalConfig.days[festivalConfig.days.length - 1].date

  const displayStart = fmtDate(firstDateStr, { day: 'numeric', month: 'long' })
  const displayEnd   = fmtDate(lastDateStr,  { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section
      className="relative h-screen min-h-[600px] overflow-hidden"
      aria-label={`${siteConfig.nameEn} — ${displayName} ${displayYear}`}
    >
      {/* Rupnarayan River, Deulti — near Kolaghat. CC0 public domain. */}
      <Image
        src="/assets/branding/rupnarayan-hero.webp"
        alt="Rupnarayan River, near Kolaghat, West Bengal"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Cinematic overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(108deg, oklch(0.09 0.065 252 / 0.92) 0%, oklch(0.10 0.070 254 / 0.68) 36%, oklch(0.09 0.060 250 / 0.40) 62%, oklch(0.07 0.048 248 / 0.18) 100%)',
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full px-5 sm:px-9 lg:px-14 xl:px-16 pt-[72px] lg:pt-0">

          {/* Glass identity panel */}
          <div
            className="w-full max-w-[430px] lg:max-w-[490px]
                       rounded-2xl px-7 py-8 sm:px-9 sm:py-10
                       opacity-0 animate-[hero-reveal_1.1s_cubic-bezier(0.16,1,0.3,1)_0.25s_forwards]"
            style={{
              background: 'oklch(0.10 0.070 254 / 0.58)',
              backdropFilter: 'blur(24px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
              border: '1px solid oklch(1 0 0 / 0.08)',
              boxShadow:
                '0 8px 48px oklch(0.06 0.055 252 / 0.55), inset 0 1px 0 oklch(1 0 0 / 0.07)',
            }}
          >
            {/* Club logo + location */}
            <div className="flex items-center gap-3 mb-7">
              <Image
                src="/assets/branding/club-logo.jpeg"
                alt={siteConfig.nameEn}
                width={40}
                height={40}
                className="rounded-full ring-1 ring-white/15 shrink-0"
              />
              <p className="text-[9px] font-bold uppercase tracking-[0.30em] text-brand-orange/80">
                Kolaghat · Purba Medinipur
              </p>
            </div>

            {/* Primary identity */}
            <h1
              className="font-bengali font-bold text-white leading-[0.88] mb-2"
              style={{ fontSize: 'clamp(2.8rem, 5.2vw, 4rem)' }}
            >
              {siteConfig.name}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.44em] text-white/35 font-semibold mb-5">
              Shatadal · Kolaghat
            </p>
            <p className="text-[13px] text-white/50 leading-relaxed mb-8 max-w-[272px]">
              A community rooted in culture, tradition &amp; togetherness.
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-white/12 flex-1" />
              <div className="w-1 h-1 rotate-45 bg-brand-orange/50 shrink-0" />
            </div>

            {/* Featured event */}
            <div className="mb-7">
              <p className="text-[9px] font-bold uppercase tracking-[0.30em] text-brand-orange/62 mb-2.5">
                Currently Celebrating
              </p>
              <p
                className="font-heading font-bold text-white leading-tight mb-1.5"
                style={{ fontSize: 'clamp(1.2rem, 2.4vw, 1.6rem)' }}
              >
                {displayName}{!String(displayName).includes(String(displayYear)) ? ` ${displayYear}` : ''}
              </p>
              <p className="text-[12px] text-white/42 tracking-wide">
                {displayStart} – {displayEnd}
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/upcoming"
              className="group flex items-center justify-between gap-4
                         bg-brand-orange text-white
                         px-6 py-3.5
                         text-[13px] font-semibold tracking-wide
                         hover:bg-[oklch(0.62_0.19_38)] transition-colors duration-300"
            >
              <span>Upcoming Events</span>
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>

          </div>
        </div>
      </div>
    </section>
  )
}
