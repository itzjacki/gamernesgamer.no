import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC = path.join(process.cwd(), 'public');

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
};

/**
 * A `public/` file (site-relative path, e.g. `/images/heroes/jakob.png`) as a
 * data URI. Images render at build time, where there is no server to fetch a
 * site-relative URL from. Satori can't decode WebP, so a .webp throws.
 */
export async function publicImage(rel: string): Promise<string> {
  const ext = path.extname(rel).slice(1).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error(`OG image: unsupported format ${rel}`);
  const data = await readFile(path.join(PUBLIC, rel));
  return `data:${mime};base64,${data.toString('base64')}`;
}

/**
 * `Display` is Neue Montreal Extrabold, `Body` its Regular. The site loads
 * Martian Mono through next/font, which Satori can't read, so the images use
 * a static .ttf of it (OFL, licence beside it).
 */
export async function ogFonts() {
  const [extrabold, regular, mono] = await Promise.all([
    readFile(path.join(PUBLIC, 'fonts', 'PPNeueMontreal-Extrabold.otf')),
    readFile(path.join(PUBLIC, 'fonts', 'PPNeueMontreal-Regular.otf')),
    readFile(path.join(PUBLIC, 'fonts', 'MartianMono-Regular.ttf')),
  ]);
  return [
    { name: 'Display', data: extrabold, weight: 800 as const },
    { name: 'Body', data: regular, weight: 400 as const },
    { name: 'Mono', data: mono, weight: 400 as const },
  ];
}
