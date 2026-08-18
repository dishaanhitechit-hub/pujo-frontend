# Project Status

**Last Updated:** 2026-08-17
**Phase:** 13 — Glassmorphism Hero Redesign

---

## Completed

- [x] Next.js 16.3.1 initialized (TypeScript, Tailwind v4, App Router, src dir)
- [x] shadcn/ui 4.18.0 initialized (Radix UI base, Nova preset)
- [x] All production dependencies installed (axios, sonner, lucide-react, react-hook-form, zod, @hookform/resolvers, recharts)
- [x] Logo copied to `public/assets/branding/club-logo.jpeg`
- [x] Public asset directory structure created
- [x] Brand palette (orange, navy, pink, green) in Tailwind v4 CSS variables
- [x] Root layout with Playfair Display, Geist, Noto Sans Bengali, Sonner
- [x] Config files: site.ts, roles.ts, navigation.ts, api.ts
- [x] TypeScript types: all API entities
- [x] API layer: client.ts + all 6 modules (auth, users, payments, collector, dashboard, admin)
- [x] Auth system: AuthProvider, useAuth, AuthGuard, RoleGuard, permissions
- [x] Token storage: lib/storage
- [x] Public website: Home, About, Puja, Events, Gallery, Committee, Contact pages
- [x] Public layout: SiteHeader (responsive, scroll-aware), SiteFooter
- [x] Countdown timer (live, client-side)
- [x] Login page (split layout, react-hook-form + zod, error toast)
- [x] App layout (AuthGuard + AppSidebar with role-based nav)
- [x] Collector: /app/collect (payment form, UPI/cash method selector, redirect to backend)
- [x] Collector: /app/my-collections (summary stats + paginated payments table)
- [x] Executive/Admin: /app/dashboard (summary stats, Recharts bar chart, collector table, payments table)
- [x] Admin: /app/payments (all payments, method + status filters, pagination)
- [x] Admin: /app/admin/users (user list, create modal, deactivate)
- [x] Admin: /app/admin/config (UPI ID + org name settings form)
- [x] Profile page (/app/profile)
- [x] Forbidden page (/app/forbidden)
- [x] 404 page (not-found.tsx)
- [x] ARCHITECTURE.md
- [x] .env.example

---

## Completed (continued)

- [x] Build verification: `npm run build` passes (17 routes, 0 errors)
- [x] TypeScript: `tsc --noEmit` passes (0 errors)
- [x] Visual QA: Homepage, About, Events, Login, Footer verified in browser
- [x] Auth guard: unauthenticated `/dashboard` → `/login` redirect confirmed
- [x] Deleted stale `src/app/page.tsx` (default Next.js starter shadowing `(public)/page.tsx`)

---

## Completed (continued)

### Homepage Hero Redesign (Phase 11)

- [x] **Replaced** generic centered dark-gradient hero with an editorial split-panel layout
- [x] **New components** created in `src/components/public/hero/`:
  - `HeroSection.tsx` — split hero: stacked on mobile, 58%/42% flex-row on desktop
  - `AlpanaLotus.tsx` — geometric 8-fold lotus SVG inspired by Bengali alpana art
- [x] **Left/top visual panel**: dark navy gradient + warm amber glow from bottom + baby-pink top-right warmth + alpana lotus at 12% opacity + "DURGA PUJA" large background text art (clamp 5–9rem) + ornamental inner frame with brand-orange diamond corners + hero image slot (`/assets/puja/durga-hero.webp`, `onError` fallback) + club logo (top-left) + bottom caption bar
- [x] **Right/bottom content panel**: cream (`oklch(0.988_0.007_75)`) + year watermark (desktop only) + corner lotus (desktop only) + eyebrow → Bengali club name (`h1`) → Latin subtitle → ornamental divider → event dates + address → "Explore Puja" CTA + "View Events" secondary link
- [x] **CSS keyframe animations** added to `globals.css`: `hero-reveal` (translateY fade-up), `hero-fade` (opacity only); staggered delays 0.2s–0.8s
- [x] **`prefers-reduced-motion`** already handled by global rule collapsing animation durations to 0.01ms
- [x] **Desktop-only animations** via `lg:opacity-0 lg:animate-[...]` — on mobile elements are immediately visible
- [x] **SiteHeader updated**: `usePathname()` homepage detection, `bg-brand-navy/88` initial state on homepage only (transparent elsewhere), Bengali name + "Kolaghat" subtitle in logo, `h-[72px]` height
- [x] **`siteConfig`** updated: `year: 2026`, `pujaYear: '2026'`, `shortDescription` updated, puja dates Sept 15–18 2026, meta title updated
- [x] **`layout.tsx`** fixed: `LayoutProps<'/'>` → `{ children: React.ReactNode }` (avoids `.next/types` dependency)
- [x] **Responsive verified**:
  - Mobile 375px: stacked layout, visual panel `h-[55vh]` with full text art and lotus visible, cream content below — no horizontal overflow
  - Desktop 1440px: split flex-row h-screen, left image panel 58%, right content 42%
