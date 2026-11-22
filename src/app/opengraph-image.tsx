import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { getArchiveTotals, getSeasonChampions } from '@/lib/results/queries';
import { ogFonts } from '@/lib/og/assets';
import {
  COLOR,
  Label,
  OG_SIZE,
  OG_TYPE,
  OgFrame,
  Readouts,
  Title,
} from '@/lib/og/frame';
import { OG_LABELS } from '@/lib/og/labels';

// The site-wide default: every page without its own image inherits it.
export const alt = 'Gamernes Gamer';
export const size = OG_SIZE;
export const contentType = OG_TYPE;

/** trophy.svg is a single path; drawn inline so it can take a token colour. */
function readTrophy() {
  const svg = readFileSync(
    path.join(process.cwd(), 'public', 'images', 'branding', 'trophy.svg'),
    'utf8',
  );
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  const d = svg.match(/ d="([^"]+)"/)?.[1];
  if (!viewBox || !d) throw new Error('trophy.svg: expected one path');
  const [, , width, height] = viewBox.split(' ').map(Number);
  return { viewBox, d, ratio: width / height };
}

export default async function Image() {
  const [champions, totals] = await Promise.all([
    getSeasonChampions(),
    getArchiveTotals(),
  ]);
  const latest = champions.findLast((season) => season.champion);
  const trophy = readTrophy();
  const trophyHeight = 400;

  return new ImageResponse(
    <OgFrame
      aside={
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            width: '100%',
            height: 550,
            borderBottom: `1px solid ${COLOR.border}`,
          }}
        >
          <svg
            width={trophyHeight * trophy.ratio}
            height={trophyHeight}
            viewBox={trophy.viewBox}
          >
            <path d={trophy.d} fill={COLOR.text} fillRule='evenodd' />
          </svg>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Title size={112}>Gamernes Gamer</Title>
          {latest?.champion && (
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <Label>{OG_LABELS.winner(latest.seasonNumber)}</Label>
              <Label size={28} color={COLOR.textAccent}>
                {latest.champion.name}
              </Label>
            </div>
          )}
        </div>
        <Readouts
          items={[
            { label: 'Sesonger', value: totals.seasons },
            { label: 'Spill', value: totals.games },
            { label: 'Matcher spilt', value: totals.matches },
          ]}
        />
      </div>
    </OgFrame>,
    { ...size, fonts: await ogFonts() },
  );
}
