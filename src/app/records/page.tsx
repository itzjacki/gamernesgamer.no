import type { Metadata } from 'next';
import { getRecordsView } from '@/lib/results/queries';
import type { RecordEntry } from '@/lib/results/view-models';
import Heading from '@/components/Heading';
import SectionLabel from '@/components/SectionLabel';
import CareerBoard from '@/components/CareerBoard';
import RecordLines from '@/components/RecordLines';
import RecordPlate from '@/components/RecordPlate';
import TagCrowns from '@/components/TagCrowns';

export const metadata: Metadata = {
  title: 'Rekorder',
};

/** "S1–S4" for a run of seasons, or just "S3" when it is one. */
function seasonSpan(numbers: number[]) {
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  return first === last ? `S${first}` : `S${first}–S${last}`;
}

const wall =
  'border-border bg-border grid grid-cols-1 gap-px border sm:grid-cols-2';
const count = (entry: RecordEntry) => String(entry.value);
/** A points delta with its sign, using a real minus (U+2212). */
const signed = (n: number) =>
  n > 0 ? `+${n}` : n < 0 ? `\u2212${Math.abs(n)}` : '0';
/** `value` as a share of `outOf`, as a whole percentage. */
const rate = (entry: RecordEntry) =>
  `${Math.round((entry.value / (entry.outOf || 1)) * 100)}%`;

/*
 * What sits behind each record's number, as rows for the plate's popover.
 * (Records about plain games use RecordPlate's default list.)
 */

/** Match records: per game, how many of its matches counted. */
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

/** Opponent streak: each match in the run, with its score. */
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

/** Total points: the total per season. */
const seasonPointLines = (entry: RecordEntry) => (
  <RecordLines
    lines={(entry.seasonPoints ?? []).map((line) => ({
      key: line.season.seasonSlug,
      seasonNumber: line.season.seasonNumber,
      value: line.points,
    }))}
  />
);

/** Power-up points: the signed delta per game. */
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

/** Closest rivalry: the pair's split per season. */
const rivalryLines = (entry: RecordEntry) => (
  <RecordLines
    lines={(entry.pair?.seasons ?? []).map((line) => ({
      key: line.season.seasonSlug,
      seasonNumber: line.season.seasonNumber,
      value: `${line.ahead}–${line.behind}`,
    }))}
  />
);

