import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { isSeason, seasonData } from '@/data/sesong';
import { formatSeasonDates } from '@/lib/season-dates';
import { findSeasonImage, getSeasonView } from '@/lib/results/queries';
import { ogFonts, publicImage } from '@/lib/og/assets';
import {
  COLOR,
  Label,
  OG_SIZE,
  OG_TYPE,
  OgFrame,
  Picture,
  Title,
} from '@/lib/og/frame';
import { OG_LABELS } from '@/lib/og/labels';

export const alt = 'Sesongen og vinneren i Gamernes Gamer';
export const size = OG_SIZE;
export const contentType = OG_TYPE;

interface Props {
  params: Promise<{ sesong: string }>;
}

// Prerendered with the pages, which are static too.
export function generateStaticParams() {
  return Object.keys(seasonData).map((sesong) => ({ sesong }));
}

export default async function Image({ params }: Props) {
  const { sesong } = await params;
  if (!isSeason(sesong)) notFound();

  const { meta } = seasonData[sesong];
  const seasonNumber = Number(sesong);
  // Only a played season names its champion; an upcoming one shows its dates.
  const view =
    meta.status === 'upcoming' ? null : await getSeasonView(seasonNumber);
  const champion = view?.standings.find((row) => row.isChampion);
  const photo = findSeasonImage(sesong);

  return new ImageResponse(
    <OgFrame
      asideWidth={480}
      aside={
        photo ? (
          <Picture
            src={await publicImage(photo)}
            width={480}
            greyscale={false}
            position='center'
          />
        ) : undefined
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Title>{OG_LABELS.season(seasonNumber)}</Title>
          <Label size={24}>{formatSeasonDates(meta)}</Label>
        </div>
        {champion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Label>{OG_LABELS.winner(seasonNumber)}</Label>
            <Title size={72} color={COLOR.textAccent}>
              {champion.player.name}
            </Title>
          </div>
        )}
      </div>
    </OgFrame>,
    { ...size, fonts: await ogFonts() },
  );
}
