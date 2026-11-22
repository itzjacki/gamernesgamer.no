// Renders public/images/power-ups/*.svg into a contact sheet at card size
// and prints each piece's ink bounds, to check centring against the live
// area in the power-up-art skill. Output goes to the OS temp folder.
//
//   node scripts/power-up-art/preview.mjs
//
// sharp comes with Next.js; it is not a direct dependency.
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = path.join(import.meta.dirname, '../../public/images/power-ups');
const out = path.join(os.tmpdir(), 'power-up-art');
fs.mkdirSync(out, { recursive: true });

const W = 243;
const H = 162;
const SURFACE = [0x1c, 0x1d, 0x1f];

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.svg'))
  .sort();

const tiles = [];
for (const f of files) {
  const svg = fs.readFileSync(path.join(dir, f));
  // sharp's base density is 72 dpi: 72 is 1x, 216 is 3x.
  await sharp(svg, { density: 216 })
    .png()
    .toFile(path.join(out, f.replace('.svg', '.png')));
  const { data, info } = await sharp(svg, { density: 72 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  tiles.push({
    name: f,
    png: await sharp(svg, { density: 72 }).png().toBuffer(),
  });

  // Ink: pixels well off the surface (the faint grid stays below the bar).
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      const d =
        Math.abs(data[i] - SURFACE[0]) +
        Math.abs(data[i + 1] - SURFACE[1]) +
        Math.abs(data[i + 2] - SURFACE[2]);
      if (d > 40) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  }
  console.log(
    f.padEnd(34),
    `size ${x1 - x0}x${y1 - y0}`.padEnd(14),
    `centre ${Math.round((x0 + x1) / 2)},${Math.round((y0 + y1) / 2)}`,
  );
}

const cols = 4;
const gap = 16;
const label = 18;
const rows = Math.ceil(tiles.length / cols);
const layers = tiles.flatMap((t, i) => {
  const left = gap + (i % cols) * (W + gap);
  const top = gap + Math.floor(i / cols) * (H + label + gap);
  const text = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${label}"><text x="0" y="13" font-family="monospace" font-size="11" fill="#8a847e">${t.name}</text></svg>`;
  return [
    { input: t.png, left, top },
    { input: Buffer.from(text), left, top: top + H + 2 },
  ];
});
await sharp({
  create: {
    width: cols * W + (cols + 1) * gap,
    height: rows * (H + label) + (rows + 1) * gap,
    channels: 3,
    background: '#17181a',
  },
})
  .composite(layers)
  .png()
  .toFile(path.join(out, '_sheet.png'));

console.log(`\nSheet and 3x renders: ${out}`);
