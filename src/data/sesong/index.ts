import type { Game } from '@/types/game';
import type { Gamer } from '@/types/gamer';
import type { PowerUp } from '@/types/power-up';
import type { SeasonMeta } from '@/types/season-meta';

import * as s01 from './01';
import * as s02 from './02';
import * as s03 from './03';
import * as s04 from './04';

export type SeasonData = {
  meta: SeasonMeta;
  games: Game[];
  gamers: Gamer[];
  powerUps?: PowerUp[];
  curses?: PowerUp[];
};

export const seasonData = {
  '01': { meta: s01.meta, games: s01.games, gamers: s01.gamers },
  '02': {
    meta: s02.meta,
    games: s02.games,
    gamers: s02.gamers,
    powerUps: s02.powerUps,
  },
  '03': {
    meta: s03.meta,
    games: s03.games,
    gamers: s03.gamers,
    powerUps: s03.powerUps,
  },
  '04': {
    meta: s04.meta,
    games: s04.games,
    gamers: s04.gamers,
    powerUps: s04.powerUps,
    curses: s04.curses,
  },
} as const satisfies Record<string, SeasonData>;

export type Season = keyof typeof seasonData;

export function isSeason(value: string | undefined): value is Season {
  return value !== undefined && value in seasonData;
}

export const currentSeason: Season = '04';