- [x] **TypeScript**: `tsc --noEmit` — 0 errors
- [x] **Build**: `npm run build` — 17 routes, 0 errors

---

## Completed (Phase 13 — Glassmorphism Hero Redesign)

### Homepage Hero — Full Redesign (glassmorphism, real photography)
- [x] **Replaced** all previous hero designs (split panel + SVG lotus, then lotus photo) with a full-bleed photography + glassmorphism hero
- [x] **Background image**: Rupnarayan River at Deulti, West Midnapore (near Kolaghat) — Kolaghat bridge visible; CC0 public domain (Pradip Paswan, Canon EOS M6 Mark II); 1920×1280 WebP, 168KB
- [x] **Cinematic overlay**: directional gradient (navy 92% → 18%) darker on the left where the glass panel sits, lighter on the right revealing the river
- [x] **Glassmorphism identity panel**: `backdrop-blur(24px)`, navy/0.58 background, 1px white/8% border, box-shadow; reads crisply over any background
- [x] **Identity hierarchy**: club logo → KOLAGHAT · PURBA MEDINIPUR → শতদল (large Bengali) → SHATADAL · KOLAGHAT → tagline — club identity is dominant
- [x] **Event section**: "CURRENTLY CELEBRATING" → Durga Puja 2026 → date range → Explore Puja CTA — event is secondary to club
- [x] **Removed**: HeroLotus.tsx (SVG lotus), lotus-hero.webp (lotus photo), AlpanaLotus from hero, lotus keyframes (lotus-enter/lotus-breathe/.lotus-animated) from globals.css
- [x] **Year-round appropriate**: river/bridge background has no Durga Puja specificity; design works as permanent club hero
- [x] **IST date fix**: `fmtDate()` now uses `+05:30` offset and `timeZone: 'Asia/Kolkata'` — was missing the IST pin
- [x] TypeScript: `tsc --noEmit` — 0 errors
- [x] Build: `npm run build` — 19 routes, 0 errors

---

## Completed (Phase 12 — Lotus Hero + Countdown Architecture)

### Asset Audit
- [x] Fixed `GET /assets/puja/durga-hero.webp 404` — generated branded 1920×1080 WebP placeholder via Node.js `sharp` script
- [x] Generated `public/assets/og/og-default.jpg` (1200×630 OG placeholder)
- [x] Created `ASSETS.md` — full asset inventory with status, purpose, and pre-launch checklist
- [x] Created `scripts/generate-placeholder-assets.mjs` — generates branded placeholders if needed again
- [x] ESLint fixed: 0 errors (down from 7); pre-existing warnings retained (`react-hook-form`, `window.location.href`)
  - Fixed `react-hooks/set-state-in-effect` in 5 files (auth-provider refactored with lazy init; others disabled with explanation)
  - Removed unused imports: `Pencil`, `Select`, `updateUser` (users), `Cell` (dashboard), `AdminConfig` (config)
  - Fixed unescaped apostrophe in events page
- [x] SSR localStorage guard added to `auth-provider.tsx` (prevented `/_not-found` prerender crash)
- [x] TypeScript: `tsc --noEmit` — 0 errors
- [x] Build: `npm run build` — 19 routes, 0 errors, all static

### Homepage Hero Redesign (lotus-first composition)
- [x] Created `HeroLotus.tsx` — 16-petal premium SVG lotus (8 orange outer + 8 pink inner), centre mandala rings, ambient glow
- [x] **Removed** giant "DURGA PUJA" ghost background typography and placeholder hero image from left panel
- [x] Left panel: deep navy + radial warm glow + `HeroLotus` as sole focal point; no text, no image
- [x] Mobile: `শতদল / SHATADAL · KOLAGHAT` name shown at top of lotus panel (below navbar, above lotus)
- [x] Right panel: rewritten typography hierarchy — eyebrow → large Bengali name → subtitle → tagline → "Currently Celebrating" → event dates → CTAs; no SaaS boxes
- [x] Added CSS keyframes: `lotus-enter` (scale + fade), `lotus-breathe` (slow opacity oscillation); `.lotus-animated` class in `globals.css`; full `prefers-reduced-motion` support
- [x] Hero dates in right panel now read "17 October – 21 October 2026" (correct)

