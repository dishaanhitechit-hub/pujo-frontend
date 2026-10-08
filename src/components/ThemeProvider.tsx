'use client'

import { useEffect } from 'react'
import { getSiteConfig } from '@/lib/api/public'
import { applyThemeToDocument } from '@/lib/theme'

export function ThemeProvider() {
  useEffect(() => {
    getSiteConfig().then(cfg => {
      applyThemeToDocument(cfg?.theme ?? null)
    }).catch(() => {})
  }, [])

  return null
}
