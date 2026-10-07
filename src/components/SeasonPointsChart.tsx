'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Group } from '@visx/group';
import { scaleLinear, scalePoint } from '@visx/scale';
import { LinePath, Line, Circle } from '@visx/shape';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';

/**
 * Chart input — one line per player. Kept local (not importing the results
 * view-model) so the component is a self-contained client island: the server
 * page maps PlayerSeries -> this shape and passes plain data across the
 * boundary.
 */
export interface ChartSeries {
  /** Stable key + display name. */
  name: string;
  /** True for the season champion — this line earns the single accent. */
  isChampion: boolean;
  /** Final season placement (1 = champion). Breaks label de-collision ties:
   *  the better-placed player keeps their spot, the worse-placed one yields. */
  placement: number;
  /** Cumulative totals in game order: { x: ordinal, y: runningTotal }. */
  points: { x: number; y: number }[];
}

interface Props {
  series: ChartSeries[];
  /** Short labels for each game ordinal, for the tooltip (e.g. game titles). */
  gameLabels: Record<number, string>;
}

const ACCENT = '#e8334a';
const MUTED = '#706b66';
const TEXT = '#e6e1db';
const BORDER = '#222120';

/**
 * Measure a block element's content width via ResizeObserver. We need only the
 * width — the chart's height is a fixed number — so this renders the SVG in
 * normal flow, which keeps the containing <figure> at the SVG's real height.
 */
function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

/**
 * Cumulative points-over-games — the narrative "race" view. VERKSTED chart
 * language: no gradient, no glow, no area fill. The roster is tiny (4–5
 * players), so EVERY line + name is drawn at all times — no hover-to-isolate.
 * The champion's line is the single accent; everyone else is a muted trace,
 * told apart by their always-on end-of-line name label.
 *
 * Hover is for INSPECTION, not isolation: moving the pointer snaps to the
 * nearest game and shows a crosshair + a readout of every player's exact
 * running total at that game (with the game's title). A full-plot invisible
 * overlay captures the pointer, so the hit area is the whole chart — not the
 * 1px line strokes.
 *
 * Sizing: a ResizeObserver (useWidth) gives a real responsive width; height is
 * explicit and taller on narrow screens so the chart never collapses to a
 * sliver on mobile. The x-axis shows game NUMBERS only (never rotated → nothing
 * clips); the full game title lives in the tooltip.
 */
export default function SeasonPointsChart({ series, gameLabels }: Props) {
  const [ref, width] = useWidth();
  return (
    <figure className='border-border bg-bg m-0 border p-4 sm:p-6'>
      <div ref={ref} className='w-full'>
        {width > 0 && (
          <ChartInner width={width} series={series} gameLabels={gameLabels} />
        )}
      </div>
    </figure>
  );
}

const axisLabelProps = {
  fill: MUTED,
  fontFamily: 'Martian Mono, monospace',
  fontSize: 10,
  letterSpacing: '0.1em',
};

interface InnerProps extends Props {
  width: number;
}

