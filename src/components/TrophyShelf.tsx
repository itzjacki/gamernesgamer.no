import Link from 'next/link';
import type { CareerTrophyView } from '@/lib/results/view-models';
import TrophyIcon from './TrophyIcon';
import styles from './TrophyShelf.module.css';

/**
 * The trophy shelf — a Transfermarkt-style row of a player's honours, sitting
 * directly under the hero with NO section heading (it reads on its own). Each
 * trophy is a native-popover trigger (same no-JS pattern as GamePointsMatrix):
 * clicking/activating reveals a panel naming the honour and linking out to the
 * relevant season or game page. Keyboard-accessible, visible focus, >=44px.
 *
 * Two visual tiers (rendered by TrophyIcon):
 *  - season podium (gold/silver/bronze): the larger GG season trophy,
 *  - game-gold: a smaller, simpler token, visually subordinate.
 *
 * Trophies arrive pre-sorted (season trophies first, then game-golds).
 */

interface Props {
  trophies: CareerTrophyView[];
}

/* -------------------------------------------------------------------------- */

/**
 * Honour label parts.
 * `sub` is an optional secondary line (used for the game-gold season), rendered
 * smaller/muted beneath the main label.
 */
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

/** Where the trophy links: game-gold → game page, season → season page. */
function trophyHref(t: CareerTrophyView): string {
  return t.kind === 'game-gold'
    ? `/sesong/${t.seasonSlug}/${t.gameSlug}`
    : `/sesong/${t.seasonSlug}`;
}

/** A stable id per trophy for the popover + anchor-name bridge. */
function trophyId(t: CareerTrophyView, i: number): string {
  return t.kind === 'game-gold'
    ? `trophy-s${t.seasonNumber}-${t.gameSlug}-${i}`
    : `trophy-s${t.seasonNumber}-${t.kind}-${i}`;
}

/* -------------------------------------------------------------------------- */

export default function TrophyShelf({ trophies }: Props) {
  if (trophies.length === 0) return null;

  return (
    <ul className='flex flex-wrap items-center gap-2'>
      {trophies.map((t, i) => {
        const id = trophyId(t, i);
        const anchorStyle = { '--anchor': `--${id}` } as React.CSSProperties;
        const label = trophyLabel(t);
        const ariaLabel = label.sub
          ? `${label.main}, ${label.sub}`
          : label.main;

        return (
          <li key={id}>
            <button
              type='button'
              popoverTarget={id}
              className={styles.trigger}
              style={anchorStyle}
              aria-label={ariaLabel}
            >
              <TrophyIcon kind={t.kind} />
            </button>

            <div
              id={id}
              popover='auto'
              className={styles.popover}
              style={anchorStyle}
            >
              <span className={styles.label}>
                {label.main}
                {label.sub && <span className={styles.sub}>{label.sub}</span>}
              </span>
              <Link href={trophyHref(t)} className={styles.link}>
                Gå til{t.kind === 'game-gold' ? ' spill' : ' sesong'}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
