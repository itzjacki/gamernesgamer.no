import { useId } from 'react';
import styles from './SiteHeader.module.css';

/**
 * The hover glitch's timing is shared with the link's turn to accent in
 * SiteHeader.module.css, which lands on the glitch's crux.
 */

export type LogoState = 'rest' | 'upcoming' | 'live';

interface Props {
  /** One string per row: '#' = pixel, '.' = empty. */
  rows: string[];
  state?: LogoState;
  className?: string;
}

/** [first row, last row, class] */
const BANDS: [number, number, string][] = [
  [4, 5, styles.glitch1],
  [11, 13, styles.glitch2],
  [18, 19, styles.glitch3],
  [25, 27, styles.glitch4],
];

/** Horizontal runs of '#' in rows [from, to] as [x, y, length]. */
function runs(rows: string[], from: number, to: number) {
  const out: [number, number, number][] = [];
  for (let y = from; y <= to && y < rows.length; y++) {
    for (const m of rows[y].matchAll(/#+/g))
      out.push([m.index, y, m[0].length]);
  }
  return out;
}

function Rects({ list }: { list: [number, number, number][] }) {
  return list.map(([x, y, len]) => (
    <rect key={`${x}-${y}`} x={x} y={y} width={len} height={1} />
  ));
}

export default function PixelLogo({
  rows,
  state = 'rest',
  className = '',
}: Props) {
  const bloom = useId();
  const width = rows[0]?.length ?? 0;
  const inBand = (y: number) => BANDS.some(([a, b]) => y >= a && y <= b);
  const still = rows.flatMap((_, y) => (inBand(y) ? [] : runs(rows, y, y)));

  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      aria-hidden='true'
      className={`${styles.logo} ${styles[state]} ${className}`}
    >
      <defs>
        <filter
          id={bloom}
          x='-10%'
          y='-10%'
          width='120%'
          height='120%'
          colorInterpolationFilters='sRGB'
        >
          <feGaussianBlur stdDeviation='0.9' result='blur' />
          <feComponentTransfer in='blur' result='halo'>
            <feFuncA type='linear' slope='0.55' />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in='halo' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${bloom})`}>
        <Rects list={still} />
        {BANDS.map(([a, b, cls]) => (
          <g key={a} className={cls}>
            <Rects list={runs(rows, a, b)} />
          </g>
        ))}
      </g>
    </svg>
  );
}