### Countdown Architecture Fix
- [x] **Corrected 2026 festival dates** in `festival.ts`:
  - Previous (wrong): Sept 15–18
  - Corrected: Mahasaptami Oct 17, Mahashtami Oct 19, Mahanavami Oct 20, Vijaya Dashami Oct 21
  - Source: West Bengal Government official holiday list + 2026 Bengali panchang (unusual extended Saptami tithi noted)
- [x] **IST timezone pinning** — all datetimes now include `+05:30` offset in ISO strings (`'2026-10-17T06:00:00+05:30'`); countdown is correct for visitors in any timezone
- [x] Added `countdownLabel` field to `FestivalConfig` type — UI reads the label from config instead of hard-coding "Mahasaptami begins"
- [x] `CountdownTimer.tsx` rewritten: label = `festivalConfig.countdownLabel` ("DURGA PUJA BEGINS IN"), all states handled (countdown / live / ended), no hardcoded strings
- [x] `CountdownSection` in `page.tsx`: heading changed from "Durga Puja Begins In" to "Durga Puja" (avoids duplication with timer label); date footer uses `fmtFestivalDate()` with `timeZone: 'Asia/Kolkata'` — correct in all environments including SSR

---

## Countdown Architecture

**Single source of truth:** `src/config/festival.ts`

**Data flow:**
```
festival.ts (dates, countdownLabel, countdownTarget, festivalEnd)
    ↓
CountdownTimer.tsx          ← reads countdownTarget, countdownLabel
CountdownSection (page.tsx) ← reads days[], year, name
HeroSection.tsx             ← reads days[] for date range display
```

**Timezone rule:** All datetimes in `festival.ts` MUST include `+05:30` offset.
`new Date('2026-10-17T06:00:00+05:30')` → UTC `2026-10-17T00:30:00Z` → correct in all timezones.

**Date display rule:** Use `fmtFestivalDate(dateStr, opts)` (in page.tsx) or `new Date(date + 'T12:00:00+05:30').toLocaleDateString(..., { timeZone: 'Asia/Kolkata' })` to avoid UTC-midnight parsing shifting the date in non-IST environments.

**Annual update checklist (only `festival.ts` needs editing):**
1. `year` → new year
2. `countdownTarget` → Saptami morning datetime (IST, with `+05:30`)
3. `festivalEnd` → after Vijaya Dashami (IST, with `+05:30`)
4. `countdownLabel` → update if the target event label changes
5. Each `days[].date` → actual tithi-aligned dates (confirm with club)
6. Run `npm run build` — no UI files need changing

**Architecture interface (future-proof):**
The `FestivalConfig` type is a stable interface. If a future calendar API provides authoritative tithi dates, it only needs to produce a `FestivalConfig` object — no UI component changes required.

---

## Known Issues / Limitations

- **Puja dates need club confirmation**: Oct 17–21 2026 used per West Bengal official holiday list, but Shatadal's actual club schedule (e.g. exact Saptami timing given the unusual tithi) must be confirmed before launch. Update only `festival.ts`.
- Gallery page uses placeholder tiles (actual photos not yet provided by client)
- Committee page shows placeholder (committee details not yet provided)
- Contact details (phone, email, WhatsApp) are null until client provides them
- Social media links are null until client provides them
- `app/admin` users page: edit functionality not yet implemented (deactivate + create done)
- No `/app/profile` edit form yet (read-only currently)

---

## Decisions Made

1. **shadcn base: Radix UI** — chosen over Base UI for mature ecosystem
2. **Tailwind v4** — using `@import 'tailwindcss'` + `@theme inline` (no tailwind.config.js)
3. **No frontend payment pages** — as per API spec, frontend only redirects to backend `/pay/qr/<id>` and `/pay/cash/<id>`
4. **localStorage for auth** — JWT + cached user, validated on mount via `/api/auth/me`
5. **Dark mode** — only for app section (`.dark` class), public site is always light
6. **Recharts** — used only for collector breakdown bar chart (actual data-backed, no fake time series)

---

## Required Assets (From Client)

