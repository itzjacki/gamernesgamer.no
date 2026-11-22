import { useId } from 'react';
import styles from './Card.module.css';

interface Props {
  imagePath: string;
  /** Zero-padded season slug: the big figure behind the portrait. */
  season: string;
}

// A full-art face, whose content sits inset by the border's width (7px). The
// boxes must match Card.module.css: `.portrait`, `.panel`, and
// `.seasonFigure` (230px Neue Montreal 800, top -48, right -18).
const W = 300;
const H = 420;
const PORTRAIT = { x: 57, y: 15, width: 236, height: 230 };
const PANEL = { x: 0, y: 245, width: W, height: H - 245 };
const FIGURE = { x: 26.9, baseline: 156 };
const CENTRE = { x: 175, y: 71 };
// Out to the farthest corner.
const RINGS = Array.from({ length: 96 }, (_, i) => 4 + i * 4.2);
// The displacement shifts lines by up to half its scale, so the lines start
// this far outside the face and the filter region covers them.
const BLEED = 30;

/**
 * The full-art etch, in three zones cut by masks: the season figure takes
 * diagonal hatching, the portrait takes horizontal engraving lines bent by
 * the photo itself, and the stock around them takes concentric rings
 * centred on the player. The panel has its own etch in CSS.
 */
export default function CardEtch({ imagePath, season }: Props) {
  // Stripped to characters that are safe inside url(#…).
  const id = useId().replace(/[^\w-]/g, '');
  const ref = (name: string) => `url(#${id}-${name})`;

  const figure = (fill: string) => (
    <text
      x={FIGURE.x}
      y={FIGURE.baseline}
      fill={fill}
      fontFamily='Neue Montreal, sans-serif'
      fontSize='230'
      fontWeight='800'
      letterSpacing='-9.2'
    >
      {season}
    </text>
  );
  const portrait = (filter: string) => (
    <image
      href={imagePath}
      {...PORTRAIT}
      preserveAspectRatio='xMidYMax meet'
      filter={ref(filter)}
    />
  );

  return (
    <svg className={styles.etch} viewBox={`0 0 ${W} ${H}`} aria-hidden='true'>
      <defs>
        {/* The portrait as a solid silhouette, white or black, for masks. */}
        <filter id={`${id}-white`}>
          <feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0' />
        </filter>
        <filter id={`${id}-black`}>
          <feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' />
        </filter>

        <filter
          id={`${id}-bend`}
          filterUnits='userSpaceOnUse'
          x={-BLEED}
          y={-BLEED}
          width={W + 2 * BLEED}
          height={H + 2 * BLEED}
        >
          <feImage
            href={imagePath}
            {...PORTRAIT}
            preserveAspectRatio='xMidYMax meet'
            result='portrait'
          />
          {/* Blurred, so the lines bend smoothly instead of tearing. */}
          <feGaussianBlur in='portrait' stdDeviation='2' result='soft' />
          <feDisplacementMap
            in='SourceGraphic'
            in2='soft'
            scale='30'
            xChannelSelector='R'
            yChannelSelector='G'
          />
        </filter>

        <pattern
          id={`${id}-hatch`}
          width='4'
          height='4'
          patternUnits='userSpaceOnUse'
          patternTransform='rotate(45)'
        >
          <line x1='0' y1='0' x2='0' y2='4' stroke='#fff' strokeWidth='1' />
        </pattern>
        <pattern
          id={`${id}-engrave`}
          width='4'
          height='3.2'
          patternUnits='userSpaceOnUse'
        >
          <line x1='0' y1='0' x2='4' y2='0' stroke='#fff' strokeWidth='1' />
        </pattern>

        <mask id={`${id}-stock`} maskUnits='userSpaceOnUse'>
          <rect x='0' y='0' width={W} height={H} fill='#fff' />
          <rect {...PANEL} fill='#000' />
          {figure('#000')}
          {portrait('black')}
        </mask>
        <mask id={`${id}-figure`} maskUnits='userSpaceOnUse'>
          {figure('#fff')}
          <rect {...PANEL} fill='#000' />
          {portrait('black')}
        </mask>
        <mask id={`${id}-portrait`} maskUnits='userSpaceOnUse'>
          {portrait('white')}
        </mask>
      </defs>

      <g mask={ref('stock')} fill='none' stroke='#fff' strokeWidth='1'>
        {RINGS.map((r) => (
          <circle key={r} cx={CENTRE.x} cy={CENTRE.y} r={r} />
        ))}
      </g>
      <rect
        mask={ref('figure')}
        x='0'
        y='0'
        width={W}
        height={H}
        fill={ref('hatch')}
      />
      <g mask={ref('portrait')}>
        <rect
          filter={ref('bend')}
          x={-BLEED}
          y={-BLEED}
          width={W + 2 * BLEED}
          height={H + 2 * BLEED}
          fill={ref('engrave')}
        />
      </g>
    </svg>
  );
}
