// Festival configuration — all org-specific data comes from the API (featured event).
// This file provides the TYPE definitions and a neutral empty fallback used when
// no featured event is configured for the org.
//
// ── DATA FLOW ────────────────────────────────────────────────────────────────
//   Featured event in DB  →  API  →  UI components  (primary, per-org)
//   festivalConfig below  →  UI components          (fallback — neutral empty state)
//
// ── HOW TO ADD FESTIVAL DATA ─────────────────────────────────────────────────
// Do NOT edit the data in this file. All festival data (name, year, dates,
// puja days, descriptions, countdown target) must be configured through the
// admin panel → Events → mark as Featured.
// ─────────────────────────────────────────────────────────────────────────────

export type PujaDay = {
  /** Stable identifier — never changes year to year */
  key: 'mahasaptami' | 'mahashtami' | 'mahanavami' | 'vijaya_dashami' | string
  label: string
  emoji: string
  /** ISO date 'YYYY-MM-DD'. Use `new Date(date + 'T12:00:00+05:30')` to avoid UTC off-by-one. */
  date: string
  /** One-line summary shown in homepage highlight cards */
  description: string
  /** Evocative narrative shown in the event schedule page */
  highlight: string
  rituals: string[]
}

export type FestivalConfig = {
  year: number
  name: string
  /** Year the club was founded — used for "X+ years of celebration". null = not configured. */
  foundingYear: number | null
  /** Label shown above the countdown digits. */
  countdownLabel: string
  /**
   * ISO datetime with explicit IST offset (+05:30), or null when no event is configured.
   * When null the countdown section is hidden.
   */
  countdownTarget: string | null
  /**
   * ISO datetime with explicit IST offset (+05:30), or null when no event is configured.
   * After this the site shows a post-festival state.
   */
  festivalEnd: string | null
  days: readonly PujaDay[]
}

// ─────────────────────────────────────────────────────────────────────────────
// NEUTRAL FALLBACK — shown when no featured event exists for the org.
// No org-specific dates, names, or descriptions here.
// ─────────────────────────────────────────────────────────────────────────────
export const festivalConfig: FestivalConfig = {
  year:           new Date().getFullYear(),
  name:           'Festival',
  foundingYear:   null,
  countdownLabel: 'Festival Begins In',
  countdownTarget: null,
  festivalEnd:     null,
  days:            [],
}
