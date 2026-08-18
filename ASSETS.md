# Asset Inventory — Shatadal Kolaghat Durga Puja

Last updated: 2026-08-14

---

## Asset Status Key

- ✅ **Available** — file exists, correct path, loads correctly
- 🔶 **Placeholder** — file exists but is a generated placeholder; must be replaced with real content before launch
- ❌ **Missing** — file referenced in code but does not exist (causes 404)
- 📋 **Pending** — needed for launch but not yet referenced in code

---

## Branding

| Asset | Browser Path | File | Used By | Purpose | Status |
|-------|-------------|------|---------|---------|--------|
| Club Logo | `/assets/branding/club-logo.jpeg` | `public/assets/branding/club-logo.jpeg` | SiteHeader, SiteFooter, HeroSection, login, sidebar, 404 | Official club logo — all pages | ✅ Available (provided by client) |
| Hero Background | `/assets/branding/rupnarayan-hero.webp` | `public/assets/branding/rupnarayan-hero.webp` | HeroSection (homepage full-bleed background) | Rupnarayan River near Kolaghat — authentic location background | ✅ Available (CC0 public domain) |

---

## Puja Images

| Asset | Browser Path | File | Used By | Purpose | Status |
|-------|-------------|------|---------|---------|--------|
| Durga Hero | `/assets/puja/durga-hero.webp` | `public/assets/puja/durga-hero.webp` | HeroSection (homepage left panel) | Main hero image — Ma Durga idol / pandal | 🔶 Placeholder (SVG-based, 1920×1080) |
| Pandal | `/assets/puja/pandal.webp` | — | Not yet in code | Pandal exterior / interior | 📋 Pending (client to provide) |
| Dhak Drummers | `/assets/puja/dhak.webp` | — | Not yet in code | Dhak drummers — cultural identity | 📋 Pending (client to provide) |
| Pushpanjali | `/assets/puja/pushpanjali.webp` | — | Not yet in code | Anjali ceremony | 📋 Pending (client to provide) |
| Sindoor Khela | `/assets/puja/sindoor-khela.webp` | — | Not yet in code | Sindoor Khela (Vijaya Dashami) | 📋 Pending (client to provide) |

---

## Events Images

| Asset | Browser Path | File | Used By | Purpose | Status |
|-------|-------------|------|---------|---------|--------|
| Cultural Program | `/assets/events/cultural-program.webp` | — | Not yet in code | Events page | 📋 Pending (client to provide) |
| Dhunuchi Naach | `/assets/events/dhunuchi.webp` | — | Not yet in code | Events page | 📋 Pending (client to provide) |
| Community Feast | `/assets/events/bhog.webp` | — | Not yet in code | Events page | 📋 Pending (client to provide) |
| Immersion | `/assets/events/immersion.webp` | — | Not yet in code | Events page | 📋 Pending (client to provide) |

---

## Gallery

| Asset | Browser Path | File | Used By | Purpose | Status |
|-------|-------------|------|---------|---------|--------|
| Gallery photos (×12+) | `/assets/gallery/gallery-01.webp` … | — | Gallery page (`/gallery`) | Photo gallery grid | 📋 Pending (client to provide, minimum 12) |

---

## Open Graph / SEO

| Asset | Browser Path | File | Used By | Purpose | Status |
|-------|-------------|------|---------|---------|--------|
| Default OG Image | `/assets/og/og-default.jpg` | `public/assets/og/og-default.jpg` | `src/config/site.ts` → layout metadata | Social share card for all pages | 🔶 Placeholder (generated, 1200×630) |

---

## Favicon / App Icons

| Asset | Browser Path | File | Used By | Purpose | Status |
|-------|-------------|------|---------|---------|--------|
| Favicon | auto-served | `src/app/favicon.ico` | All pages | Browser tab / bookmark icon | ✅ Available (default Next.js) |

> **Recommendation:** Replace `favicon.ico` with a version derived from `club-logo.jpeg` before launch.

---

## Unused Default Next.js Assets

These were created by `create-next-app` and are no longer referenced in any page after the homepage was rebuilt:

| File | Status |
|------|--------|
| `public/file.svg` | Unreferenced — can be deleted |
| `public/globe.svg` | Unreferenced — can be deleted |
| `public/next.svg` | Unreferenced — can be deleted |
| `public/vercel.svg` | Unreferenced — can be deleted |
| `public/window.svg` | Unreferenced — can be deleted |

---

## Pre-launch Checklist

Before going live, the following must be resolved:

- [ ] **Durga Hero** — replace `public/assets/puja/durga-hero.webp` with a high-quality photo of the Ma Durga idol or pandal (1920×1080 minimum, WebP preferred)
- [ ] **OG Image** — replace `public/assets/og/og-default.jpg` with a designed social share card (1200×630, JPG)
- [ ] **Favicon** — generate `src/app/favicon.ico` from the club logo
- [ ] **Gallery** — add at least 12 photos to `public/assets/gallery/` (WebP, 800×600 minimum)
- [ ] **Puja photos** — add pandal, dhak, pushpanjali, sindoor-khela images to `public/assets/puja/`
- [ ] **Events photos** — add event images to `public/assets/events/`

---

## Placeholder Generation

A script exists to regenerate placeholder images if needed:

```bash
node scripts/generate-placeholder-assets.mjs
```

Requires `sharp` (available via `npm install sharp`).

---

## Attribution

| Asset | Source | Licence |
|-------|--------|---------|
| Club Logo | Provided by client (Shatadal Kolaghat) | Club property |
| rupnarayan-hero.webp | [River Rup Narayan](https://commons.wikimedia.org/wiki/File:River_Rup_Narayan.jpg) by Pradip Paswan on Wikimedia Commons | CC0 1.0 Universal Public Domain — no attribution required |
| durga-hero.webp (placeholder) | Generated by script | Internal use only |
| og-default.jpg (placeholder) | Generated by script | Internal use only |
