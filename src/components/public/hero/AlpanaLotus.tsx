/*
 * AlpanaLotus — geometric lotus SVG inspired by Bengali alpana floor art.
 * 8-fold symmetry: 4 cardinal petals (large), 4 diagonal petals (medium),
 * 4 inner petals, concentric rings, and outer dot vertices.
 *
 * Color is inherited via `currentColor` — set via Tailwind text-* on the parent.
 * Opacity is intentionally very low when used as background art.
 */
export function AlpanaLotus({ className }: { className?: string }) {
  const petalLg = 'M100,100 C111,68 111,38 100,20 C89,38 89,68 100,100'
  const petalMd = 'M100,100 C108,74 108,54 100,37 C92,54 92,74 100,100'
  const petalSm = 'M100,100 C105,85 105,70 100,62 C95,70 95,85 100,100'

  const outerDots: [number, number][] = [
    [100, 8],   [165, 35],  [192, 100], [165, 165],
    [100, 192], [35, 165],  [8, 100],   [35, 35],
  ]

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Outer decorative dashed ring */}
      <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 10" />
      {/* Outer solid ring — petal tips rest here */}
      <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" />

      {/* 4 cardinal petals — large, reach r=80 */}
      {[0, 90, 180, 270].map((deg) => (
        <path
          key={`lg-${deg}`}
          d={petalLg}
          stroke="currentColor"
          strokeWidth="0.5"
          fill="currentColor"
          opacity="0.3"
          transform={`rotate(${deg},100,100)`}
        />
      ))}

      {/* 4 diagonal petals — medium, reach r=63 */}
      {[45, 135, 225, 315].map((deg) => (
        <path
          key={`md-${deg}`}
          d={petalMd}
          stroke="currentColor"
          strokeWidth="0.4"
          fill="currentColor"
          opacity="0.2"
          transform={`rotate(${deg},100,100)`}
        />
      ))}

      {/* Middle ring */}
      <circle cx="100" cy="100" r="38" stroke="currentColor" strokeWidth="0.5" />

      {/* 4 inner petals — reach the middle ring */}
      {[0, 90, 180, 270].map((deg) => (
        <path
          key={`sm-${deg}`}
          d={petalSm}
          stroke="currentColor"
          strokeWidth="0.4"
          fill="currentColor"
          opacity="0.45"
          transform={`rotate(${deg},100,100)`}
        />
      ))}

      {/* Inner ring */}
      <circle cx="100" cy="100" r="14" stroke="currentColor" strokeWidth="0.5" />
      {/* Center ring */}
      <circle cx="100" cy="100" r="4" stroke="currentColor" strokeWidth="0.75" />
      {/* Center dot */}
      <circle cx="100" cy="100" r="1.5" fill="currentColor" />

      {/* Vertices at outer dashed ring */}
      {outerDots.map(([cx, cy]) => (
        <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="currentColor" opacity="0.35" />
      ))}
    </svg>
  )
}
