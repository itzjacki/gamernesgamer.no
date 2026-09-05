import type { Game } from '@/types/game';
import { games as games01 } from './01/games';
import { games as games02 } from './02/games';
import { games as games03 } from './03/games';
import { games as games04 } from './04/games';

export const gamesBySeason: Record<string, Game[]> = {
  '01': games01,
  '02': games02,
  '03': games03,
  '04': games04,
};
