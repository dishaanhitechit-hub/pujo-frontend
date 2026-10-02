import type { MemberCategory } from '@/types'

/** Membership tiers — independent of permission `role`. Order = display order. */
export const MEMBER_CATEGORIES: MemberCategory[] = [
  'lifetime_executive',
  'premium_executive',
  'executive',
  'general',
]

export const MEMBER_CATEGORY_LABELS: Record<MemberCategory, string> = {
  lifetime_executive: 'Lifetime Executive Member',
  premium_executive:  'Premium Executive Member',
  executive:          'Executive Member',
  general:            'General Member',
}
