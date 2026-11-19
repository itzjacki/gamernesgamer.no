import 'server-only';

import type { ReactNode } from 'react';
import { readPixelLogo } from '@/lib/pixel-logo';

/*
 * Building blocks for the opengraph-image routes. Satori (next/og) renders a
 * small subset of CSS: inline styles only, every element with more than one
 * child needs `display: flex`, and CSS variables don't resolve.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = 'image/png';

/** The @theme tokens in global.css, which Satori can't read. Keep in sync. */
export const COLOR = {
  bg: '#17181a',
  surface: '#1c1d1f',
  display: '#111214',
  accent: '#e8334a',
  textAccent: '#eb5063',
  text: '#e6e1db',
  textMuted: '#8a847e',
  border: '#222120',
  borderAccent: '#4a2028',
};

/** The site's 40px grid, anchored to the image's top-left. */
const GRID = {
  backgroundColor: COLOR.bg,
  backgroundImage:
    'linear-gradient(rgba(232,216,216,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,216,216,0.04) 1px, transparent 1px)',
  backgroundSize: '40px 40px',
};

interface FrameProps {
  children: ReactNode;
  /** Full-height panel on the right (a portrait or photo). */
  aside?: ReactNode;
  asideWidth?: number;
  /** Drawn over the whole canvas, positioned by its own absolute styles. */
  overlay?: ReactNode;
}

export function OgFrame({
  children,
  aside,
  asideWidth = 440,
  overlay,
}: FrameProps) {
  return (
    <div
      style={{
        ...GRID,
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        color: COLOR.text,
        fontFamily: 'Body',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '40px 80px',
        }}
      >
        <Masthead />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          {children}
        </div>
        <Label>gamernesgamer.no</Label>
      </div>
      {aside && (
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: asideWidth,
            height: '100%',
            borderLeft: `1px solid ${COLOR.border}`,
            backgroundColor: COLOR.bg,
          }}
        >
          {aside}
        </div>
      )}
      {overlay}
    </div>
  );
}

function Masthead() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <PixelMark size={48} />
      <Label color={COLOR.text}>Gamernes Gamer</Label>
    </div>
  );
}

/** The header's pixel mark, drawn as squares so it stays crisp. */
function PixelMark({ size }: { size: number }) {
  const { rows, width, height } = readPixelLogo();
  return (
    <svg width={size} height={size} viewBox={`0 0 ${width} ${height}`}>
      {rows.flatMap((row, y) =>
        [...row.matchAll(/#+/g)].map((m) => (
          <rect
            key={`${m.index}-${y}`}
            x={m.index}
            y={y}
            width={m[0].length}
            height={1}
            fill={COLOR.text}
            shapeRendering='crispEdges'
          />
        )),
      )}
    </svg>
  );
}

export function Label({
  children,
  color = COLOR.textMuted,
  size = 20,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: 'Mono',
        fontSize: size,
        // Tailwind's tracking-widest, as on the site's labels.
        letterSpacing: size * 0.1,
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </div>
  );
}

/** Big display type; shrinks long strings so they stay on one or two lines. */
export function Title({
  children,
  size = 120,
  color = COLOR.text,
}: {
  children: string;
  size?: number;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: 'Display',
        fontWeight: 800,
        fontSize: size,
        lineHeight: 0.95,
        letterSpacing: -size * 0.02,
        color,
      }}
    >
      {children}
    </div>
  );
}

/** Font size for a title of this length in a column this wide. */
export function fitTitle(text: string, width: number, max = 120) {
  // Neue Montreal Extrabold averages ~0.6em per character.
  return Math.max(56, Math.min(max, Math.floor(width / (text.length * 0.6))));
}

export interface Readout {
  label: string;
  value: string | number;
  /** Rank-1 data only (design.md, "Accent at rest"). */
  accent?: boolean;
}

/** Label-over-value figures in a row, like the header's readout. */
export function Readouts({ items }: { items: Readout[] }) {
  return (
    <div style={{ display: 'flex', gap: 56 }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <Label size={18}>{item.label}</Label>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Display',
              fontWeight: 800,
              fontSize: 64,
              lineHeight: 1,
              color: item.accent ? COLOR.textAccent : COLOR.text,
            }}
          >
            {String(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

interface PictureProps {
  src: string;
  width: number;
  height?: number;
  /** Portraits are greyscale at rest (design.md, "Portraits"). */
  greyscale?: boolean;
  /** The gamer card's accent diagonal across the lower part. */
  diagonal?: boolean;
  position?: string;
}

export function Picture({
  src,
  width,
  height = OG_SIZE.height,
  greyscale = true,
  diagonal = false,
  position = 'top',
}: PictureProps) {
  return (
    <div style={{ display: 'flex', position: 'relative', width, height }}>
      <img
        src={src}
        alt=''
        width={width}
        height={height}
        style={{
          objectFit: 'cover',
          objectPosition: position,
          // Satori crashes on `filter: undefined`, so leave the key out.
          ...(greyscale && { filter: 'grayscale(1)' }),
        }}
      />
      {diagonal && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <line
            x1={0}
            y1={height * 0.86}
            x2={width}
            y2={height * 0.7}
            stroke={COLOR.accent}
            strokeWidth={4}
          />
        </svg>
      )}
    </div>
  );
}
