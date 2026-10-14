'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { SeasonStatus } from '@/types/season-meta';
import DotMatrixLogo, { type LogoState } from './DotMatrixLogo';
import styles from './SiteHeader.module.css';

/**
 * The header bar (see SiteHeader for the server half).
 *
 * - The RAIL is a row of keys: a function number, the label, and a status LED
 *   instead of an underline. The LED is steady on the current section.
 * - The DISPLAY below shows one thing at a time. At rest it is the current
 *   page's readout (label over value, like an instrument screen). Two keys are
 *   CHOOSERS rather than links: Sesonger (there is no season index page — the
 *   display becomes one) and VS (a quick pair picker). While a chooser is
 *   showing, its key's LED blinks; Escape, a click outside, pressing the key
 *   again or navigating returns the display to the readout.
 * - On /vs pages the pair picker is itself the readout (pre-filled with the
 *   pair), so pressing VS there changes nothing but focus.
 * - Spillere and Rekorder are plain links: the common paths stay one click.
 */

export interface HeaderSeason {
  slug: string;
  number: number;
  /** First day, dd.mm.yyyy. */
  date: string;
  games: number;
  status: SeasonStatus;
  champion: { slug: string; name: string } | null;
}

export interface HeaderPlayer {
  slug: string;
  name: string;
  seasons: number;
  titles: number;
}

export interface HeaderData {
  currentSeason: string;
  seasons: HeaderSeason[];
  players: HeaderPlayer[];
  /** "a|b" for every ordered pair with a /vs page. */
  pairs: string[];
}

type Section = 'sesonger' | 'spillere' | 'rekorder' | 'vs';
type Chooser = 'seasons' | 'vs';

/** What the current path is about, for the readout and the lit key. */
function parsePath(pathname: string) {
  const [first, a, b] = pathname.split('/').filter(Boolean);
  if (first === 'sesong') return { section: 'sesonger' as const, season: a };
  if (first === 'spillere') return { section: 'spillere' as const, player: a };
  if (first === 'records') return { section: 'rekorder' as const };
  if (first === 'vs') return { section: 'vs' as const, a, b };
  return { section: null };
}

const pad = (n: number) => String(n).padStart(2, '0');

const KEY =
  'group border-border relative flex min-w-0 flex-1 flex-col justify-between border-r px-2 py-2 text-left font-mono transition-transform duration-75 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:translate-y-px sm:w-30 sm:flex-none lg:px-3 lg:py-2.5';
const SMALL_KEY =
  'grid size-7 shrink-0 place-items-center border font-mono text-[11px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const SELECT =
  'bg-display text-text hover:text-accent focus-visible:outline-accent h-full min-w-0 appearance-none px-3 font-mono text-xs font-medium tracking-wider uppercase focus-visible:outline-2 focus-visible:-outline-offset-2';

