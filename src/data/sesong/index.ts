import type { Game } from '@/types/game';
import type { Gamer } from '@/types/gamer';
import type { PowerUp } from '@/types/power-up';

import { games as games01 } from './01/games';
import { gamers as gamers01 } from './01/gamers';

import { games as games02 } from './02/games';
import { gamers as gamers02 } from './02/gamers';
import { powerUps as powerUps02 } from './02/power-ups';

import { games as games03 } from './03/games';
import { gamers as gamers03 } from './03/gamers';
import { powerUps as powerUps03 } from './03/power-ups';

import { games as games04 } from './04/games';
import { gamers as gamers04 } from './04/gamers';
import { powerUps as powerUps04, curses as curses04 } from './04/power-ups';

export type SeasonData = {
  games: Game[];
  gamers: Gamer[];
  powerUps?: PowerUp[];
  curses?: PowerUp[];
};

export const seasonData = {
  '01': { games: games01, gamers: gamers01 },
  '02': { games: games02, gamers: gamers02, powerUps: powerUps02 },
  '03': { games: games03, gamers: gamers03, powerUps: powerUps03 },
  '04': {
    games: games04,
    gamers: gamers04,
    powerUps: powerUps04,
    curses: curses04,
  },
} as const satisfies Record<string, SeasonData>;

export type Season = keyof typeof seasonData;

export const currentSeason: Season = '04';
