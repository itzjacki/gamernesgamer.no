import Link from 'next/link';
import type { CareerTrophyView } from '@/lib/results/view-models';
import Popover from './Popover';
import TrophyIcon from './TrophyIcon';
import styles from './TrophyShelf.module.css';

/** Trophies arrive pre-sorted. */

interface Props {
  trophies: CareerTrophyView[];
}

function trophyLabel(t: CareerTrophyView): { main: string; sub?: string } {
  if (t.kind === 'game-gold') {
    return { main: t.gameTitle ?? '', sub: `Sesong ${t.seasonNumber}` };
  }
  const place =
    t.kind === 'season-gold'
      ? '1. plass'
      : t.kind === 'season-silver'
        ? '2. plass'
        : '3. plass';
  return { main: `Gamernes Gamer - ${place}`, sub: `Sesong ${t.seasonNumber}` };
}

function trophyHref(t: CareerTrophyView): string {
  return t.kind === 'game-gold'
    ? `/sesong/${t.seasonSlug}/${t.gameSlug}`
    : `/sesong/${t.seasonSlug}`;
}

function trophyId(t: CareerTrophyView, i: number): string {
  return t.kind === 'game-gold'
    ? `trophy-s${t.seasonNumber}-${t.gameSlug}-${i}`
    : `trophy-s${t.seasonNumber}-${t.kind}-${i}`;
}

export default function TrophyShelf({ trophies }: Props) {
  if (trophies.length === 0) return null;

  return (
    <ul className='flex flex-wrap items-center gap-2'>
      {trophies.map((t, i) => {
        const id = trophyId(t, i);
        const label = trophyLabel(t);
        const ariaLabel = label.sub
          ? `${label.main}, ${label.sub}`
          : label.main;

        return (
          <li key={id}>
            <Popover
              id={id}
              tone='none'
              className={styles.trigger}
              label={ariaLabel}
              panel={
                <>
                  <span className={styles.label}>
                    {label.main}
                    {label.sub && (
                      <span className={styles.sub}>{label.sub}</span>
                    )}
                  </span>
                  <Link href={trophyHref(t)} className={styles.link}>
                    Gå til{t.kind === 'game-gold' ? ' spill' : ' sesong'}
                  </Link>
                </>
              }
            >
              <TrophyIcon kind={t.kind} />
            </Popover>
          </li>
        );
      })}
    </ul>
  );
}
