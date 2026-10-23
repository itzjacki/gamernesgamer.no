'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Group } from '@visx/group';
import { scaleLinear, scalePoint } from '@visx/scale';
import { LinePath, Line, Circle } from '@visx/shape';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';

/** Kept local, not the results view-model: the server page maps to it. */
export interface ChartSeries {
  /** Also the key. */
  name: string;
  isChampion: boolean;
  /** Breaks label collisions: the better-placed player keeps their spot. */
  placement: number;
  /** Running totals in game order: x is the game ordinal. */
  points: { x: number; y: number }[];
}

interface Props {
  series: ChartSeries[];
  gameLabels: Record<number, string>;
}

const ACCENT = '#e8334a';
const MUTED = '#706b66';
const TEXT = '#e6e1db';
const BORDER = '#222120';

/**
 * Width only: the height is fixed, so the SVG stays in normal flow and the
 * <figure> keeps its real height.
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
 * Cumulative points over a season's games. With 4–5 players every line and
 * name is always drawn; hover inspects one game, it doesn't isolate a line.
 * The x-axis shows game numbers only, so nothing rotates or clips.
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
  // Not a locked aspect ratio, so narrow screens don't shrink to a sliver.
  const isNarrow = width < 480;
  const height = isNarrow ? 320 : 380;

  // Right margin leaves room for the end-of-line name labels.
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

  // Champion drawn last, on top.
  const ordered = [...series].sort(
    (a, b) => Number(a.isChampion) - Number(b.isChampion),
  );

  // Labels are placed best placement first; one that collides with an
  // already-placed label moves to the nearest free slot.
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
          {yScale.ticks(5).map((t) => (
            <Line
              key={`g-${t}`}
              from={{ x: 0, y: yScale(t) }}
              to={{ x: innerWidth, y: yScale(t) }}
              stroke={BORDER}
              strokeWidth={1}
            />
          ))}

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
                {/* A leader joins a nudged label to its line's end. */}
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

          {/* The whole plot is the hit area, not the 1px strokes. */}
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
