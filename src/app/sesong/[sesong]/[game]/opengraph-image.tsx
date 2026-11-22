import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { isSeason, seasonData } from '@/data/sesong';
import { getGameView } from '@/lib/results/queries';
import { ogFonts, publicImage } from '@/lib/og/assets';
import {
  COLOR,
  fitTitle,
  Label,
  OG_SIZE,
  OG_TYPE,
  OgFrame,
  Picture,
  Title,
} from '@/lib/og/frame';
import { OG_LABELS } from '@/lib/og/labels';

export const alt = 'Et spill i Gamernes Gamer og vinneren';
export const size = OG_SIZE;
export const contentType = OG_TYPE;

interface Props {
  params: Promise<{ sesong: string; game: string }>;
}

// Prerendered with the pages, which are static too.
export function generateStaticParams() {
  return Object.entries(seasonData).flatMap(([sesong, data]) =>
    data.games.map((game) => ({ sesong, game: game.slug })),
  );
}

const ASIDE = 480;
/** The left column's inner width beside the aside. */
const TEXT_WIDTH = OG_SIZE.width - ASIDE - 160;

export default async function Image({ params }: Props) {
  const { sesong, game: gameSlug } = await params;
  if (!isSeason(sesong)) notFound();

  const { meta, games } = seasonData[sesong];
  const game = games.find((g) => g.slug === gameSlug);
  if (!game) notFound();

  const seasonNumber = Number(sesong);
  // A link shared before the reveal must not give the game away.
  const sealed = meta.status === 'upcoming' && !meta.revealGames;
  const { results } = sealed
    ? { results: [] }
    : await getGameView(seasonNumber, gameSlug);
  const winners = results
    .filter((row) => row.placement === 1)
    .map((row) => row.player.name);

  return new ImageResponse(
    <OgFrame
      asideWidth={ASIDE}
      aside={
        sealed ? undefined : (
          <Picture
            src={await publicImage(game.thumbnailPath)}
            width={ASIDE}
            greyscale={false}
            position='center'
          />
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {sealed ? (
          <Title>{OG_LABELS.season(seasonNumber)}</Title>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Label size={24}>{OG_LABELS.season(seasonNumber)}</Label>
            <Title size={fitTitle(game.title, TEXT_WIDTH)}>{game.title}</Title>
          </div>
        )}
        {winners.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Label>Vinner</Label>
            <Title size={72} color={COLOR.textAccent}>
              {winners.join(' & ')}
            </Title>
          </div>
        )}
      </div>
    </OgFrame>,
    { ...size, fonts: await ogFonts() },
  );
}
