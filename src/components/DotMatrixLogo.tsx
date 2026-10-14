'use client';

import { useEffect, useState } from 'react';
import styles from './SiteHeader.module.css';

/**
 * The GG trophy mark (`public/images/branding/logo.svg`) drawn as a dot
 * matrix, like a small LED screen on an instrument. The dots are sampled from
 * the SVG in the browser, so the mark always follows the file; until then (and
 * without JS) the plain logo stands in at the same size.
 *
 * `state` lets the mark carry the tournament's status: still at rest, a slow
 * pulse while a season is upcoming, a blink while one is live. Colour comes
 * from `currentColor`, so the parent decides rest/hover colours.
 */

export type LogoState = 'rest' | 'upcoming' | 'live';

interface Props {
  /** Dots across. Rows follow from the logo's aspect ratio. */
  cols?: number;
  state?: LogoState;
  className?: string;
}

const SRC = '/images/branding/logo.svg';
// logo.svg's viewBox is 899 × 836.
const ASPECT = 836 / 899;
// Supersampling per dot, and how much of a cell must be covered to light it.
const SAMPLES = 8;
const THRESHOLD = 0.42;

export default function DotMatrixLogo({
  cols = 18,
  state = 'rest',
  className = '',
}: Props) {
  const rows = Math.round(cols * ASPECT);
  const [dots, setDots] = useState<[number, number][] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const w = cols * SAMPLES;
      const h = rows * SAMPLES;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const alpha = ctx.getImageData(0, 0, w, h).data;
      const lit: [number, number][] = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let sum = 0;
          for (let sy = 0; sy < SAMPLES; sy++) {
            for (let sx = 0; sx < SAMPLES; sx++) {
              sum += alpha[((y * SAMPLES + sy) * w + x * SAMPLES + sx) * 4 + 3];
            }
          }
          if (sum / (SAMPLES * SAMPLES * 255) > THRESHOLD) lit.push([x, y]);
        }
      }
      setDots(lit);
    };
    img.src = SRC;
    return () => {
      cancelled = true;
    };
  }, [cols, rows]);

  if (!dots) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={SRC}
        alt=''
        aria-hidden='true'
        className={`${styles.logoFallback} ${className}`}
      />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      aria-hidden='true'
      className={`${styles.logo} ${styles[state]} ${className}`}
    >
      {dots.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x + 0.14}
          y={y + 0.14}
          width={0.72}
          height={0.72}
        />
      ))}
    </svg>
  );
}
