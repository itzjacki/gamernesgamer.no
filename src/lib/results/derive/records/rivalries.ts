import type {
  RecordEntry,
  RecordSeason,
  RecordsPlayerInput,
} from '../../view-models';
import { gameKey, seasonRef } from './helpers';
import { rankEntries, type UnrankedEntry } from './rank';

/**
 * PURE. Closest rivalry: for every pair, the games one finished ahead of the other
 * and the reverse, over the games both played. One entry per pair, the most
 * level first; pairs with the same gap share a rank. `player` is whoever is
 * ahead (the first by name when level).
 */
export function rivalries(players: RecordsPlayerInput[]): RecordEntry[] {
  const entries: UnrankedEntry[] = [];

  players.forEach((a, i) => {
    for (const b of players.slice(i + 1)) {
      const theirs = new Map(b.games.map((g) => [gameKey(g), g]));
      const seasons = new Map<
        number,
        { season: RecordSeason; first: number; second: number }
      >();
      let first = 0;
      let second = 0;
      let oneTwo = 0;
      let oneTwoFirst = 0;

      for (const mine of a.games) {
        const other = theirs.get(gameKey(mine));
        if (!other || mine.placement === other.placement) continue;
        const line = seasons.get(mine.seasonNumber) ?? {
          season: seasonRef(mine),
          first: 0,
          second: 0,
        };
        if (mine.placement < other.placement) {
          first += 1;
          line.first += 1;
        } else {
          second += 1;
          line.second += 1;
        }
        seasons.set(mine.seasonNumber, line);
        if (Math.max(mine.placement, other.placement) === 2) {
          oneTwo += 1;
          if (mine.placement === 1) oneTwoFirst += 1;
        }
      }
      if (first + second === 0) continue;

      // Lead with whoever is ahead; `a` precedes `b` by name when level.
      const flip =
        second > first ||
        (second === first && b.player.name.localeCompare(a.player.name) < 0);
      entries.push({
        player: flip ? b.player : a.player,
        partner: flip ? a.player : b.player,
        value: Math.abs(first - second),
        outOf: first + second,
        pair: {
          ahead: flip ? second : first,
          behind: flip ? first : second,
          oneTwo,
          oneTwoFirst: flip ? oneTwo - oneTwoFirst : oneTwoFirst,
          seasons: [...seasons.values()].map((line) => ({
            season: line.season,
            ahead: flip ? line.second : line.first,
            behind: flip ? line.first : line.second,
          })),
        },
        games: [],
      });
    }
  });

  return rankEntries(entries, (x, y) => x.value - y.value);
}
