import type {
  RecordEntry,
  RecordKey,
  RecordsView,
} from '@/lib/results/view-models';
import type { Props as RecordPlateProps } from '@/components/RecordPlate';
import RecordLines from '@/components/RecordLines';

/** A new record is a plate here; /records and the front page both read it. */
export interface RecordPlateGroup {
  label: string;
  plates: RecordPlateProps[];
}

/** "S1–S4", or "S3" for a single season. */
function seasonSpan(numbers: number[]) {
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  return first === last ? `S${first}` : `S${first}–S${last}`;
}

const count = (entry: RecordEntry) => String(entry.value);
/** Uses a real minus (U+2212). */
const signed = (n: number) =>
  n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0';
const rate = (entry: RecordEntry) =>
  `${Math.round((entry.value / (entry.outOf || 1)) * 100)}%`;

// Popover rows behind each record's number. Records about plain games use
// RecordPlate's default list.

const matchLines = (entry: RecordEntry) => (
  <RecordLines
    lines={(entry.matchLines ?? []).map((line) => ({
      key: `${line.seasonSlug}-${line.gameSlug}`,
      game: line,
      seasonNumber: line.seasonNumber,
      value: (
        <>
          {line.count}
          <span aria-hidden='true'>/</span>
          <span className='sr-only'> av </span>
          {line.outOf}
        </>
      ),
    }))}
  />
);

const matchList = (entry: RecordEntry) => (
  <RecordLines
    lines={(entry.matches ?? []).map((match, index) => ({
      key: `${match.seasonSlug}-${match.gameSlug}-${index}`,
      game: match,
      seasonNumber: match.seasonNumber,
      value: `${match.gamesWon}–${match.gamesLost}`,
    }))}
  />
);

const seasonPointLines = (entry: RecordEntry) => (
  <RecordLines
    lines={(entry.seasonPoints ?? []).map((line) => ({
      key: line.season.seasonSlug,
      seasonNumber: line.season.seasonNumber,
      value: line.points,
    }))}
  />
);

const powerUpLines = (entry: RecordEntry) => (
  <RecordLines
    lines={entry.games.map((game) => ({
      key: `${game.seasonSlug}-${game.gameSlug}`,
      game,
      seasonNumber: game.seasonNumber,
      value: signed(game.powerUpDelta ?? 0),
    }))}
  />
);

const rivalryLines = (entry: RecordEntry) => (
  <RecordLines
    lines={(entry.pair?.seasons ?? []).map((line) => ({
      key: line.season.seasonSlug,
      seasonNumber: line.season.seasonNumber,
      value: `${line.ahead}–${line.behind}`,
    }))}
  />
);

const tiebreakLines = (entry: RecordEntry) => (
  <RecordLines
    lines={(entry.tiebreaks ?? []).map((t) => ({
      key: `${t.season.seasonSlug}-${t.opponent.slug}`,
      seasonNumber: t.season.seasonNumber,
      text: `${t.won ? 'Vant mot' : 'Tapte mot'} ${t.opponent.name}`,
    }))}
  />
);

/** `scope`: whether the stamp covers all seasons or only the holder's games. */
export interface RecordPlateDefinition extends Omit<
  RecordPlateProps,
  'scope' | 'entries'
> {
  group: string;
  scope: 'all' | 'games';
}

/**
 * In wall order; groups follow the order they first appear in. Typed against
 * `RecordKey`, so a record without a plate is a type error.
 */
