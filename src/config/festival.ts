// ─────────────────────────────────────────────────────────────────────────────
// Shatadal Kolaghat — Annual Festival Configuration
//
// SINGLE SOURCE OF TRUTH for all festival-specific data.
// Club identity (name, location, contact, branding) lives in site.ts.
//
// ── ARCHITECTURE ─────────────────────────────────────────────────────────────
// festival.ts  →  countdown component / UI components  →  browser
//
// The UI never contains literal dates or year numbers.
// The interface is intentionally stable so a future calendar API or service
// could replace this file without changing any UI component:
//
//   current:  festival.ts → UI
//   future:   calendar-service/API → same FestivalConfig interface → UI
//
// ── HOW TO UPDATE FOR A NEW YEAR ─────────────────────────────────────────────
// Edit ONLY this file:
//   1. Update `year`
//   2. Update `countdownTarget` — exact IST datetime (include +05:30 offset)
//   3. Update `festivalEnd`     — IST datetime after Vijaya Dashami
//   4. Update `countdownLabel`  — label shown on the countdown widget
//   5. Update each day's `date` — confirm tithi-aligned dates with the club;
//      dates from the Hindu calendar can shift year to year
//   6. Run `npm run build` to verify — no UI component needs editing.
//
// ── TIMEZONE ─────────────────────────────────────────────────────────────────
// All datetimes MUST include the IST offset (+05:30).
// This ensures the countdown is accurate for visitors in any timezone.
// JavaScript's Date constructor treats strings without a timezone offset as
// LOCAL time (browser's OS timezone), which is unreliable for a site based
// in West Bengal but visited globally.
//
// CORRECT:   '2026-10-17T06:00:00+05:30'
// INCORRECT: '2026-10-17T06:00:00'  ← parsed as local time; wrong for non-IST visitors
//
// See PROJECT_STATUS.md → "Countdown Architecture" for full documentation.
// ─────────────────────────────────────────────────────────────────────────────

export type PujaDay = {
  /** Stable identifier — never changes year to year */
  key: 'mahasaptami' | 'mahashtami' | 'mahanavami' | 'vijaya_dashami'
  label: string
  emoji: string
  /**
   * ISO date 'YYYY-MM-DD' — Shatadal's club-specific schedule.
   * Display code must NOT parse this as UTC midnight;
   * use `new Date(date + 'T12:00:00+05:30')` or pass `timeZone: 'Asia/Kolkata'`
   * to avoid off-by-one rendering in non-IST environments.
   */
  date: string
  /** One-line summary used in homepage highlight cards */
  description: string
  /** Evocative narrative line used in the puja schedule page */
  highlight: string
  rituals: string[]
}

export type FestivalConfig = {
  year: number
  name: string
  /**
   * Human-readable label shown on the countdown widget.
   * Must stay in sync with what `countdownTarget` actually points to.
   * Example: 'Durga Puja Begins In'
   */
  countdownLabel: string
  /**
   * ISO datetime with explicit IST offset (+05:30).
   * The countdown widget counts down to this moment.
   * Typically set to the club's Mahasaptami morning.
   */
  countdownTarget: string
  /**
   * ISO datetime with explicit IST offset (+05:30).
   * After this, the site shows the post-festival completion state.
   * Typically the end of Vijaya Dashami.
   */
  festivalEnd: string
  days: readonly PujaDay[]
}

// ─────────────────────────────────────────────────────────────────────────────
// 2026 FESTIVAL DATA
//
// ⚠️  CONFIRM ACTUAL DATES WITH CLUB before launch.
//
// 2026 CALENDAR NOTES:
//   • Durga Puja 2026 has an unusual extended Saptami period due to tithi overlap.
//   • West Bengal official holidays confirm:
//       Oct 19 = Mahashtami
//       Oct 20 = Mahanavami
//       Oct 21 = Vijaya Dashami
//   • Mahasaptami: Oct 17, though the tithi spans into Oct 18 in some panchang.
//     Shatadal observes Oct 17 as Saptami — confirm with committee for final schedule.
//   • These dates were NOT taken from a generic template.
//     Source: West Bengal Govt. holiday list + 2026 Bengali panchang reference.
// ─────────────────────────────────────────────────────────────────────────────
export const festivalConfig: FestivalConfig = {
  year: 2026,
  name: 'Durga Puja',

  // Countdown label — must match what countdownTarget represents
  countdownLabel: 'Durga Puja Begins In',

  // IST offset (+05:30) is mandatory — see TIMEZONE note above
  countdownTarget: '2026-10-17T06:00:00+05:30', // Saptami morning, IST — confirm with club
  festivalEnd:     '2026-10-21T23:59:59+05:30', // After Vijaya Dashami, IST

  days: [
    {
      key: 'mahasaptami',
      label: 'Mahasaptami',
      emoji: '🌸',
      // Tithi spans Oct 17–18 in 2026; club schedule begins Oct 17
      date: '2026-10-17',
      description: 'The grand commencement of Durga Puja with Kalparambho and Bodhon rituals.',
      highlight: 'The awakening of the Goddess — the first day of her arrival.',
      rituals: ['Kalparambho', 'Nabapatrika Snan (Kolabou puja)', 'Saptami Puja', 'Bodhon', 'Aarati'],
    },
    {
      key: 'mahashtami',
      label: 'Mahashtami',
      emoji: '🙏',
      date: '2026-10-19', // West Bengal Govt. holiday
      description: 'The most sacred day — Kumari Puja, Sandhi Puja, and 108 lotus offerings.',
      highlight: 'The most sacred day — 108 lamps are lit at the holy Sandhi moment.',
      rituals: ['Kumari Puja', 'Pushpanjali (Thrice)', 'Sandhi Puja (108 lotus offerings)', 'Aarati'],
    },
    {
      key: 'mahanavami',
      label: 'Mahanavami',
      emoji: '🪔',
      date: '2026-10-20', // West Bengal Govt. holiday
      description: 'Dhunuchi naach, Hom yagya, and vibrant cultural performances.',
      highlight: 'Fire rituals and the magnificent Dhunuchi dance fill the night.',
      rituals: ['Navami Puja', 'Hom Yagya', 'Dhunuchi Naach', 'Cultural Programs', 'Evening Aarati'],
    },
    {
      key: 'vijaya_dashami',
      label: 'Vijaya Dashami',
      emoji: '🌊',
      date: '2026-10-21', // West Bengal Govt. holiday
      description: "Sindoor Khela, emotional farewell, and Ma Durga's immersion procession.",
      highlight: "The emotional farewell — Ma Durga returns to Kailash until next year.",
      rituals: ['Dashami Puja', 'Sindoor Khela', 'Bisarjan (Immersion)', 'Vijaya Congratulations'],
    },
  ],
}
