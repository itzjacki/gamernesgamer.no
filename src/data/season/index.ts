import type { Game } from '@/types/game';
import type { Gamer } from '@/types/gamer';
import type { PowerUp } from '@/types/power-up';

import { games as games1 } from './1/games';
import { gamers as gamers1 } from './1/gamers';

import { games as games2 } from './2/games';
import { gamers as gamers2 } from './2/gamers';
import { powerUps as powerUps2 } from './2/power-ups';

import { games as games3 } from './3/games';
import { gamers as gamers3 } from './3/gamers';
import { powerUps as powerUps3 } from './3/power-ups';

import { games as games4 } from './4/games';
import { gamers as gamers4 } from './4/gamers';
import { powerUps as powerUps4, curses as curses4 } from './4/power-ups';

export type SeasonData = {
  games: Game[];
  gamers: Gamer[];
  powerUps?: PowerUp[];
  curses?: PowerUp[];
};

export const seasonData = {
  '1': { games: games1, gamers: gamers1 },
  '2': { games: games2, gamers: gamers2, powerUps: powerUps2 },
  '3': { games: games3, gamers: gamers3, powerUps: powerUps3 },
  '4': {
    games: games4,
    gamers: gamers4,
    powerUps: powerUps4,
    curses: curses4,
  },
} as const satisfies Record<string, SeasonData>;

export type Season = keyof typeof seasonData;

export function isSeason(value: string | undefined): value is Season {
  return value !== undefined && value in seasonData;
}

export const currentSeason: Season = '4';
