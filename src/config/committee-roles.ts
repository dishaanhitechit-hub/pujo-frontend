import type { CommitteeRole } from '@/types'

/** Assignable committee positions, in seniority/display order. */
export const COMMITTEE_ROLES: CommitteeRole[] = [
  'chairman',
  'president',
  'vice_president',
  'secretary',
  'joint_secretary',
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
  joint_secretary:  'Joint Secretary',
  treasurer:        'Treasurer',
  accountant:       'Accountant',
  advisory_member:  'Advisory Member',
  member:           'Member',
}
