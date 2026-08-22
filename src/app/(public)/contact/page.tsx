import type { Metadata } from 'next'
import { SectionHeading } from '@/components/public/SectionHeading'
import { siteConfig } from '@/config/site'
import { festivalConfig } from '@/config/festival'
import { getFeaturedEvent, getSiteConfig } from '@/lib/api/public'
import { MapPin, Phone, Mail, MessageCircle, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: 'Contact' }

export default async function ContactPage() {
  const [apiConfig, featured] = await Promise.all([getSiteConfig(), getFeaturedEvent()])

  // Merge API values with local fallbacks
  const phone    = apiConfig?.contact.phone    ?? siteConfig.contact.phone
  const email    = apiConfig?.contact.email    ?? siteConfig.contact.email
  const whatsapp = apiConfig?.contact.whatsapp ?? siteConfig.contact.whatsapp

  // Derive festival dates from featured event or fall back to festivalConfig
  const firstDate = featured?.days[0]?.date ?? featured?.startDate ?? festivalConfig.days[0].date
  const lastDate  = featured?.days[featured.days.length - 1]?.date ?? featured?.endDate ?? festivalConfig.days[festivalConfig.days.length - 1].date

  const startStr = new Date(firstDate + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata',
  })
  const endStr = new Date(lastDate + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata',
  })

  return (
    <>
      <div className="pt-32 pb-16 bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] text-center px-4">
        <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">Get in Touch</p>
        <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">Contact Us</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">Reach out to us for inquiries, contributions, or volunteering.</p>
      </div>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeading label="Contact" title="We'd Love to Hear From You" className="mb-12" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
            <ContactCard icon={MapPin} title="Address">
              <p>{siteConfig.contact.address}</p>
            </ContactCard>

            <ContactCard icon={Clock} title="Visit Us During Puja">
              <p>{startStr} – {endStr}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Open to all, dawn to dusk</p>
            </ContactCard>

            {phone ? (
              <ContactCard icon={Phone} title="Phone">
                <a href={`tel:${phone}`} className="hover:text-brand-orange transition-colors">
                  {phone}
                </a>
              </ContactCard>
            ) : (
              <ContactCard icon={Phone} title="Phone">
                <p className="text-muted-foreground/50 italic">Contact number coming soon</p>
              </ContactCard>
            )}

            {email ? (
              <ContactCard icon={Mail} title="Email">
                <a href={`mailto:${email}`} className="hover:text-brand-orange transition-colors">
                  {email}
                </a>
              </ContactCard>
            ) : (
              <ContactCard icon={Mail} title="Email">
                <p className="text-muted-foreground/50 italic">Email address coming soon</p>
              </ContactCard>
            )}

            {whatsapp && (
              <ContactCard icon={MessageCircle} title="WhatsApp">
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-orange transition-colors"
                >
                  {whatsapp}
                </a>
              </ContactCard>
            )}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-brand-orange/5 to-brand-pink/5 border border-brand-orange/15 p-8 text-center">
            <h3 className="font-heading font-bold text-brand-navy text-xl mb-3">Support Our Puja</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Want to contribute to Shatadal Durga Puja? Contact us for details about donations,
              sponsorships, or volunteering opportunities.
            </p>
            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=I%20would%20like%20to%20support%20Shatadal%20Durga%20Puja`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-6 py-3 text-white font-semibold text-sm hover:bg-brand-orange/90 transition-all"
              >
                <MessageCircle className="size-4" />
                Message on WhatsApp
              </a>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">Contact details will be updated soon.</p>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function ContactCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-border hover:border-brand-orange/20 transition-colors bg-white">
      <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
        <Icon className="size-5 text-brand-orange" />
      </div>
      <div>
        <p className="font-semibold text-brand-navy text-sm mb-1">{title}</p>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}
