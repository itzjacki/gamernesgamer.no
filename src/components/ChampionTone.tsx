/**
 * The champion picture's tone: greyscale like every portrait, with the
 * midtones pulled toward the accent red so the picture belongs to the red-lit
 * scene. Apply with `CHAMPION_TONE`; render this once beside the picture.
 * Filter tables can't read CSS tokens, so the numbers approximate `bg` in the
 * shadows and the accent hue in the mids.
 */
export const CHAMPION_TONE = '[filter:url(#champion-tone)]';

export default function ChampionTone() {
  return (
    <svg
      width='0'
      height='0'
      className='absolute'
      aria-hidden
      focusable='false'
    >
      <filter id='champion-tone' colorInterpolationFilters='sRGB'>
        {/* Luminance to grey; the tables below set the tone. */}
        <feColorMatrix
          type='matrix'
          values='0.2126 0.7152 0.0722 0 0
                  0.2126 0.7152 0.0722 0 0
                  0.2126 0.7152 0.0722 0 0
                  0      0      0      1 0'
        />
        <feComponentTransfer>
          <feFuncR type='table' tableValues='0.07 0.30 0.62 0.86 0.98' />
          <feFuncG type='table' tableValues='0.07 0.13 0.30 0.64 0.92' />
          <feFuncB type='table' tableValues='0.08 0.15 0.33 0.66 0.92' />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}
