import Link from 'next/link'
import Image from 'next/image'
import { siteConfig } from '@/config/site'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <Image
        src="/assets/branding/club-logo.jpeg"
        alt={siteConfig.nameEn}
        width={64}
        height={64}
        className="rounded-xl mb-6 opacity-60"
      />
      <p className="text-6xl font-heading font-bold text-brand-orange mb-2">404</p>
      <h1 className="font-heading font-bold text-2xl text-brand-navy mb-3">Page Not Found</h1>
      <p className="text-muted-foreground text-sm mb-8 max-w-xs">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-xl bg-brand-orange px-6 py-2.5 text-white font-semibold text-sm hover:bg-brand-orange/90 transition-all"
        >
          Go Home
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-brand-navy/20 px-6 py-2.5 text-brand-navy font-semibold text-sm hover:border-brand-orange/40 transition-all"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}
