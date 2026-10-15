import 'server-only';

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { inflateSync } from 'node:zlib';

/**
 * Reads the pixel logo (`public/images/branding/logo-pixel.png`, drawn by
 * Jakob) into a bitmap, so the header can draw it as crisp, recolourable SVG
 * squares — the PNG stays the source of truth.
 *
 * A deliberately small PNG decoder: 8-bit, non-interlaced, RGBA or
 * grey + alpha, which is what the logo is. Anything else throws, so a
 * re-export in another format fails loudly at build time instead of
 * rendering garbage.
 */

export interface PixelBitmap {
  width: number;
  height: number;
  /** One string per row; '#' = opaque pixel, '.' = transparent. */
  rows: string[];
}

const LOGO = path.join(
  process.cwd(),
  'public',
  'images',
  'branding',
  'logo-pixel.png',
);

let cached: PixelBitmap | null = null;

/**
 * The decoded logo. Read from disk once per server process in production; in
 * development every time, so an edited PNG shows up without a restart.
 */
export function readPixelLogo(): PixelBitmap {
  if (process.env.NODE_ENV !== 'production') return decode(readFileSync(LOGO));
  cached ??= decode(readFileSync(LOGO));
  return cached;
}

function decode(buf: Buffer): PixelBitmap {
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat: Buffer[] = [];
  for (let i = 8; i < buf.length; ) {
    const len = buf.readUInt32BE(i);
    const type = buf.toString('ascii', i + 4, i + 8);
    const data = buf.subarray(i + 8, i + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      if (bitDepth !== 8 || interlace !== 0 || ![4, 6].includes(colorType)) {
        throw new Error(
          `logo-pixel.png: unsupported PNG (bit depth ${bitDepth}, colour type ${colorType}, interlace ${interlace}); export it as 8-bit RGBA`,
        );
      }
    } else if (type === 'IDAT') {
      idat.push(data);
    }
    i += 12 + len;
  }

  const bpp = colorType === 6 ? 4 : 2; // bytes per pixel
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(stride * height);
  // Undo the per-row filters (PNG spec §9).
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let pred = 0;
      if (filter === 1) pred = a;
      else if (filter === 2) pred = b;
      else if (filter === 3) pred = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y * stride + x] = (v + pred) & 0xff;
    }
  }

  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const alpha = out[y * stride + x * bpp + bpp - 1];
      row += alpha > 127 ? '#' : '.';
    }
    rows.push(row);
  }
  return { width, height, rows };
}
