import { SiteHeader } from '@/components/public/SiteHeader'
import { SiteFooter } from '@/components/public/SiteFooter'
import { getSiteConfig, mediaUrl } from '@/lib/api/public'
import { buildThemeStyle } from '@/lib/theme'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const cfg = await getSiteConfig()
  const club = cfg?.club
  const themeStyle = buildThemeStyle(cfg?.theme ?? null)

  function resolveUrl(url: string | null | undefined): string | null {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url
    return mediaUrl(url)
  }

  return (
    <>
      {themeStyle && <style dangerouslySetInnerHTML={{ __html: themeStyle }} />}
      <SiteHeader
        clubLogoUrl={resolveUrl(club?.logoUrl)}
        clubNameVernacular={club?.nameVernacular ?? null}
        clubNameEn={club?.nameEn ?? null}
        clubTagline={club?.tagline ?? null}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}
