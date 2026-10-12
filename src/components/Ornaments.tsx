/**
 * Ornaments, drawn by hand as SVG paths (no external images):
 * - қошқар мүйіз (ram's horn) — Kazakh motif: card corners and section dividers;
 * - eight-pointed Seljuk star and Iznik tile geometry — Turkish motif;
 * - шаңырақ (yurt crown) with an inscribed Seljuk star — the home-page emblem.
 * Strokes are 1–1.5px; colour and opacity come from CSS (see .orn-* classes).
 */

import { useId } from 'react';

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Outline of an eight-pointed star {8/2} with outer radius R, as a path. */
function octagram(R: number, cx = 0, cy = 0): string {
  const inner = R * 0.7654;
  const pts = Array.from({ length: 16 }, (_, k) => {
    const a = ((k * 22.5 - 90) * Math.PI) / 180;
    const r = k % 2 === 0 ? R : inner;
    return `${r2(cx + r * Math.cos(a))} ${r2(cy + r * Math.sin(a))}`;
  });
  return `M${pts.join(' L')} Z`;
}

/** Two interlaced squares — the classic Seljuk star with its inner lines. */
function seljukSquares(R: number, cx = 0, cy = 0): string {
  const s = R / Math.SQRT2;
  const a = `M${r2(cx - s)} ${r2(cy - s)} H${r2(cx + s)} V${r2(cy + s)} H${r2(cx - s)} Z`;
  const b = `M${cx} ${r2(cy - R)} L${r2(cx + R)} ${cy} L${cx} ${r2(cy + R)} L${r2(cx - R)} ${cy} Z`;
  return `${a} ${b}`;
}

/** Corner ornament: a stem from the corner splitting into two ram-horn spirals. */
export function RamHornCorner({ className = '' }: { className?: string }) {
  return (
    <svg className={`orn orn-corner ${className}`} viewBox="0 0 56 56" aria-hidden="true" focusable="false">
      <path d="M5 5 L16 16 C18 8 28 4 36 8 C44 12 42 22 35 22 C29 22 29 15 34 15 M16 16 C8 18 4 28 8 36 C12 44 22 42 22 35 C22 29 15 29 15 34 M40 3 H54 M3 40 V54" />
    </svg>
  );
}

/** Section divider: hairlines with a central double ram horn. */
export function RamHornDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`orn-divider ${className}`} aria-hidden="true">
      <span className="orn-line" />
      <svg className="orn" viewBox="0 0 88 30" focusable="false">
        <path d="M44 28 V18 C44 9 36 3 27 5 C19 7 18 17 25 18 C31 19 32 12 27 12 M44 18 C44 9 52 3 61 5 C69 7 70 17 63 18 C57 19 56 12 61 12 M2 28 H34 M54 28 H86 M38 28 C40 24 48 24 50 28" />
      </svg>
      <span className="orn-line" />
    </div>
  );
}

export function SeljukStar({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`orn orn-star ${className}`} width={size} height={size} viewBox="-12 -12 24 24" aria-hidden="true" focusable="false">
      <path d={seljukSquares(10.5)} />
      <path d={octagram(5.6)} />
      <circle r="1.6" />
    </svg>
  );
}

/** Iznik-style band: a row of interlaced stars joined by a lattice. */
export function IznikBand({ className = '' }: { className?: string }) {
  const id = `iznik-${useId().replace(/:/g, '')}`;
  return (
    <svg className={`orn orn-band ${className}`} width="100%" height="36" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="48" height="36" patternUnits="userSpaceOnUse">
          <path d={seljukSquares(11, 24, 18)} />
          <path d={octagram(5.5, 24, 18)} />
          <path d="M0 18 H5 M43 18 H48 M24 0 V3 M24 33 V36 M0 0 L8 8 M48 0 L40 8 M0 36 L8 28 M48 36 L40 28" />
        </pattern>
      </defs>
      <rect width="100%" height="36" fill={`url(#${id})`} stroke="none" />
    </svg>
  );
}

/** Small header mark: a crown ring with spokes and a star. */
export function BrandMark() {
  const spokes = Array.from({ length: 16 }, (_, i) => {
    const a = (i * 22.5 * Math.PI) / 180;
    return `M${r2(15 * Math.cos(a))} ${r2(15 * Math.sin(a))} L${r2(19 * Math.cos(a))} ${r2(19 * Math.sin(a))}`;
  }).join(' ');
  return (
    <svg className="brand-mark" viewBox="-20 -20 40 40" aria-hidden="true" focusable="false">
      <path className="bm-spokes" d={spokes} />
      <circle className="bm-ring" r="13" />
      <path className="bm-star" d={seljukSquares(8.5)} />
      <circle className="bm-dot" r="2" />
    </svg>
  );
}

/**
 * Home-page emblem: a шаңырақ (yurt crown) with its spokes (уық) and crossed
 * bars (күлдіреуіш), with a Seljuk star inscribed at the centre.
 */
export function Shanyrak({ label }: { label: string }) {
  const spokes = Array.from({ length: 36 }, (_, i) => {
    const a = (i * 10 * Math.PI) / 180;
    return `M${r2(98 * Math.cos(a))} ${r2(98 * Math.sin(a))} L${r2(124 * Math.cos(a))} ${r2(124 * Math.sin(a))}`;
  }).join(' ');
  // Crossed bars: three each way, slightly bowed, clipped by the inner ring.
  const bars = [-30, 0, 30]
    .flatMap((d) => {
      const h = Math.sqrt(86 * 86 - d * d);
      return [
        `M${r2(-h)} ${d} Q0 ${d - 12} ${r2(h)} ${d}`,
        `M${d} ${r2(-h)} Q${d + 12} 0 ${d} ${r2(h)}`,
      ];
    })
    .join(' ');
  return (
    <svg className="shanyrak" viewBox="-130 -130 260 260" role="img" aria-label={label}>
      <g className="sh-crown">
        <path className="sh-spokes" d={spokes} />
        <circle className="sh-ring" r="94" />
        <circle className="sh-ring sh-ring-inner" r="86" />
        <path className="sh-bars" d={bars} />
      </g>
      <circle className="sh-hole" r="50" />
      <g className="sh-star">
        <path d={seljukSquares(44)} />
        <path d={octagram(25)} />
        <circle r="13" />
      </g>
      <circle className="sh-center" r="5" />
    </svg>
  );
}