function ChartInner({ width, series, gameLabels }: InnerProps) {
  // Taller, roomier layout on small screens so it stays legible; a wider,
  // shorter aspect on desktop. Height is explicit (not derived from a locked
  // aspect ratio), so narrow widths don't shrink the whole thing uniformly.
  const isNarrow = width < 480;
  const height = isNarrow ? 320 : 380;

  // Right margin leaves room for the always-on end-of-line name labels.
  const margin = {
    top: 16,
    right: isNarrow ? 64 : 96,
    bottom: 36,
    left: 36,
  };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const [activeOrdinal, setActiveOrdinal] = useState<number | null>(null);

  const { xScale, yScale, ordinals } = useMemo(() => {
    const allOrdinals = Array.from(
      new Set(series.flatMap((s) => s.points.map((p) => p.x))),
    ).sort((a, b) => a - b);
    const maxY = Math.max(
      1,
      ...series.flatMap((s) => s.points.map((p) => p.y)),
    );
    return {
      ordinals: allOrdinals,
      xScale: scalePoint<number>({
        domain: allOrdinals,
        range: [0, innerWidth],
        padding: 0.5,
      }),
      yScale: scaleLinear<number>({
        domain: [0, maxY],
        range: [innerHeight, 0],
        nice: true,
      }),
    };
  }, [series, innerWidth, innerHeight]);

  if (series.length === 0 || ordinals.length === 0) return null;

  /** Snap a pointer x (in inner-plot coords) to the nearest game ordinal. */
  function nearestOrdinal(px: number): number {
    let best = ordinals[0];
    let bestDist = Infinity;
    for (const o of ordinals) {
      const d = Math.abs((xScale(o) ?? 0) - px);
      if (d < bestDist) {
        bestDist = d;
        best = o;
      }
    }
    return best;
  }

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const point = localPoint(e);
    if (!point) return;
    setActiveOrdinal(nearestOrdinal(point.x - margin.left));
  }

  const activeX = activeOrdinal !== null ? (xScale(activeOrdinal) ?? 0) : null;

  // Champion drawn last (on top). Rendering order only — all lines always show.
  const ordered = [...series].sort(
    (a, b) => Number(a.isChampion) - Number(b.isChampion),
  );

  // End-of-line label y-positions, de-collided so players who finish on the
  // same (or very close) totals don't stack their name labels. Ties are broken
  // by season PLACEMENT: labels are placed best-placement-first, each keeping
  // its ideal y (the line's final point) unless it collides with an
  // already-placed, better-placed label — then it yields to the nearest free
  // slot at least LABEL_GAP away. So the better-placed player sits on their
  // line and the worse-placed one moves.
  const LABEL_GAP = 13;
  const labelLayout = (() => {
    const byPriority = series
      .map((s) => {
        const last = s.points[s.points.length - 1];
        return last
          ? { name: s.name, placement: s.placement, idealY: yScale(last.y) }
          : null;
      })
      .filter(
        (x): x is { name: string; placement: number; idealY: number } => !!x,
      )
      .sort((a, b) => a.placement - b.placement);

    const placed: { name: string; idealY: number; y: number }[] = [];
    const clampY = (y: number) => Math.max(0, Math.min(innerHeight, y));

    for (const item of byPriority) {
      const collides = (y: number) =>
        placed.some((p) => Math.abs(p.y - y) < LABEL_GAP);

      let y = clampY(item.idealY);
      if (collides(y)) {
        // Search outward from the ideal y for the nearest non-colliding slot.
        for (let step = 1; step <= Math.ceil(innerHeight / LABEL_GAP); step++) {
          const down = clampY(item.idealY + step * LABEL_GAP);
          const up = clampY(item.idealY - step * LABEL_GAP);
          if (!collides(down)) {
            y = down;
            break;
          }
          if (!collides(up)) {
            y = up;
            break;
          }
        }
      }
      placed.push({ name: item.name, idealY: item.idealY, y });
    }

    return new Map(placed.map((it) => [it.name, it]));
  })();

  // Readout rows for the active game, highest total first.
  const readout =
    activeOrdinal !== null
      ? [...series]
          .map((s) => ({
            name: s.name,
            isChampion: s.isChampion,
            total: s.points.find((p) => p.x === activeOrdinal)?.y ?? 0,
          }))
          .sort((a, b) => b.total - a.total)
      : [];

  return (
    <div className='relative'>
      <svg
        width={width}
        height={height}
        role='img'
        aria-label='Poengutvikling gjennom sesongen'
      >
        <Group left={margin.left} top={margin.top}>
          {/* Horizontal gridlines — blueprint hairlines. */}
          {yScale.ticks(5).map((t) => (
            <Line
              key={`g-${t}`}
              from={{ x: 0, y: yScale(t) }}
              to={{ x: innerWidth, y: yScale(t) }}
              stroke={BORDER}
              strokeWidth={1}
            />
          ))}

          {/* Crosshair at the active game. */}
          {activeX !== null && (
            <Line
              from={{ x: activeX, y: 0 }}
              to={{ x: activeX, y: innerHeight }}
              stroke={MUTED}
              strokeWidth={1}
              strokeDasharray='2,2'
            />
          )}

          {ordered.map((s) => {
            const stroke = s.isChampion ? ACCENT : MUTED;
            const last = s.points[s.points.length - 1];
            const activePoint =
              activeOrdinal !== null
                ? s.points.find((p) => p.x === activeOrdinal)
                : undefined;
            const label = last ? labelLayout.get(s.name) : undefined;
            const lineX = last ? (xScale(last.x) ?? 0) : 0;
            const lineY = last ? yScale(last.y) : 0;
            const labelNudged = !!label && Math.abs(label.y - lineY) > 1;
            return (
              <g key={s.name}>
                <LinePath
                  data={s.points}
                  x={(d) => xScale(d.x) ?? 0}
                  y={(d) => yScale(d.y)}
                  curve={curveMonotoneX}
                  stroke={stroke}
                  strokeWidth={s.isChampion ? 2 : 1.5}
                />
                {/* Always-on end-of-line name label, de-collided vertically.
                    A short leader connects it to the line's endpoint when the
                    label had to be nudged off its true y. */}
                {label && (
                  <>
                    {labelNudged && (
                      <Line
                        from={{ x: lineX, y: lineY }}
                        to={{ x: lineX + 6, y: label.y }}
                        stroke={stroke}
                        strokeWidth={1}
                        strokeOpacity={0.5}
                      />
                    )}
                    <text
                      x={lineX + 8}
                      y={label.y}
                      dy={4}
                      textAnchor='start'
                      fill={s.isChampion ? TEXT : MUTED}
                      fontFamily='Martian Mono, monospace'
                      fontSize={10}
                      letterSpacing='0.08em'
                    >
                      {s.name.toUpperCase()}
                    </text>
                  </>
                )}
                {/* Marker at the active game. */}
                {activePoint && (
                  <Circle
                    cx={xScale(activePoint.x) ?? 0}
                    cy={yScale(activePoint.y)}
                    r={3}
                    fill={stroke}
                  />
                )}
              </g>
            );
          })}

          <AxisLeft
            scale={yScale}
            numTicks={5}
            stroke={BORDER}
            tickStroke={BORDER}
            tickLabelProps={() => ({
              ...axisLabelProps,
              textAnchor: 'end',
              dx: -4,
              dy: 3,
            })}
          />
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            tickValues={ordinals}
            stroke={BORDER}
            tickStroke={BORDER}
            tickFormat={(v) => String(v)}
            tickLabelProps={() => ({
              ...axisLabelProps,
              textAnchor: 'middle',
              dy: 2,
            })}
          />

          {/* Full-plot invisible hit area — the whole chart is the hover target. */}
          <rect
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill='transparent'
            onPointerMove={handleMove}
            onPointerLeave={() => setActiveOrdinal(null)}
            style={{ touchAction: 'none' }}
          />
        </Group>
      </svg>

      {/* Tooltip: the active game's title + every player's exact running total.
          Positioned just inside the plot area (offset by the margins) so it
          tucks against the top-left of the lines, clear of the axes. */}
      {activeOrdinal !== null && (
        <div
          className='border-border bg-bg pointer-events-none absolute border p-3'
          style={{ top: margin.top + 6, left: margin.left + 6 }}
        >
          <p className='text-text-muted mb-2 font-mono text-[10px] tracking-widest uppercase'>
            {gameLabels[activeOrdinal] ?? `Spill ${activeOrdinal}`}
          </p>
          <ul className='flex flex-col gap-1'>
            {readout.map((r) => (
              <li
                key={r.name}
                className='flex items-baseline justify-between gap-6'
              >
                <span
                  className={`text-xs ${r.isChampion ? 'text-accent' : 'text-text'}`}
                >
                  {r.name}
                </span>
                <span className='text-text font-mono text-xs tabular-nums'>
                  {r.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
