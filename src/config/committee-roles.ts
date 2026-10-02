import type { CommitteeRole } from '@/types'

/** Assignable committee positions, in seniority/display order. */
export const COMMITTEE_ROLES: CommitteeRole[] = [
  'chairman',
  'president',
  'vice_president',
  'secretary',
  'junior_secretary',
  'treasurer',
  'accountant',
  'advisory_member',
  'member',
]

export const COMMITTEE_ROLE_LABELS: Record<CommitteeRole, string> = {
  chairman:         'Chairman',
  president:        'President',
  vice_president:   'Vice President',
  secretary:        'Secretary',
  junior_secretary: 'Junior Secretary',
  treasurer:        'Treasurer',
  accountant:       'Accountant',
  advisory_member:  'Advisory Member',
  member:           'Member',
}
