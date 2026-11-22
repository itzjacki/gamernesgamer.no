import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { getAllPlayerSlugs, getCareerView } from '@/lib/results/queries';
import { ogFonts, publicImage } from '@/lib/og/assets';
import {
  Label,
  OG_SIZE,
  OG_TYPE,
  OgFrame,
  Picture,
  Readouts,
  Title,
} from '@/lib/og/frame';
import { OG_LABELS } from '@/lib/og/labels';

export const alt = 'En spiller i Gamernes Gamer med titler og snittplassering';
export const size = OG_SIZE;
export const contentType = OG_TYPE;

interface Props {
  params: Promise<{ spiller: string }>;
}

// Prerendered with the pages, which are static too.
export function generateStaticParams() {
  return getAllPlayerSlugs().map((spiller) => ({ spiller }));
}

export default async function Image({ params }: Props) {
  const { spiller } = await params;
  const career = await getCareerView(spiller);
  if (!career) notFound();

  const { hero, ledger, trophies } = career;
  const titles = trophies.filter((t) => t.kind === 'season-gold').length;
  const labels = OG_LABELS.career;

  return new ImageResponse(
    <OgFrame
      aside={
        hero.imagePath && (
          <Picture
            src={await publicImage(hero.imagePath)}
            width={440}
            diagonal
          />
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Title>{hero.name}</Title>
          <Label size={24}>{hero.nickname}</Label>
        </div>
        <Readouts
          items={[
            { label: labels.titles, value: titles, accent: titles > 0 },
            {
              label: labels.average,
              value: ledger.averagePlacement.toFixed(1),
            },
            { label: labels.points, value: ledger.careerPoints },
          ]}
        />
      </div>
    </OgFrame>,
    { ...size, fonts: await ogFonts() },
  );
}
