import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { getAllPairSlugs, getPairView } from '@/lib/results/queries';
import type { PairPlayerView } from '@/lib/results/view-models';
import { ogFonts, publicImage } from '@/lib/og/assets';
import {
  COLOR,
  fitTitle,
  Label,
  OG_SIZE,
  OG_TYPE,
  OgFrame,
  Title,
} from '@/lib/og/frame';

export const alt = 'To spillere i Gamernes Gamer mot hverandre';
export const size = OG_SIZE;
export const contentType = OG_TYPE;

interface Props {
  params: Promise<{ a: string; b: string }>;
}

// Prerendered with the pages, which are static too.
export function generateStaticParams() {
  return getAllPairSlugs();
}

/*
 * PairHero's composition: the portraits meet on an accent diagonal in a
 * centred box, the names stand either side, and the headline reading is one
 * gauge whose needle leans toward whoever finished ahead more often.
 */
/** Ends above the gauge's label row. */
const BOX = { width: 360, height: 340 };
const BOX_LEFT = (OG_SIZE.width - BOX.width) / 2;
/** Where the diagonal meets the top and bottom edge, in % of the box. */
const TOP = 58;
const BOTTOM = 42;
const NAME_WIDTH = BOX_LEFT - 80 - 40;

function seasonSpan(numbers: number[]) {
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  return first === last ? `S${first}` : `S${first}–S${last}`;
}

function Name({ player, side }: { player: PairPlayerView; side: 'a' | 'b' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: side === 'a' ? 'flex-start' : 'flex-end',
        width: NAME_WIDTH,
        gap: 12,
      }}
    >
      <Title size={fitTitle(player.name, NAME_WIDTH, 72)}>{player.name}</Title>
      <Label>{player.nickname}</Label>
    </div>
  );
}

export default async function Image({ params }: Props) {
  const { a: slugA, b: slugB } = await params;
  const pair = await getPairView(slugA, slugB);
  if (!pair) notFound();

  const { a, b, finishedAhead } = pair;
  const [srcA, srcB] = await Promise.all([
    a.imagePath && publicImage(a.imagePath),
    b.imagePath && publicImage(b.imagePath),
  ]);
  const games = finishedAhead.games;
  const scope = [
    games.length > 0 && seasonSpan(games.map((g) => g.seasonNumber)),
    `${games.length} spill`,
    finishedAhead.level > 0 && `${finishedAhead.level} likt`,
  ]
    .filter(Boolean)
    .join(' · ');
  const decided = finishedAhead.a + finishedAhead.b;
  // 0 = all the way to a's side; centred when level.
  const needle = decided === 0 ? 0.5 : finishedAhead.b / decided;

  const portrait = (src: string | null, side: 'a' | 'b') =>
    src && (
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: 0,
          width: BOX.width,
          height: BOX.height,
          clipPath:
            side === 'a'
              ? `polygon(0 0, ${TOP}% 0, ${BOTTOM}% 100%, 0 100%)`
              : `polygon(${TOP}% 0, 100% 0, 100% 100%, ${BOTTOM}% 100%)`,
          justifyContent: side === 'a' ? 'flex-start' : 'flex-end',
        }}
      >
        <img
          src={src}
          alt=''
          width={BOX.width * 0.58}
          height={BOX.height}
          style={{
            objectFit: 'cover',
            objectPosition: 'top',
            filter: 'grayscale(1)',
          }}
        />
      </div>
    );

  const figure = (value: number) => (
    <div
      style={{
        display: 'flex',
        fontFamily: 'Display',
        fontSize: 64,
        lineHeight: 1,
      }}
    >
      {String(value)}
    </div>
  );

  return new ImageResponse(
    <OgFrame
      overlay={
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: BOX_LEFT,
            width: BOX.width,
            height: BOX.height,
            backgroundColor: COLOR.bg,
            borderLeft: `1px solid ${COLOR.border}`,
            borderRight: `1px solid ${COLOR.border}`,
            borderBottom: `1px solid ${COLOR.border}`,
          }}
        >
          {portrait(srcA, 'a')}
          {portrait(srcB, 'b')}
          <svg
            width={BOX.width}
            height={BOX.height}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <line
              x1={(BOX.width * TOP) / 100}
              y1={0}
              x2={(BOX.width * BOTTOM) / 100}
              y2={BOX.height}
              stroke={COLOR.accent}
              strokeWidth={3}
            />
          </svg>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 72 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Name player={a} side='a' />
          <Name player={b} side='b' />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Label>Innbyrdes oppgjør: Spill</Label>
            <Label>{scope}</Label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {figure(finishedAhead.a)}
            <div
              style={{
                display: 'flex',
                position: 'relative',
                flex: 1,
                height: 40,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: 1,
                  backgroundColor: COLOR.textMuted,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  position: 'absolute',
                  top: 0,
                  left: `${needle * 100}%`,
                  width: 4,
                  height: 40,
                  marginLeft: -2,
                  backgroundColor: COLOR.accent,
                }}
              />
            </div>
            {figure(finishedAhead.b)}
          </div>
        </div>
      </div>
    </OgFrame>,
    { ...size, fonts: await ogFonts() },
  );
}