/** One label-over-value cell on the display. */
function Param({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className='border-border flex shrink-0 flex-col justify-center gap-1 border-r px-3 whitespace-nowrap'>
      <span className='text-text-muted font-mono text-[8px] tracking-[0.2em] uppercase'>
        {label}
      </span>
      <span
        className={`font-mono text-sm leading-none font-medium uppercase ${accent ? 'text-accent' : 'text-text'}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function SiteHeaderBar({ data }: { data: HeaderData }) {
  const pathname = usePathname();
  const router = useRouter();
  const route = parsePath(pathname);
  const headerRef = useRef<HTMLElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  // A chooser belongs to the page it was opened on, so navigating closes it
  // without an effect.
  const [opened, setOpened] = useState<{
    chooser: Chooser;
    path: string;
  } | null>(null);
  const chooser = opened?.path === pathname ? opened.chooser : null;
  const toggle = (c: Chooser) =>
    setOpened(chooser === c ? null : { chooser: c, path: pathname });

  useEffect(() => {
    if (!chooser) return;
    // Hand focus to the display so the chooser is reachable by keyboard.
    const display = displayRef.current;
    (
      display?.querySelector<HTMLElement>('[data-autofocus]') ??
      display?.querySelector<HTMLElement>('a, select, button')
    )?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Return focus to the key that opened the chooser.
      headerRef.current
        ?.querySelector<HTMLElement>(
          '[aria-controls="site-display"][aria-expanded="true"]',
        )
        ?.focus();
      setOpened(null);
    };
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpened(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [chooser]);

  const current = data.seasons.find((s) => s.slug === data.currentSeason);
  const latestDone = [...data.seasons].reverse().find((s) => s.champion);
  const logoState: LogoState =
    current?.status === 'live'
      ? 'live'
      : current?.status === 'upcoming'
        ? 'upcoming'
        : 'rest';

  // ---------------------------------------------------------------- keys
  // TODO(copy): key labels — best-effort.
  const keys: {
    section: Section;
    label: string;
    href?: string;
    chooser?: Chooser;
  }[] = [
    { section: 'sesonger', label: 'Sesonger', chooser: 'seasons' },
    { section: 'spillere', label: 'Spillere', href: '/spillere' },
    { section: 'rekorder', label: 'Rekorder', href: '/records' },
    { section: 'vs', label: 'VS', chooser: 'vs' },
  ];

  const renderKey = (k: (typeof keys)[number], index: number) => {
    const here = route.section === k.section;
    const choosing = !!k.chooser && chooser === k.chooser;
    const lit = here || choosing;
    const inner = (
      <>
        <span className='text-text-muted text-[9px] tracking-widest'>
          {pad(index + 1)}
        </span>
        <span
          aria-hidden='true'
          className={`absolute top-2 right-2 size-1.5 border lg:top-2.5 lg:right-3 ${
            lit ? 'border-accent bg-accent' : 'border-border-accent'
          } ${choosing ? styles.ledBlink : ''}`}
        />
        <span
          className={`group-hover:text-accent truncate text-[9px] tracking-normal uppercase sm:text-[10px] sm:tracking-wide lg:text-xs lg:tracking-widest ${
            lit ? 'text-text' : 'text-text-muted'
          }`}
        >
          {k.label}
        </span>
      </>
    );
    if (k.chooser) {
      return (
        <button
          key={k.section}
          type='button'
          className={`${KEY} cursor-pointer`}
          aria-label={k.label}
          aria-expanded={choosing}
          aria-controls='site-display'
          onClick={() => toggle(k.chooser!)}
        >
          {inner}
        </button>
      );
    }
    return (
      <Link
        key={k.section}
        href={k.href!}
        className={KEY}
        aria-label={k.label}
        aria-current={here ? 'page' : undefined}
      >
        {inner}
      </Link>
    );
  };

  // ---------------------------------------------------------------- display
  // TODO(copy): readout labels and the chooser labels below — best-effort.
  const readout = () => {
    if (route.section === 'sesonger') {
      const s = data.seasons.find((x) => x.slug === route.season);
      if (!s) return null;
      return (
        <>
          <Param label='Sesong' value={pad(s.number)} />
          <Param label='Dato' value={s.date} />
          <Param label='Spill' value={s.games} />
          <Param
            label='Mester'
            value={s.champion?.name ?? '—'}
            accent={!!s.champion}
          />
        </>
      );
    }
    if (route.section === 'spillere') {
      const p = data.players.find((x) => x.slug === route.player);
      if (!p) {
        return (
          <>
            <Param label='Spillere' value={data.players.length} />
            <Param label='Sesonger' value={data.seasons.length} />
          </>
        );
      }
      return (
        <>
          <Param label='Spiller' value={p.name} />
          <Param label='Sesonger' value={p.seasons} />
          <Param label='Titler' value={p.titles} accent={p.titles > 0} />
        </>
      );
    }
    if (route.section === 'rekorder') {
      const done = data.seasons.filter((s) => s.champion);
      return (
        <>
          <Param label='Rekorder' value='Alle tider' />
          <Param
            label='Sesonger'
            value={
              done.length
                ? `S${done[0].number}–S${done[done.length - 1].number}`
                : '—'
            }
          />
        </>
      );
    }
    // Anywhere else: the tournament's status line.
    return latestDone ? (
      <>
        <Param label='Sesong' value={pad(latestDone.number)} />
        <Param label='Mester' value={latestDone.champion!.name} accent />
        <Param label='Dato' value={latestDone.date} />
      </>
    ) : null;
  };

  const seasonChooser = (
    <div className='flex items-center gap-1.5 px-3'>
      <span className='text-text-muted mr-1.5 font-mono text-[8px] tracking-[0.2em] uppercase'>
        Sesong
      </span>
      {data.seasons.map((s) => {
        const here = route.section === 'sesonger' && route.season === s.slug;
        return (
          <Link
            key={s.slug}
            href={`/sesong/${s.slug}`}
            onClick={() => setOpened(null)}
            data-autofocus={here || undefined}
            aria-current={here ? 'page' : undefined}
            aria-label={`Sesong ${s.number}`}
            className={`${SMALL_KEY} ${
              here
                ? 'border-accent bg-accent text-bg'
                : 'border-border-accent text-text-muted hover:border-accent hover:text-accent'
            }`}
          >
            {s.number}
          </Link>
        );
      })}
    </div>
  );

  return (
    <header ref={headerRef} className='pt-4 pb-8 lg:pt-6 lg:pb-10'>
      <nav
        aria-label='Hovedmeny'
        className='border-border bg-bg flex h-14 border lg:h-20'
      >
        <Link
          href='/'
          aria-label='Forside'
          className='border-border text-text hover:text-accent focus-visible:outline-accent flex w-12 shrink-0 items-center justify-center border-r focus-visible:outline-2 focus-visible:-outline-offset-2 lg:w-20'
        >
          <DotMatrixLogo
            cols={20}
            state={logoState}
            className='h-[38px] w-auto lg:h-[57px]'
          />
        </Link>
        {keys.map(renderKey)}
        {/* TODO(copy): the model code (a Teenage Engineering-style product stamp) — best-effort. */}
        <span className='text-text-muted ml-auto hidden self-center px-4 font-mono text-[9px] tracking-[0.2em] lg:block'>
          GG–S{pad(Number(data.currentSeason))}
        </span>
      </nav>
      <div
        id='site-display'
        ref={displayRef}
        className={`bg-display border-border relative flex h-10 [scrollbar-width:none] items-stretch overflow-x-auto border-x border-b`}
      >
        {chooser === 'seasons' ? (
          seasonChooser
        ) : chooser === 'vs' || route.section === 'vs' ? (
          // On /vs pages the picker IS the readout (pre-filled with the pair).
          <VsChooser
            key={`${pathname}-${chooser ?? 'rest'}`}
            data={data}
            initialA={
              route.section === 'vs'
                ? route.a
                : route.section === 'spillere'
                  ? route.player
                  : undefined
            }
            initialB={route.section === 'vs' ? route.b : undefined}
            onGo={(a, b) => {
              setOpened(null);
              router.push(`/vs/${a}/${b}`);
            }}
          />
        ) : (
          readout()
        )}
      </div>
    </header>
  );
}

/** The quick pair picker on the display. Mounts fresh each time it opens. */
function VsChooser({
  data,
  initialA = '',
  initialB = '',
  onGo,
}: {
  data: HeaderData;
  initialA?: string;
  initialB?: string;
  onGo: (a: string, b: string) => void;
}) {
  const known = (slug: string) =>
    data.players.some((p) => p.slug === slug) ? slug : '';
  const [a, setA] = useState(known(initialA));
  const [b, setB] = useState(known(initialB));
  const pairs = new Set(data.pairs);
  const ok = !!a && !!b && pairs.has(`${a}|${b}`);
  const options = (other: string) =>
    data.players.map((p) => (
      <option
        key={p.slug}
        value={p.slug}
        disabled={
          !!other && (p.slug === other || !pairs.has(`${other}|${p.slug}`))
        }
      >
        {p.name}
      </option>
    ));

  return (
    <form
      className='flex items-stretch'
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onGo(a, b);
      }}
    >
      <select
        aria-label='Spiller A'
        value={a}
        onChange={(e) => setA(e.target.value)}
        className={`${SELECT} border-border border-r`}
        data-autofocus
      >
        <option value=''>Spiller A</option>
        {options(b)}
      </select>
      <span
        aria-hidden='true'
        className='border-border w-8 shrink-0 border-r bg-[linear-gradient(to_top_right,transparent_calc(50%-0.5px),var(--color-accent)_50%,transparent_calc(50%+0.5px))]'
      />
      <select
        aria-label='Spiller B'
        value={b}
        onChange={(e) => setB(e.target.value)}
        className={`${SELECT} border-border border-r`}
      >
        <option value=''>Spiller B</option>
        {options(a)}
      </select>
      <button
        type='button'
        onClick={() => {
          setA(b);
          setB(a);
        }}
        disabled={!a && !b}
        className='border-border text-text-muted hover:text-accent focus-visible:outline-accent disabled:hover:text-text-muted cursor-pointer border-r px-3 font-mono text-[10px] tracking-[0.2em] uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed'
      >
        Bytt
      </button>
      <button
        type='submit'
        disabled={!ok}
        className='border-border text-text hover:text-accent disabled:text-text-muted focus-visible:outline-accent disabled:hover:text-text-muted cursor-pointer border-r px-4 font-mono text-[10px] font-medium tracking-[0.2em] uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed'
      >
        Gå
      </button>
    </form>
  );
}
