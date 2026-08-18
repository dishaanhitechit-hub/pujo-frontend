'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { publicNav } from '@/config/navigation'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 32)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  /*
   * Unscrolled:
   *   Homepage → dark navy bg (needed because the right hero panel is cream;
   *              transparent nav would put white text on cream = invisible).
   *   Other pages → transparent (their hero areas are dark navy).
   * Scrolled → solid white for all pages.
   */
  const navBg = scrolled
    ? 'bg-white/97 backdrop-blur-md shadow-sm border-b border-brand-orange/8'
    : isHome
      ? 'bg-brand-navy/88 backdrop-blur-sm'
      : 'bg-transparent'

  const linkColor = scrolled
    ? 'text-brand-navy/75 hover:text-brand-orange hover:bg-brand-orange/5'
    : 'text-white/85 hover:text-white hover:bg-white/10'

  const logoTextColor = scrolled ? 'text-brand-navy' : 'text-white'

  const ctaClass = scrolled
    ? 'border-brand-navy/[0.15] text-brand-navy/[0.6] bg-brand-navy/[0.03] hover:border-brand-orange hover:text-brand-orange hover:bg-brand-orange/[0.05]'
    : 'border-white/20 text-white/70 bg-white/[0.04] hover:border-white/45 hover:text-white hover:bg-white/[0.09]'

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        navBg,
      )}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-6">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label={siteConfig.fullName}
          >
            <Image
              src="/assets/branding/club-logo.jpeg"
              alt={`${siteConfig.nameEn} logo`}
              width={38}
              height={38}
              className={cn(
                'rounded-sm object-contain transition-opacity duration-200',
                scrolled ? 'ring-1 ring-brand-navy/10' : '',
              )}
              priority
            />
            <div>
              <span className={cn('font-bengali font-bold text-[1.15rem] leading-tight transition-colors', logoTextColor)}>
                {siteConfig.name}
              </span>
              <p className={cn('text-[9px] uppercase tracking-[0.22em] leading-none transition-colors', scrolled ? 'text-brand-navy/30' : 'text-white/30')}>
                Kolaghat
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center" aria-label="Main navigation">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3.5 py-2 text-[13px] font-medium rounded-md transition-all',
                  linkColor,
                  pathname === item.href
                    ? scrolled
                      ? 'text-brand-orange font-semibold'
                      : 'text-white font-semibold'
                    : '',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side: CTA + mobile toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className={cn(
                'hidden sm:inline-flex items-center rounded border text-[11px] font-semibold tracking-[0.12em] uppercase px-[14px] py-[7px] transition-all duration-200',
                ctaClass,
              )}
            >
              Member Login
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              className={cn(
                'md:hidden flex items-center justify-center w-9 h-9 rounded-md transition-colors',
                scrolled ? 'text-brand-navy hover:bg-brand-navy/5' : 'text-white hover:bg-white/10',
              )}
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-brand-orange/8 shadow-lg">
          <nav className="px-5 py-4 flex flex-col gap-0.5" aria-label="Mobile navigation">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                  pathname === item.href
                    ? 'text-brand-orange font-semibold bg-brand-orange/5'
                    : 'text-brand-navy hover:bg-brand-orange/5 hover:text-brand-orange',
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-border">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block w-full text-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-orange border border-brand-orange/25 rounded hover:bg-brand-orange hover:border-brand-orange hover:text-white transition-all duration-200"
              >
                Member Login
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
