import { ImageResponse } from 'next/og';
import { getRecordsView } from '@/lib/results/queries';
import { ogFonts } from '@/lib/og/assets';
import { COLOR, Label, OG_SIZE, OG_TYPE, OgFrame, Title } from '@/lib/og/frame';

export const alt = 'Rekordene i Gamernes Gamer og sammenlagtlista';
export const size = OG_SIZE;
export const contentType = OG_TYPE;

const ASIDE = 520;
const ROWS = 5;

export default async function Image() {
  const { board, seasons } = await getRecordsView();
  const first = seasons[0]?.seasonNumber;
  const last = seasons.at(-1)?.seasonNumber;

  return new ImageResponse(
    <OgFrame
      asideWidth={ASIDE}
      aside={
        board.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
              padding: '0 56px',
              gap: 24,
            }}
          >
            <Label>Sammenlagtscore</Label>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: `1px solid ${COLOR.border}`,
              }}
            >
              {board.slice(0, ROWS).map((row) => (
                <div
                  key={row.player.slug}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 80,
                    gap: 28,
                    borderBottom: `1px solid ${COLOR.border}`,
                  }}
                >
                  <div style={{ display: 'flex', width: 24 }}>
                    <Label
                      size={24}
                      color={
                        row.rank === 1 ? COLOR.textAccent : COLOR.textMuted
                      }
                    >
                      {String(row.rank)}
                    </Label>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flex: 1,
                      fontFamily: 'Display',
                      fontSize: 40,
                      color: row.rank === 1 ? COLOR.textAccent : COLOR.text,
                    }}
                  >
                    {row.player.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontFamily: 'Display',
                      fontSize: 40,
                      color: row.rank === 1 ? COLOR.textAccent : COLOR.text,
                    }}
                  >
                    {String(row.placementPoints)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : undefined
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Title>Rekorder</Title>
        {first !== undefined && (
          <Label size={24}>
            {first === last ? `S${first}` : `S${first}–S${last}`}
          </Label>
        )}
      </div>
    </OgFrame>,
    { ...size, fonts: await ogFonts() },
  );
}
