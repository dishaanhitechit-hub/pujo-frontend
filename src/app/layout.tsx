import type { Metadata } from 'next'
import type React from 'react'
import { Geist, Geist_Mono, Playfair_Display, Noto_Sans_Bengali } from 'next/font/google'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth/auth-provider'
import './globals.css'
import { festivalConfig } from '@/config/festival'
import { getSiteConfig } from '@/lib/api/public'
import { buildThemeStyle } from '@/lib/theme'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

const playfair = Playfair_Display({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
})

const notoSansBengali = Noto_Sans_Bengali({
  variable: '--font-bengali',
  subsets: ['bengali'],
  weight: ['400', '700'],
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getSiteConfig()
  const club = cfg?.club

  const nameEn    = club?.nameEn    ?? ''
  const tagline   = club?.tagline   ?? null
  const fullName  = nameEn
    ? (tagline ? `${nameEn}, ${tagline}` : nameEn)
    : null
  const description = club?.metaDescription ?? club?.description ?? undefined
  const siteUrl   = club?.siteUrl   ?? null
  const ogImage   = club?.ogImageUrl ?? null

  const defaultTitle = nameEn
    ? `${nameEn}${tagline ? ` ${tagline} — ` : ' — '}${festivalConfig.name} ${festivalConfig.year}`
    : `${festivalConfig.name} ${festivalConfig.year}`

  return {
    title: {
      default: defaultTitle,
      template: nameEn ? `%s | ${nameEn}` : '%s',
    },
    description,
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    openGraph: {
      title: defaultTitle,
      description,
      ...(fullName ? { siteName: fullName } : {}),
      locale: 'en_IN',
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cfg = await getSiteConfig()
  const themeStyle = buildThemeStyle(cfg?.theme ?? null)

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${notoSansBengali.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {themeStyle && (
          <style precedence="default" href="org-theme-override">
            {themeStyle}
          </style>
        )}
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 4000 }}
        />
      </body>
    </html>
  )
}
