import Image from 'next/image'
import Link from 'next/link'

/** Branded split layout shared by the login and forgot-password pages. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-brand-navy via-[oklch(0.25_0.09_264.5)] to-[oklch(0.2_0.08_264.5)] p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-brand-orange/5 blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-80 h-80 rounded-full bg-brand-pink/5 blur-3xl" />
        </div>
        <Link href="/" className="relative flex items-center gap-3">
          <Image src="/assets/branding/club-logo.jpeg" alt="Logo" width={44} height={44} className="rounded-lg bg-white/5 p-0.5" />
          <p className="font-bold text-white text-base tracking-wide">PujoPay</p>
        </Link>
        <div className="relative">
          <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">
            PujoPay
          </p>
          <h1 className="font-heading font-bold text-4xl text-white leading-tight mb-4">
            Member Portal
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            One place for collectors, admins, and committee members — manage donations,
            generate digital receipts, and keep the community&apos;s celebration running smoothly.
          </p>
        </div>
        <p className="relative text-white/25 text-xs">
          © {new Date().getFullYear()} PujoPay
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <Image src="/assets/branding/club-logo.jpeg" alt="Logo" width={36} height={36} className="rounded-md" />
            <p className="font-bold text-brand-navy">PujoPay</p>
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
