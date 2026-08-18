/**
 * Generates placeholder image assets for Shatadal Kolaghat Durga Puja website.
 * Run once: node scripts/generate-placeholder-assets.mjs
 *
 * These are intentional art-direction placeholders — not fake content.
 * Replace with real photography when the client provides it.
 *
 * Requires: sharp (npm i -g sharp OR node_modules has it)
 */

import { createRequire } from 'module'
import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const require = createRequire(import.meta.url)
let sharp
try {
  sharp = require('sharp')
} catch {
  // try global
  sharp = require('/opt/homebrew/lib/node_modules/sharp')
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public', 'assets')

// ─── Brand colours (matching globals.css) ────────────────────────────────────
const NAVY   = '#1B2A6B'   // brand-navy
const ORANGE = '#F05A22'   // brand-orange
const PINK   = '#F075B2'   // brand-pink
const IVORY  = '#FDF8F3'   // warm ivory

// ─── Alpana lotus paths (8-petal, same geometry as AlpanaLotus.tsx) ──────────
const petalLg = 'M100,100 C111,68 111,38 100,20 C89,38 89,68 100,100'
const petalMd = 'M100,100 C108,74 108,54 100,37 C92,54 92,74 100,100'
const petalSm = 'M100,100 C105,85 105,70 100,62 C95,70 95,85 100,100'

const angles = {
  cardinal:  [0, 90, 180, 270],
  diagonal:  [45, 135, 225, 315],
}

function transformPath(d, deg) {
  return `<path d="${d}" transform="rotate(${deg},100,100)" />`
}

function alpanaSVG({ cx, cy, r, color, opacity = 0.18 }) {
  const scale = r / 100
  return `
  <g transform="translate(${cx - r}, ${cy - r}) scale(${scale})"
     stroke="${color}" fill="${color}" stroke-width="0.5" opacity="${opacity}">
    <circle cx="100" cy="100" r="92" fill="none" stroke-dasharray="2 10" />
    <circle cx="100" cy="100" r="80" fill="none" />
    ${angles.cardinal.map(d => `<path d="${petalLg}" transform="rotate(${d},100,100)" opacity="0.35" />`).join('')}
    ${angles.diagonal.map(d => `<path d="${petalMd}" transform="rotate(${d},100,100)" opacity="0.22" />`).join('')}
    <circle cx="100" cy="100" r="38" fill="none" />
    ${angles.cardinal.map(d => `<path d="${petalSm}" transform="rotate(${d},100,100)" opacity="0.5" />`).join('')}
    <circle cx="100" cy="100" r="14" fill="none" />
    <circle cx="100" cy="100" r="4" fill="none" stroke-width="0.75" />
    <circle cx="100" cy="100" r="1.5" />
  </g>`
}

// ─── HERO IMAGE  1920 × 1080 ──────────────────────────────────────────────────
async function generateHero() {
  const W = 1920, H = 1080
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
    xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#1a2460" />
      <stop offset="45%"  stop-color="#141d4e" />
      <stop offset="100%" stop-color="#0d1430" />
    </linearGradient>
    <linearGradient id="glow-bottom" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="${ORANGE}" stop-opacity="0" />
      <stop offset="100%" stop-color="${ORANGE}" stop-opacity="0.22" />
    </linearGradient>
    <linearGradient id="glow-pink" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="${PINK}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="${PINK}" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="center-glow" cx="50%" cy="55%" r="45%">
      <stop offset="0%"   stop-color="${ORANGE}" stop-opacity="0.12" />
      <stop offset="100%" stop-color="${ORANGE}" stop-opacity="0" />
    </radialGradient>
    <filter id="blur-soft">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <!-- Warm glow from bottom -->
  <rect width="${W}" height="${H}" fill="url(#glow-bottom)" />
  <!-- Pink warmth top-right -->
  <rect width="${W}" height="${H}" fill="url(#glow-pink)" />
  <!-- Centre radial glow -->
  <rect width="${W}" height="${H}" fill="url(#center-glow)" />

  <!-- Large background alpana — very subtle, centred -->
  ${alpanaSVG({ cx: W * 0.5, cy: H * 0.48, r: 380, color: ORANGE, opacity: 0.10 })}

  <!-- Smaller flanking alpana motifs -->
  ${alpanaSVG({ cx: W * 0.12, cy: H * 0.25, r: 140, color: IVORY, opacity: 0.04 })}
  ${alpanaSVG({ cx: W * 0.88, cy: H * 0.72, r: 100, color: PINK, opacity: 0.05 })}

  <!-- Large display text — warm ivory, very low opacity background art -->
  <text x="${W / 2}" y="${H * 0.42}" font-family="Georgia, 'Times New Roman', serif"
        font-size="220" font-weight="700" letter-spacing="30"
        fill="${IVORY}" opacity="0.04"
        text-anchor="middle" dominant-baseline="middle">DURGA</text>
  <text x="${W / 2}" y="${H * 0.62}" font-family="Georgia, 'Times New Roman', serif"
        font-size="180" font-weight="700" letter-spacing="28"
        fill="${IVORY}" opacity="0.04"
        text-anchor="middle" dominant-baseline="middle">PUJA</text>

  <!-- Foreground horizontal rule -->
  <line x1="${W * 0.3}" y1="${H * 0.72}" x2="${W * 0.7}" y2="${H * 0.72}"
        stroke="${ORANGE}" stroke-width="0.8" opacity="0.3" />
  <rect x="${W * 0.498}" y="${H * 0.72 - 4}" width="8" height="8"
        transform="rotate(45, ${W * 0.5}, ${H * 0.72})"
        fill="${ORANGE}" opacity="0.45" />

  <!-- Bottom caption -->
  <text x="${W * 0.08}" y="${H * 0.92}"
        font-family="system-ui, sans-serif" font-size="15"
        letter-spacing="5" fill="${IVORY}" opacity="0.3"
        text-anchor="start">DURGA PUJA · 2026 · KOLAGHAT · PURBA MEDINIPUR</text>

  <!-- Thin border frame -->
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}"
        fill="none" stroke="${IVORY}" stroke-width="0.6" opacity="0.08" />
  <!-- Corner diamonds -->
  <rect x="16" y="16" width="8" height="8" transform="rotate(45,20,20)"
        fill="${ORANGE}" opacity="0.35" />
  <rect x="${W - 24}" y="16" width="8" height="8" transform="rotate(45,${W - 20},20)"
        fill="${ORANGE}" opacity="0.35" />
  <rect x="16" y="${H - 24}" width="8" height="8" transform="rotate(45,20,${H - 20})"
        fill="${ORANGE}" opacity="0.35" />
  <rect x="${W - 24}" y="${H - 24}" width="8" height="8" transform="rotate(45,${W - 20},${H - 20})"
        fill="${ORANGE}" opacity="0.35" />
</svg>`

  const outPath = path.join(publicDir, 'puja', 'durga-hero.webp')
  mkdirSync(path.dirname(outPath), { recursive: true })
  await sharp(Buffer.from(svg))
    .webp({ quality: 88, effort: 4 })
    .toFile(outPath)
  console.log(`✓  puja/durga-hero.webp  (${W}×${H})`)
}

// ─── OG IMAGE  1200 × 630 ─────────────────────────────────────────────────────
async function generateOG() {
  const W = 1200, H = 630
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
    xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#1a2460" />
      <stop offset="100%" stop-color="#0e1535" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="80%" x2="100%" y2="20%">
      <stop offset="0%"  stop-color="${ORANGE}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${PINK}" stop-opacity="0.06" />
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect width="${W}" height="${H}" fill="url(#accent)" />

  <!-- Central lotus -->
  ${alpanaSVG({ cx: W * 0.78, cy: H * 0.5, r: 230, color: ORANGE, opacity: 0.09 })}

  <!-- Left colour strip -->
  <rect x="0" y="0" width="8" height="${H}" fill="${ORANGE}" opacity="0.7" />

  <!-- Club name -->
  <text x="80" y="${H * 0.4}" font-family="Georgia, 'Times New Roman', serif"
        font-size="72" font-weight="700" fill="${IVORY}" opacity="0.95"
        dominant-baseline="middle">Shatadal</text>

  <!-- Tagline -->
  <text x="82" y="${H * 0.55}" font-family="system-ui, sans-serif"
        font-size="18" letter-spacing="5" fill="${ORANGE}" opacity="0.85"
        dominant-baseline="middle">KOLAGHAT · DURGA PUJA 2026</text>

  <!-- Divider -->
  <line x1="80" y1="${H * 0.64}" x2="340" y2="${H * 0.64}"
        stroke="${ORANGE}" stroke-width="1" opacity="0.4" />

  <!-- Sub-text -->
  <text x="80" y="${H * 0.73}" font-family="system-ui, sans-serif"
        font-size="14" letter-spacing="3" fill="${IVORY}" opacity="0.4"
        dominant-baseline="middle">শতদল · Purba Medinipur, West Bengal</text>

  <!-- Border -->
  <rect x="10" y="10" width="${W - 20}" height="${H - 20}"
        fill="none" stroke="${IVORY}" stroke-width="0.5" opacity="0.1" />
</svg>`

  const outPath = path.join(publicDir, 'og', 'og-default.jpg')
  mkdirSync(path.dirname(outPath), { recursive: true })
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 88 })
    .toFile(outPath)
  console.log(`✓  og/og-default.jpg  (${W}×${H})`)
}

// ─── Run ──────────────────────────────────────────────────────────────────────
;(async () => {
  try {
    await generateHero()
    await generateOG()
    console.log('\nAll placeholder assets generated.')
    console.log('Replace with real photos when the client provides them.')
  } catch (err) {
    console.error('Error generating assets:', err.message)
    process.exit(1)
  }
})()