export default async function RecordsPage() {
  const records = await getRecordsView();

  const allSeasons = seasonSpan(records.seasons.map((s) => s.seasonNumber));
  /** The scope stamp for a record that is about particular games. */
  const gameScope = (entries: RecordEntry[]) => {
    const holder = entries.find((e) => e.rank === 1);
    return holder && holder.games.length > 0
      ? seasonSpan(holder.games.map((g) => g.seasonNumber))
      : allSeasons;
  };

  return (
    <>
      <section className='flex flex-col gap-4 pt-8'>
        <Heading as='h1' aboveLine='GG - Alle sesonger'>
          Rekorder
        </Heading>
      </section>

      {records.board.length > 0 && (
        <section id='sammenlagt' className='flex flex-col gap-6'>
          <SectionLabel>Sammenlagtscore</SectionLabel>
          <CareerBoard rows={records.board} seasons={records.seasons} />
        </section>
      )}

      <section id='rekorder' className='flex flex-col gap-10'>
        <div className='flex flex-col gap-6'>
          <SectionLabel>Seire</SectionLabel>
          <ul className={wall}>
            <RecordPlate
              id='flest-seire'
              label='Flest spillseire'
              scope={allSeasons}
              entries={records.mostGameWins}
              figure={count}
              unit={() => 'spill vunnet'}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='serie-ett-spill'
              label='Flest seire i ett spill'
              scope={allSeasons}
              entries={records.titleSpecialist}
              figure={count}
              unit={(e) => `av ${e.outOf} · ${e.title?.name}`}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='seire-eget-spill'
              label='Flest seire i eget spill'
              scope={allSeasons}
              entries={records.homeTurf}
              figure={count}
              unit={(e) => `seire av ${e.outOf} egne spill`}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='upsets'
              label='Flest upsets'
              scope={allSeasons}
              entries={records.awayWins}
              figure={count}
              unit={(e) => `seire av ${e.outOf} i andres spill`}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='hjemmebanefordel'
              label='Hjemmebanefordel'
              scope={allSeasons}
              entries={records.homeAdvantage}
              figure={(e) => signed(Number(e.value.toFixed(2)))}
              unit={(e) =>
                `plasser bedre i egne spillvalg · ${e.split?.own.toFixed(2)} vs ${e.split?.others.toFixed(2)}`
              }
              detailLabel='Vis egne spillvalg'
            />
            <RecordPlate
              id='seiersleder'
              label='Lengst på tronen'
              scope={allSeasons}
              entries={records.winsLeader}
              figure={count}
              unit={() => `runder som personen med flest seire totalt`}
              detailLabel='Vis spillene'
            />
          </ul>
        </div>

        <div className='flex flex-col gap-6'>
          <SectionLabel>Sesonger og streaks</SectionLabel>
          <ul className={wall}>
            <RecordPlate
              id='win-streak'
              label='Lengste win streak'
              scope={gameScope(records.longestWinStreak)}
              entries={records.longestWinStreak}
              figure={count}
              unit={() => 'seire på rad'}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='topp-to-rekke'
              label='Lengste topp 2-streak'
              scope={gameScope(records.longestTopTwoStreak)}
              entries={records.longestTopTwoStreak}
              figure={count}
              unit={() => 'spill på rad i topp 2'}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='topp-tre-rekke'
              label='Lengste topp 3-streak'
              scope={gameScope(records.longestTopThreeStreak)}
              entries={records.longestTopThreeStreak}
              figure={count}
              unit={() => 'spill på rad i topp 3'}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='beste-sesong'
              label='Beste sesong'
              scope={gameScope(records.bestSeason)}
              entries={records.bestSeason}
              figure={(e) => e.value.toFixed(2)}
              unit={(e) => `snittplassering · ${e.outOf} spill`}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='finisheren'
              label='Beste finisher'
              scope={allSeasons}
              entries={records.seasonCloser}
              figure={(e) => e.value.toFixed(2)}
              unit={() => `snitt i sesongens siste spill`}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='apneren'
              label='Beste åpner'
              scope={allSeasons}
              entries={records.seasonOpener}
              figure={(e) => e.value.toFixed(2)}
              unit={() => `snitt i sesongens første spill`}
              detailLabel='Vis spillene'
            />
          </ul>
        </div>

        <div className='flex flex-col gap-6'>
          <SectionLabel>Poeng</SectionLabel>
          <ul className={wall}>
            <RecordPlate
              id='flest-poeng'
              label='Flest poeng'
              scope={allSeasons}
              entries={records.totalPoints}
              figure={count}
              unit={(e) => `poeng over ${e.outOf} sesonger`}
              detailLabel='Vis sesongene'
              detail={seasonPointLines}
            />
            <RecordPlate
              id='power-up-poeng'
              label='Flest power-up-poeng'
              scope={gameScope(records.powerUpPoints)}
              entries={records.powerUpPoints}
              figure={(e) => signed(e.value)}
              unit={(e) =>
                `poeng fått direkte fra power-ups · ${e.outOf} spill`
              }
              detailLabel='Vis spillene'
              detail={powerUpLines}
            />
          </ul>
        </div>

        <div className='flex flex-col gap-6'>
          <SectionLabel>Matcher</SectionLabel>
          <ul className={wall}>
            <RecordPlate
              id='h2h-seire'
              label='Best i H2H-matcher'
              scope={allSeasons}
              entries={records.matchWins}
              figure={rate}
              unit={(e) => `av matcher vunnet · ${e.value} av ${e.outOf}`}
              detailLabel='Vis matchene per spill'
              detail={matchLines}
            />
            <RecordPlate
              id='series-sweeps'
              label='Flest series sweepa'
              scope={allSeasons}
              entries={records.matchSweeps}
              figure={rate}
              unit={(e) => `av bo3s/bo5s sweepa · ${e.value} av ${e.outOf}`}
              detailLabel='Vis matchene per spill'
              detail={matchLines}
            />
            <RecordPlate
              id='series-clutches'
              label='Flest series clutcha'
              scope={allSeasons}
              entries={records.matchDeciders}
              figure={rate}
              unit={(e) =>
                `av bo3/bo5 deciders vunnet · ${e.value} av ${e.outOf}`
              }
              detailLabel='Vis matchene per spill'
              detail={matchLines}
            />
            <RecordPlate
              id='finaler'
              label='Flest finaler vunnet'
              scope={allSeasons}
              entries={records.finals}
              figure={rate}
              unit={(e) => `av finaler vunnet · ${e.value} av ${e.outOf}`}
              detailLabel='Vis finalene'
              detail={matchLines}
            />
            <RecordPlate
              id='perfekte-brackets'
              label='Perfekte brackets'
              scope={allSeasons}
              entries={records.flawlessGames}
              figure={count}
              unit={() => 'H2H-spill vunnet uten å tape en match'}
              detailLabel='Vis spillene'
              detail={matchLines}
            />
            <RecordPlate
              id='tak-pa-motstander'
              label='Lengste tak på motstander'
              scope={allSeasons}
              entries={records.opponentStreak}
              figure={count}
              unit={() => 'H2H-seiere på rad'}
              detailLabel='Vis matchene'
              detail={matchList}
              pairLink={(e) => ({
                text: `${e.player.name} mot ${e.opponent?.name}`,
                href: `/vs/${e.player.slug}/${e.opponent?.slug}`,
              })}
            />
            <RecordPlate
              id='jevneste-rivaleri'
              label='Jevneste rivaleri'
              scope={allSeasons}
              entries={records.rivalries}
              figure={(e) => `${e.pair?.ahead}–${e.pair?.behind}`}
              unit={() => 'innbyrdes score i spill'}
              detailLabel='Vis per sesong'
              detail={rivalryLines}
              pairLink={(e) => ({
                text: `${e.player.name} – ${e.partner?.name}`,
                href: `/vs/${e.player.slug}/${e.partner?.slug}`,
              })}
            />
            <RecordPlate
              id='tiebreaker-spill'
              label='Best i tiebreaker-spill'
              scope={allSeasons}
              entries={records.tiebreaks}
              figure={rate}
              unit={(e) =>
                `av tiebreaker-spill vunnet · ${e.value} av ${e.outOf}`
              }
              detailLabel='Vis sesongene'
              detail={(entry) => (
                <RecordLines
                  lines={(entry.tiebreaks ?? []).map((t) => ({
                    key: `${t.season.seasonSlug}-${t.opponent.slug}`,
                    seasonNumber: t.season.seasonNumber,
                    text: `${t.won ? 'Vant mot' : 'Tapte mot'} ${t.opponent.name}`,
                  }))}
                />
              )}
            />
          </ul>
        </div>
      </section>

      <section id='kategorier' className='flex flex-col gap-6'>
        <SectionLabel>Best per spillkategori</SectionLabel>
        <TagCrowns
          crowns={records.tagCrowns}
          crownsWithoutOwnPicks={records.tagCrownsWithoutOwnPicks}
        />
      </section>
    </>
  );
}
