import Link from 'next/link';
import { getRecordsView } from '@/lib/results/queries';
import type { RecordEntry } from '@/lib/results/view-models';
import RecordPlate from '@/components/RecordPlate';
import FrontHero from '../_components/FrontHero';
import VsPicker from '../_components/VsPicker';
import {
  dayIndex,
  getHeroData,
  getPickerPlayers,
  getSeasonRows,
} from '../_components/data';
import s from '../proto.module.css';

// PROTOTYPE — the front page: hero (with lifecycle/variant switcher) plus the
// below-the-fold flow. Real data throughout; bracketed text is placeholder copy.

export const dynamic = 'force-dynamic';

const count = (e: RecordEntry) => String(e.value);

export default async function ProtoFrontPage() {
  const [hero, seasons, records] = await Promise.all([
    getHeroData(),
    getSeasonRows(),
    getRecordsView(),
  ]);
  const { players, pairs } = getPickerPlayers();

  // "Dagens rekord": one plate per day, the same for everyone (seeded by date).
  // Labels and units are the ones already reviewed on /records.
  const nums = records.seasons.map((x) => x.seasonNumber);
  const scope = `S${Math.min(...nums)}–S${Math.max(...nums)}`;
  const pool = [
    {
      id: 'flest-seire',
      label: 'Flest spillseire',
      entries: records.mostGameWins,
      unit: () => 'spill vunnet',
    },
    {
      id: 'serie-ett-spill',
      label: 'Flest seire i ett spill',
      entries: records.titleSpecialist,
      unit: (e: RecordEntry) => `av ${e.outOf} · ${e.title?.name}`,
    },
    {
      id: 'seire-eget-spill',
      label: 'Flest seire i eget spill',
      entries: records.homeTurf,
      unit: (e: RecordEntry) => `seire av ${e.outOf} egne spill`,
    },
    {
      id: 'upsets',
      label: 'Flest upsets',
      entries: records.awayWins,
      unit: (e: RecordEntry) => `seire av ${e.outOf} i andres spill`,
    },
  ];
  const plate = pool[dayIndex() % pool.length];

  return (
    <>
      <FrontHero data={hero} />

      <section className={s.band}>
        <div className={s.bandHead}>
          <span className={s.ph}>[Sesongene]</span>
          <Link href='/sesong/04'>Alle sesonger</Link>
        </div>
        <div>
          <Link href='#' className={s.seasonRow}>
            <span className={s.seasonNum}>
              {String(hero.nextSeasonNumber).padStart(2, '0')}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={s.miniDim}
              src='/images/branding/trophy.svg'
              alt=''
            />
            <span
              className={s.champ}
              style={{ color: 'var(--color-text-muted)' }}
            >
              —
            </span>
            <span className={`${s.rest} ${s.ph}`}>[kommer]</span>
            <span className={s.meta}>[dato]</span>
          </Link>
          {seasons.map((row, i) => (
            <Link
              key={row.slug}
              href={`/sesong/${row.slug}`}
              className={s.seasonRow}
            >
              <span className={s.seasonNum}>{row.slug}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={s.mini}
                src='/images/branding/trophy.svg'
                alt=''
              />
              <span className={`${s.champ} ${i === 0 ? s.champLatest : ''}`}>
                {row.champion}
              </span>
              <span className={s.rest}>{row.rest.join(' · ')}</span>
              <span className={s.meta}>
                {row.date}
                <br />
                {row.games} spill
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={s.band}>
        <div className={s.bandHead}>
          <span className={s.ph}>[Dagens rekord]</span>
          <Link href={`/records#${plate.id}`}>Alle rekorder</Link>
        </div>
        <RecordPlate
          id={`dagens-${plate.id}`}
          label={plate.label}
          scope={scope}
          entries={plate.entries}
          figure={count}
          unit={plate.unit}
          detailLabel='Vis spillene'
        />
      </section>

      <section className={s.band}>
        <div className={s.bandHead}>
          <span className={s.ph}>[Spillerne]</span>
          <Link href='/spillere'>Alle spillere</Link>
        </div>
        <div className={s.strip}>
          {players.map((p) => (
            <Link key={p.slug} href={`/spillere/${p.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt='' />
              <span>{p.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={s.band}>
        <div className={s.bandHead}>
          <span className={s.ph}>[Hvem er best av to?]</span>
          <Link href='/proto/vs'>VS-velgeren</Link>
        </div>
        <VsPicker players={players} pairs={pairs} />
      </section>

      <footer className={s.footer}>Gamernes Gamer · {scope}</footer>
    </>
  );
}
