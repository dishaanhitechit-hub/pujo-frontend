'use client'

import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of inactivity.
 * Use this to gate API calls on free-text search inputs so the backend is not hit on
 * every keystroke.  Non-search filters (dropdowns, date pickers, etc.) should trigger
 * API calls immediately and do NOT need to go through this hook.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
