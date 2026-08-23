'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EventExpensesRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/admin/expenses?eventId=${id}`)
  }, [id, router])

  return null
}