export const RECORD_PLATES: Record<RecordKey, RecordPlateDefinition> = {
  mostGameWins: {
    group: 'Seire',
    id: 'flest-seire',
    label: 'Flest spillseire',
    scope: 'all',
    figure: count,
    unit: () => 'spill vunnet',
    detailLabel: 'Vis spillene',
  },
  titleSpecialist: {
    group: 'Seire',
    id: 'serie-ett-spill',
    label: 'Flest seire i ett spill',
    scope: 'all',
    figure: count,
    unit: (e) => `av ${e.outOf} · ${e.title?.name}`,
    detailLabel: 'Vis spillene',
  },
  homeTurf: {
    group: 'Seire',
    id: 'seire-eget-spill',
    label: 'Flest seire i eget spill',
    scope: 'all',
    figure: count,
    unit: (e) => `seire av ${e.outOf} egne spill`,
    detailLabel: 'Vis spillene',
  },
  awayWins: {
    group: 'Seire',
    id: 'upsets',
    label: 'Flest upsets',
    scope: 'all',
    figure: count,
    unit: (e) => `seire av ${e.outOf} i andres spill`,
    detailLabel: 'Vis spillene',
  },
  homeAdvantage: {
    group: 'Seire',
    id: 'hjemmebanefordel',
    label: 'Hjemmebanefordel',
    scope: 'all',
    figure: (e) => signed(Number(e.value.toFixed(2))),
    unit: (e) =>
      `plasser bedre i egne spillvalg · ${e.split?.own.toFixed(2)} vs ${e.split?.others.toFixed(2)}`,
    detailLabel: 'Vis egne spillvalg',
  },
  winsLeader: {
    group: 'Seire',
    id: 'seiersleder',
    label: 'Lengst på tronen',
    scope: 'all',
    figure: count,
    unit: () => `runder som personen med flest seire totalt`,
    detailLabel: 'Vis spillene',
  },
  longestWinStreak: {
    group: 'Sesonger og streaks',
    id: 'win-streak',
    label: 'Lengste win streak',
    scope: 'games',
    figure: count,
    unit: () => 'seire på rad',
    detailLabel: 'Vis spillene',
  },
  longestTopTwoStreak: {
    group: 'Sesonger og streaks',
    id: 'topp-to-rekke',
    label: 'Lengste topp 2-streak',
    scope: 'games',
    figure: count,
    unit: () => 'spill på rad i topp 2',
    detailLabel: 'Vis spillene',
  },
  longestTopThreeStreak: {
    group: 'Sesonger og streaks',
    id: 'topp-tre-rekke',
    label: 'Lengste topp 3-streak',
    scope: 'games',
    figure: count,
    unit: () => 'spill på rad i topp 3',
    detailLabel: 'Vis spillene',
  },
  bestSeason: {
    group: 'Sesonger og streaks',
    id: 'beste-sesong',
    label: 'Beste sesong',
    scope: 'games',
    figure: (e) => e.value.toFixed(2),
    unit: (e) => `snittplassering · ${e.outOf} spill`,
    detailLabel: 'Vis spillene',
  },
  seasonCloser: {
    group: 'Sesonger og streaks',
    id: 'finisheren',
    label: 'Beste finisher',
    scope: 'all',
    figure: (e) => e.value.toFixed(2),
    unit: () => `snitt i sesongens siste spill`,
    detailLabel: 'Vis spillene',
  },
  seasonOpener: {
    group: 'Sesonger og streaks',
    id: 'apneren',
    label: 'Beste åpner',
    scope: 'all',
    figure: (e) => e.value.toFixed(2),
    unit: () => `snitt i sesongens første spill`,
    detailLabel: 'Vis spillene',
  },
  totalPoints: {
    group: 'Poeng',
    id: 'flest-poeng',
    label: 'Flest poeng',
    scope: 'all',
    figure: count,
    unit: (e) => `poeng over ${e.outOf} sesonger`,
    detailLabel: 'Vis sesongene',
    detail: seasonPointLines,
  },
  powerUpPoints: {
    group: 'Poeng',
    id: 'power-up-poeng',
    label: 'Flest power-up-poeng',
    scope: 'games',
    figure: (e) => signed(e.value),
    unit: (e) => `poeng fått direkte fra power-ups · ${e.outOf} spill`,
    detailLabel: 'Vis spillene',
    detail: powerUpLines,
  },
  matchWins: {
    group: 'Matcher',
    id: 'h2h-seire',
    label: 'Best i H2H-matcher',
    scope: 'all',
    figure: rate,
    unit: (e) => `av matcher vunnet · ${e.value} av ${e.outOf}`,
    detailLabel: 'Vis matchene per spill',
    detail: matchLines,
  },
  matchSweeps: {
    group: 'Matcher',
    id: 'series-sweeps',
    label: 'Flest series sweepa',
    scope: 'all',
    figure: rate,
    unit: (e) => `av bo3s/bo5s sweepa · ${e.value} av ${e.outOf}`,
    detailLabel: 'Vis matchene per spill',
    detail: matchLines,
  },
  matchDeciders: {
    group: 'Matcher',
    id: 'series-clutches',
    label: 'Flest series clutcha',
    scope: 'all',
    figure: rate,
    unit: (e) => `av bo3/bo5 deciders vunnet · ${e.value} av ${e.outOf}`,
    detailLabel: 'Vis matchene per spill',
    detail: matchLines,
  },
  finals: {
    group: 'Matcher',
    id: 'finaler',
    label: 'Flest finaler vunnet',
    scope: 'all',
    figure: rate,
    unit: (e) => `av finaler vunnet · ${e.value} av ${e.outOf}`,
    detailLabel: 'Vis finalene',
    detail: matchLines,
  },
  flawlessGames: {
    group: 'Matcher',
    id: 'perfekte-brackets',
    label: 'Perfekte brackets',
    scope: 'all',
    figure: count,
    unit: () => 'H2H-spill vunnet uten å tape en match',
    detailLabel: 'Vis spillene',
    detail: matchLines,
  },
  opponentStreak: {
    group: 'Matcher',
    id: 'tak-pa-motstander',
    label: 'Lengste tak på motstander',
    scope: 'all',
    figure: count,
    unit: () => 'H2H-seiere på rad',
    detailLabel: 'Vis matchene',
    detail: matchList,
    pairLink: (e) => ({
      text: `${e.player.name} mot ${e.opponent?.name}`,
      href: `/vs/${e.player.slug}/${e.opponent?.slug}`,
    }),
  },
  rivalries: {
    group: 'Matcher',
    id: 'jevneste-rivaleri',
    label: 'Jevneste rivaleri',
    scope: 'all',
    figure: (e) => `${e.pair?.ahead}–${e.pair?.behind}`,
    unit: () => 'innbyrdes score i spill',
    detailLabel: 'Vis per sesong',
    detail: rivalryLines,
    pairLink: (e) => ({
      text: `${e.player.name} – ${e.partner?.name}`,
      href: `/vs/${e.player.slug}/${e.partner?.slug}`,
    }),
  },
  tiebreaks: {
    group: 'Matcher',
    id: 'tiebreaker-spill',
    label: 'Best i tiebreaker-spill',
    scope: 'all',
    figure: rate,
    unit: (e) => `av tiebreaker-spill vunnet · ${e.value} av ${e.outOf}`,
    detailLabel: 'Vis sesongene',
    detail: tiebreakLines,
  },
};

export function recordPlateGroups(records: RecordsView): RecordPlateGroup[] {
  const allSeasons = seasonSpan(records.seasons.map((s) => s.seasonNumber));
  const gameScope = (entries: RecordEntry[]) => {
    const holder = entries.find((e) => e.rank === 1);
    return holder && holder.games.length > 0
      ? seasonSpan(holder.games.map((g) => g.seasonNumber))
      : allSeasons;
  };

  const groups: RecordPlateGroup[] = [];
  for (const key of Object.keys(RECORD_PLATES) as RecordKey[]) {
    const { group, scope, ...plate } = RECORD_PLATES[key];
    const entries = records[key];
    let current = groups.at(-1);
    if (current?.label !== group) {
      current = { label: group, plates: [] };
      groups.push(current);
    }
    current.plates.push({
      ...plate,
      scope: scope === 'games' ? gameScope(entries) : allSeasons,
      entries,
    });
  }
  return groups;
}