The following images need to be provided and placed in `public/assets/`:

```
puja/
  durga-hero.webp      — Large hero image of Ma Durga idol (referenced as /assets/puja/durga-hero.webp)
  pandal.jpg           — Pandal exterior/interior
  dhak.jpg             — Dhak drummers
  pushpanjali.jpg      — Anjali ceremony
  sindoor-khela.jpg    — Sindoor Khela
  diya.jpg             — Diya/lamp

events/
  cultural-program.jpg
  dhunuchi.jpg
  food-festival.jpg
  immersion.jpg

gallery/
  gallery-01.jpg ... gallery-12.jpg  (minimum 12 gallery photos)

og/
  og-default.jpg       — 1200x630 OG image
```

---

## Completed (continued)

### Festival Config Architecture (Phase 12)

**Source of truth before this change:** `src/config/site.ts` — festival data was mixed into club config.

**Architecture after this change:**

| Config file | Owns |
|---|---|
| `src/config/site.ts` | Club identity: name, location, contact, social, branding, meta description |
| `src/config/festival.ts` | All festival data: year, puja dates, countdown target, festival end, per-day labels/descriptions/rituals |

**New file: `src/config/festival.ts`**
- `FestivalConfig` and `PujaDay` TypeScript types
- `festivalConfig.countdownTarget` — ISO datetime the live countdown targets
- `festivalConfig.festivalEnd` — ISO datetime for post-festival state
- `festivalConfig.days[]` — 4 puja days with `key`, `label`, `emoji`, `date`, `description`, `highlight`, `rituals`
- Comprehensive in-file maintenance comment + pointer to `README.md`

**Files updated:**
- `src/config/site.ts` — removed `year`, `pujaYear`, `puja.*`, `meta.title`, `shortDescription` year; now club-only
- `src/app/layout.tsx` — `meta.title` built dynamically: `siteConfig.nameEn + festivalConfig.name + festivalConfig.year`
- `src/components/public/CountdownTimer.tsx` — reads `festivalConfig.countdownTarget`/`festivalEnd`; handles 3 phases: **countdown** (live ticking), **live** (festival ongoing), **ended** (post-festival message)
- `src/app/(public)/page.tsx` — `CountdownSection` and `PujaSection` highlights mapped from `festivalConfig.days`; zero hardcoded dates
- `src/components/public/hero/HeroSection.tsx` — uses `festivalConfig.year` and `festivalConfig.days[0/last].date`
- `src/app/(public)/puja/page.tsx` — schedule rendered by mapping `festivalConfig.days`
- `src/app/(public)/events/page.tsx` — year from `festivalConfig.year`
- `src/app/(public)/contact/page.tsx` — visit dates from `festivalConfig.days`
- `src/app/(public)/committee/page.tsx` — dynamic year label (was hardcoded `"2025 Committee"`)
- `src/components/public/SiteFooter.tsx` — copyright uses `new Date().getFullYear()` (was `siteConfig.year`)
- `src/app/login/page.tsx` — same copyright fix
- `src/app/(app)/admin/config/page.tsx` — stale `"Durga Puja 2025"` placeholder updated to 2026

**Stale 2025 values verified removed:** all cleared (grep returns zero matches)

**Maintenance documented:** `README.md` → "Annual Festival Maintenance" section — 5-step annual update guide, verify checklist, architecture note for future CMS migration

**Verified:**
- `tsc --noEmit` — 0 errors
- `npm run build` — 17 routes, 0 errors
- Live countdown ticking correctly from `festivalConfig.countdownTarget: '2026-09-15T06:00:00'`
- All 4 puja day cards derive dates from `festivalConfig.days`
- Zero console errors

---

---

## Phase 15 — PujoPay Authenticated App: Full Audit & Fix (2026-08-17)

Comprehensive audit and fix of the `/app` section (all authenticated routes) against `README_Apis.md`.

### Root Cause: Admin 404 After Login

Next.js route group `(app)` is transparent to URLs — `src/app/(app)/dashboard/page.tsx` resolves to `/dashboard`, not `/app/dashboard`. Six files had incorrect `/app/` prefixes hardcoded into route strings, causing admin and executive logins to redirect to a non-existent `/app/dashboard` URL.

