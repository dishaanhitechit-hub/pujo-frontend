import { AuthGuard } from '@/lib/auth/auth-guard'
import { AppSidebar } from '@/components/dashboard/AppSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-muted/30">
        <AppSidebar />
        {/* Main content — offset for sidebar */}
        <div className="flex-1 min-w-0 lg:pl-64">
          <main className="pt-14 lg:pt-0 min-h-screen">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
