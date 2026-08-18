import type { Metadata } from 'next'
import type React from 'react'
import { Geist, Geist_Mono, Playfair_Display, Noto_Sans_Bengali } from 'next/font/google'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth/auth-provider'
import './globals.css'
import { siteConfig } from '@/config/site'
import { festivalConfig } from '@/config/festival'

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

const defaultTitle = `${siteConfig.nameEn} Kolaghat — ${festivalConfig.name} ${festivalConfig.year}`

export const metadata: Metadata = {
  title: {
    default: defaultTitle,
    template: `%s | ${siteConfig.nameEn}`,
  },
  description: siteConfig.meta.description,
  metadataBase: new URL(siteConfig.meta.url),
  openGraph: {
    title: defaultTitle,
    description: siteConfig.meta.description,
    siteName: siteConfig.fullName,
    locale: 'en_IN',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${notoSansBengali.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
