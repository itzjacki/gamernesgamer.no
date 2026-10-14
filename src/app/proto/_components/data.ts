import 'server-only';

import { existsSync } from 'node:fs';
import path from 'node:path';
import { seasonData, type Season } from '@/data/sesong';
import { allPlayers } from '@/lib/players/roster';
import {
  findHeroImage,
  getAllPairSlugs,
  getRecordsView,
  getSeasonView,
} from '@/lib/results/queries';
import type { HeroData } from './FrontHero';
import type { PickerPlayer } from './VsPicker';

/*
 * PROTOTYPE — the front page's data, assembled from the real results layer and
 * static season data. Nothing here is new derivation; it reads what the
 * season, records and player pages already read.
 */

/** "13/12/2025 – 14/12/2025" → its first and last dates. */
function parseDates(raw: string) {
  const dates = [...raw.matchAll(/(\d{2})\/(\d{2})\/(\d{4})/g)].map(
    ([, d, m, y]) => new Date(`${y}-${m}-${d}T12:00:00`),
  );
  return { start: dates[0], end: dates[dates.length - 1] };
}

const fmt = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

export interface SeasonRowData {
  slug: Season;
  number: number;
  date: string;
  /** ISO start date, for timeline layouts. */
  startIso: string;
  champion: string;
  rest: string[];
  games: number;
}

export async function getSeasonRows(): Promise<SeasonRowData[]> {
  const slugs = Object.keys(seasonData).sort() as Season[];
  const rows = await Promise.all(
    slugs.map(async (slug) => {
      const view = await getSeasonView(Number(slug));
      if (!view || view.standings.length === 0) return null;
      return {
        slug,
        number: Number(slug),
        date: fmt(parseDates(seasonData[slug].meta.date).start),
        startIso: parseDates(seasonData[slug].meta.date).start.toISOString(),
        champion: view.standings[0].player.name,
        rest: view.standings.slice(1).map((r) => r.player.name),
        games: view.games.length,
      };
    }),
  );
  return rows.filter((r): r is SeasonRowData => r !== null).reverse();
}

export function getPickerPlayers(): {
  players: PickerPlayer[];
  pairs: string[];
} {
  return {
    players: allPlayers().map((p) => ({
      slug: p.slug,
      name: p.name,
      image: findHeroImage(p.slug) ?? p.latest.imagePath,
    })),
    pairs: getAllPairSlugs().map((p) => `${p.a}|${p.b}`),
  };
}

export async function getHeroData(): Promise<HeroData> {
  const slugs = Object.keys(seasonData).sort() as Season[];
  const latestSlug = [...slugs]
    .reverse()
    .find((s) => seasonData[s].meta.status === 'finished')!;
  const [latest, records, seasons] = await Promise.all([
    getSeasonView(Number(latestSlug)),
    getRecordsView(),
    getSeasonRows(),
  ]);
  const [first, second] = latest!.standings;
  const championSlug = first.player.slug;
  const board = records.board.find((r) => r.player.slug === championSlug);
  const { start, end } = parseDates(seasonData[latestSlug].meta.date);
  const dateLabel =
    start.getTime() === end.getTime()
      ? fmt(start)
      : `${String(start.getDate()).padStart(2, '0')}–${fmt(end)}`;
  // A player who has never won, for the "crowned" demo.
  const winners = [...seasons].reverse().map((s) => s.champion);
  const newWinner =
    latest!.standings
      .map((r) => r.player.name)
      .find((n) => !winners.includes(n)) ?? 'William';

  const model = '/models/trophy.glb';
  return {
    champion: first.player.name,
    seasonNumber: Number(latestSlug),
    dateLabel,
    points: first.totalPoints,
    margin: first.totalPoints - (second?.totalPoints ?? 0),
    titles: board?.championships ?? 1,
    daysAsChampion: Math.max(
      0,
      Math.floor((Date.now() - end.getTime()) / 864e5),
    ),
    nextSeasonNumber: Number(latestSlug) + 1,
    winners,
    liveStandings: latest!.standings.map((r) => ({
      name: r.player.name,
      points: r.totalPoints,
    })),
    newWinner,
    modelUrl: existsSync(path.join(process.cwd(), 'public', model))
      ? model
      : null,
  };
}

/** Days since the epoch: the same index for everyone on a given day. */
export function dayIndex() {
  return Math.floor(Date.now() / 864e5);
}
