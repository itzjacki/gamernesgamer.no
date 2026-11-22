/** SVG textures for the card's prints, as CSS `url()` values. Pure. */

function svgUrl(viewBox: string, body: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}'>${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** A matte coating's grain: white fractal noise, tiled. */
export const MATTE_GRAIN = svgUrl(
  '0 0 160 160',
  `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0'/></filter><rect width='160' height='160' filter='url(#n)'/>`,
);
