import Link from 'next/link'
import Image from 'next/image'
import { siteConfig } from '@/config/site'
import { publicNav } from '@/config/navigation'
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="bg-brand-navy text-white/80">
      {/* Wave divider */}
      <div className="w-full overflow-hidden leading-none">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden>
          <path d="M0 48V24C240 0 480 48 720 24C960 0 1200 48 1440 24V48H0Z" fill="oklch(0.23 0.092 264.5)" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/assets/branding/club-logo.jpeg"
                alt={`${siteConfig.nameEn} logo`}
                width={48}
                height={48}
                className="rounded-sm object-contain bg-white p-0.5"
              />
              <div>
                <p className="font-bengali font-bold text-xl text-white">{siteConfig.name}</p>
                <p className="text-xs text-white/50 tracking-widest uppercase">Kolaghat</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{siteConfig.description}</p>
            {(siteConfig.social.facebook || siteConfig.social.instagram || siteConfig.social.youtube) && (
              <div className="flex gap-3">
                {siteConfig.social.facebook && (
                  <SocialLink href={siteConfig.social.facebook} label="Facebook"><ExternalLink className="size-4" /></SocialLink>
                )}
                {siteConfig.social.instagram && (
                  <SocialLink href={siteConfig.social.instagram} label="Instagram"><ExternalLink className="size-4" /></SocialLink>
                )}
                {siteConfig.social.youtube && (
                  <SocialLink href={siteConfig.social.youtube} label="YouTube"><ExternalLink className="size-4" /></SocialLink>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="flex flex-col gap-2">
              {publicNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-brand-orange transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact</h3>
            <ul className="flex flex-col gap-3">
              {siteConfig.contact.address && (
                <li className="flex items-start gap-2 text-sm">
                  <MapPin className="size-4 text-brand-orange mt-0.5 shrink-0" />
                  <span>{siteConfig.contact.address}</span>
                </li>
              )}
              {siteConfig.contact.phone && (
                <li className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-brand-orange shrink-0" />
                  <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-brand-orange transition-colors">
                    {siteConfig.contact.phone}
                  </a>
                </li>
              )}
              {siteConfig.contact.email && (
                <li className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-brand-orange shrink-0" />
                  <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-brand-orange transition-colors">
                    {siteConfig.contact.email}
                  </a>
                </li>
              )}
              {!siteConfig.contact.phone && !siteConfig.contact.email && (
                <li className="text-sm text-white/40 italic">Contact details coming soon.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>© {new Date().getFullYear()} {siteConfig.fullName}. All rights reserved.</p>
          <Link href="/login" className="hover:text-white/70 transition-colors">
            Collector Portal
          </Link>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-brand-orange hover:text-white transition-all"
    >
      {children}
    </a>
  )
}
