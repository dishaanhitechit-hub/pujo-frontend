import Link from 'next/link'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="size-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <ShieldOff className="size-8 text-destructive" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-sm mb-6">
          You do not have permission to view this page.
        </p>
        <Button asChild variant="outline">
          <Link href="/collect">Go to Home</Link>
        </Button>
      </div>
    </div>
  )
}
