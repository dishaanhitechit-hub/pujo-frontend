import { AuthGuard } from '@/lib/auth/auth-guard'
import { AppSidebar } from '@/components/dashboard/AppSidebar'
import { getSiteConfig } from '@/lib/api/public'
import { buildThemeStyle } from '@/lib/theme'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cfg = await getSiteConfig()
  const themeStyle = buildThemeStyle(cfg?.theme ?? null)

  return (
    <>
      {themeStyle && <style dangerouslySetInnerHTML={{ __html: themeStyle }} />}
      <AuthGuard>
        <div className="flex min-h-screen bg-muted/30">
          <AppSidebar />
          <div className="flex-1 min-w-0 lg:pl-64">
            <main className="pt-14 lg:pt-0 min-h-screen">{children}</main>
          </div>
        </div>
      </AuthGuard>
    </>
  )
}
