'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { HeroPlayer } from '@/lib/results/view-models';
import { PORTRAIT_TONE_HOVER } from './portrait-tone';

/**
 * The /vs hero, on the index and every pair page. The diagonal hairline
 * between the portraits is the page's only "vs": there is no lettering for
 * it. Each portrait is positioned against the whole plate so the two meet
 * across it.
 *
 * Each name is a player select: a drawn name + chevron on a hairline, with
 * the real select lying invisibly over that whole half of the plate (the
 * sides are not `relative`, so it sizes against the plate body). Once both
 * sides are picked and differ from the page's pair, it opens that pair's
 * page. Players who never shared a season are disabled, as in the header's VS
 * chooser. A picked side also gets a link to the player, above the select.
 */

interface Props {
  players: HeroPlayer[];
  /** "a|b" for every ordered pair with a /vs page. */
  pairs: string[];
  /** The page's pair; none on the /vs index. */
  initial?: { a: string; b: string };
  /** Which seasons and how many games the page covers. */
  scope: string;
  /** The headline reading (a PairRow). */
  children?: React.ReactNode;
}

type Side = 'a' | 'b';

/** Where the diagonal meets the top and bottom edge, in % of the portrait box. */
const TOP = 58;
const BOTTOM = 42;

const box =
  'absolute inset-x-0 bottom-0 h-40 sm:inset-x-auto sm:inset-y-0 sm:left-1/2 sm:h-auto sm:w-70 sm:-translate-x-1/2';

const clip = {
  a: `polygon(0 0, ${TOP}% 0, ${BOTTOM}% 100%, 0 100%)`,
  b: `polygon(${TOP}% 0, 100% 0, 100% 100%, ${BOTTOM}% 100%)`,
};

/** The field lights only while its select is hovered or keyboard-focused. */
const FIELD_ON =
  'group-has-[select:hover]:border-accent group-has-[select:hover]:text-text-accent group-has-[select:focus-visible]:border-accent group-has-[select:focus-visible]:text-text-accent group-has-[select:focus-visible]:outline-accent group-has-[select:focus-visible]:outline-2 group-has-[select:focus-visible]:outline-offset-4';

export default function PairHero({
  players,
  pairs,
  initial,
  scope,
  children,
}: Props) {
  const router = useRouter();
  const [picked, setPicked] = useState(initial ?? { a: '', b: '' });
  const pairSet = new Set(pairs);
  const find = (slug: string) => players.find((p) => p.slug === slug) ?? null;

  const pick = (side: Side, slug: string) => {
    const next = { ...picked, [side]: slug };
    setPicked(next);
    const isPage = next.a === initial?.a && next.b === initial?.b;
    if (!isPage && pairSet.has(`${next.a}|${next.b}`)) {
      router.push(`/vs/${next.a}/${next.b}`);
    }
  };

  const renderSide = (side: Side) => {
    const player = find(picked[side]);
    const other = picked[side === 'a' ? 'b' : 'a'];
    const placeholder = side === 'a' ? 'Spiller A' : 'Spiller B';
    return (
      // Not `relative`: the portrait and the select resolve against the
      // plate's body.
      <div
        className={`group flex min-w-0 flex-col gap-1 p-4 pb-44 sm:h-60 sm:justify-center sm:gap-2 sm:p-8 ${
          side === 'a'
            ? 'sm:pr-[10.75rem]'
            : 'items-end text-right sm:pl-[10.75rem]'
        }`}
      >
        <span
          aria-hidden='true'
          className={`border-border-accent flex max-w-full items-center gap-2 border-b pb-1 text-2xl font-extrabold tracking-tight uppercase transition-colors sm:gap-3 sm:pb-2 sm:text-4xl ${FIELD_ON} ${
            player ? 'text-text' : 'text-text-muted'
          }`}
        >
          <span className='min-w-0 truncate'>
            {player?.name ?? placeholder}
          </span>
          <svg
            viewBox='0 0 16 16'
            className='size-4 shrink-0 sm:size-6'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='square'
          >
            <path d='M3.5 6 8 10.5 12.5 6' />
          </svg>
        </span>
        <span className='text-text-muted max-w-full truncate font-mono text-xs tracking-wide sm:tracking-widest sm:uppercase'>
          {player?.nickname}
        </span>
        {player && (
          // Above the select; the padding makes a 44px target. Phones: at
          // the foot of the text, above the portrait. sm+: pinned to the
          // side's bottom corner, its text 32px (the side padding) from both
          // edges (18px offset + 14px padding).
          <Link
            href={`/spillere/${player.slug}`}
            className={`text-text-muted hover:text-text-accent focus-visible:text-text-accent focus-visible:outline-accent relative z-20 mt-auto -mb-3.5 py-3.5 font-mono text-xs tracking-wide underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 sm:absolute sm:bottom-4.5 sm:mt-0 sm:mb-0 sm:tracking-widest sm:uppercase ${
              side === 'a' ? 'sm:left-8' : 'sm:right-8'
            }`}
          >
            Gå til spiller
          </Link>
        )}

        <span
          aria-hidden='true'
          className={box}
          style={{ clipPath: clip[side] }}
        >
          {player?.imagePath && (
            <img
              src={player.imagePath}
              alt=''
              className={`absolute inset-y-0 h-full w-[58%] object-cover object-top ${PORTRAIT_TONE_HOVER} duration-150 ${
                side === 'a' ? 'left-0' : 'right-0'
              }`}
            />
          )}
        </span>

        <select
          aria-label={placeholder}
          value={picked[side]}
          onChange={(e) => pick(side, e.target.value)}
          className={`absolute inset-y-0 z-10 w-1/2 cursor-pointer appearance-none opacity-0 ${
            side === 'a' ? 'left-0' : 'right-0'
          }`}
        >
          <option value='' className='bg-bg text-text'>
            {placeholder}
          </option>
          {players.map((p) => (
            <option
              key={p.slug}
              value={p.slug}
              className='bg-bg text-text'
              disabled={
                !!other &&
                (p.slug === other || !pairSet.has(`${other}|${p.slug}`))
              }
            >
              {p.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <section className='border-border bg-bg border'>
      <p className='border-border text-text-muted flex h-10 items-center border-b px-4 font-mono text-xs tracking-wide uppercase sm:px-8 sm:tracking-widest'>
        {scope}
      </p>

      <div className='relative grid grid-cols-2'>
        {renderSide('a')}
        {renderSide('b')}

        <span
          aria-hidden='true'
          className={`border-border pointer-events-none border-t sm:border-x sm:border-t-0 ${box}`}
        >
          <svg
            viewBox='0 0 100 100'
            preserveAspectRatio='none'
            className='text-accent absolute inset-0 h-full w-full'
          >
            <line
              x1={TOP}
              y1='0'
              x2={BOTTOM}
              y2='100'
              stroke='currentColor'
              strokeWidth='1'
              vectorEffect='non-scaling-stroke'
            />
          </svg>
        </span>
      </div>

      {children && <div className='border-border border-t'>{children}</div>}
    </section>
  );
}