**Files fixed (route prefix `/app/` → correct path):**
- `src/config/roles.ts` — `getDefaultRoute()` now returns `/dashboard` and `/collect`
- `src/config/navigation.ts` — all nav hrefs stripped of `/app/` prefix
- `src/app/login/page.tsx` — fallback redirect corrected to `/collect`
- `src/components/dashboard/AppSidebar.tsx` — active-state check anchored to `/dashboard`
- `src/lib/auth/role-guard.tsx` — forbidden redirect corrected to `/forbidden`
- `src/app/(app)/forbidden/page.tsx` — "Go to Home" link corrected to `/collect`

### 401 Auto-Logout

Added response interceptor to `src/lib/api/client.ts`: any 401 response (except from `/api/auth/login`, which should propagate wrong-credential errors) clears auth storage and redirects to `/login`.

### Edit User Modal

Added `EditUserModal` to `src/app/(app)/admin/users/page.tsx`. Implements `PATCH /api/users/<id>` with fields: name, phone, WhatsApp, UPI ID, role, optional password reset. Triggered via "Edit" button on every user row.

### StatusBadge Crash Fix

`src/components/shared/StatusBadge.tsx` — added `?? fallback` when `status` value from the backend is outside the known `pending | confirmed | expired` set (backend may return unexpected values or `null`).

### API Coverage Documentation

`API_COVERAGE.md` created — complete table of every endpoint from `README_Apis.md` classified as Implemented / Partial / Not implemented / Backend-rendered, with rationale for each gap.

**Verified:**
- `tsc --noEmit` — 0 errors
- `npm run build` — 19 routes, 0 errors, clean Turbopack compile

---

---

## Phase 16 — Full Auth, UX & Permission Audit (2026-08-17)

Comprehensive audit and fix of authentication, routing, permissions, loading states, form UX, and edge cases across the entire `/app` section.

### Issues Found and Fixed

**1. Login page accessible while authenticated (Critical)**
`/login` had no redirect for already-authenticated users — a logged-in admin could visit `/login` and see the login form. Fixed in `src/app/login/page.tsx`:
- Added `useEffect` that checks `isAuthenticated && !isLoading` and redirects to `from` param or `getDefaultRoute(user.role)`
- Added early `return null` when `isLoading || isAuthenticated` to prevent flash of login form

**2. No return URL preservation (Important)**
`AuthGuard` redirected to `/login` without preserving the intended URL. After login, users always landed on their default route. Fixed:
- `src/lib/auth/auth-guard.tsx` — now redirects to `/login?from=<encoded-pathname>`
- `src/app/login/page.tsx` — reads `searchParams.get('from')`, validates (must start with `/` and not be `/login`), and redirects there after login; also used in the `useEffect` for already-authenticated redirect

**3. `my-collections` unguarded (Medium)**
`/my-collections` had no `RoleGuard`. The `general` role does not have `collector.view_own`, so a general user accessing this URL directly would see the page structure but get a 403 from the API (shown as error text, not a forbidden page). Fixed in `src/app/(app)/my-collections/page.tsx`:
- Wrapped content with `<RoleGuard permission="collector.view_own">` — redirects to `/forbidden` on unauthorized access

**4. `collect` page unguarded (Low — all roles pass, but explicit)**
`/collect` had no explicit `RoleGuard`. Added `<RoleGuard permission="payment.initiate">` in `src/app/(app)/collect/page.tsx` for consistency and forward-safety.

**5. StatusBadge crash on unexpected status (Bug)**
`src/components/shared/StatusBadge.tsx` crashed with `TypeError: Cannot read properties of undefined (reading 'classes')` when `status` was outside `pending | confirmed | expired`. Fixed with `?? fallback` in config lookup.

### Verified
- `tsc --noEmit` — 0 errors
- `npm run build` — 19 routes, 0 errors

### Route Matrix and Auth Architecture
`ARCHITECTURE.md` updated with:
- Full route access matrix (5 columns: logged-out + 4 roles)
- Updated auth flow (9 steps, including `?from=` return URL, 401 interceptor)
- Default post-login route table per role

---

## Next Steps

1. **Client deliverables** — collect and drop into `public/assets/`:
   - `puja/durga-hero.webp` (hero image — unlocks the full split-panel visual)
   - All other puja/events/gallery/og images from the required-assets table
2. **Client confirmation** — exact 2026 puja tithi dates for `siteConfig.puja.*`
3. Fill in contact details (phone, email, WhatsApp), social links, committee information in `src/config/site.ts`
4. Connect to real backend (`NEXT_PUBLIC_API_BASE_URL` in `.env.local`)
5. Add profile edit form (`PATCH /api/users/<id>` for own account)
