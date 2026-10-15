'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { SeasonStatus } from '@/types/season-meta';
import PixelLogo, { type LogoState } from './PixelLogo';
import styles from './SiteHeader.module.css';

/**
 * The header bar (see SiteHeader for the server half).
 *
 * - The RAIL is a row of keys: a function number, the label, and a status LED
 *   instead of an underline. The LED is steady on the current section.
 * - The DISPLAY below shows one thing at a time. At rest it is the current
 *   page's readout (label over value, like an instrument screen). Three keys
 *   are CHOOSERS rather than links — Sesonger (season keys; there is no season
 *   index), Spillere (player keys plus "Alle", the index) and VS (a quick pair
 *   picker). Every change GLITCHES IN over what the display shows, like a
 *   signal switching: a chooser over the readout, the next chooser over the
 *   first, the readout back over a chooser. Its key's LED blinks while it
 *   shows. Escape, a click outside, pressing the key again or navigating
 *   returns to the readout.
 * - On /vs pages the pair picker is itself the readout, so VS just focuses it.
 *   The picker is two selects with a swap-sides button between them (like a
 *   flight search's from/to) and GÅ.
 * - Rekorder is a plain link: it has nothing to choose between.
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
  /** The pixel logo, one string per row ('#' = pixel); see readPixelLogo. */
  logo: string[];
  seasons: HeaderSeason[];
  players: HeaderPlayer[];
  /** "a|b" for every ordered pair with a /vs page. */
  pairs: string[];
}

type Section = 'sesonger' | 'spillere' | 'vs' | 'rekorder';
type Chooser = 'seasons' | 'players' | 'vs';

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

/**
 * The display is a stack of frames, each glitching in over the one below:
 * opening a chooser puts it over the readout, switching puts the next chooser
 * over the first, closing puts the readout back over the chooser. When the
 * top frame has settled, everything under it is dropped (and a readout frame
 * drops itself, leaving the live readout underneath).
 */
type Frame = {
  id: number;
  kind: Chooser | 'readout';
  path: string;
  /** Settled: rendered plainly from here on. */
  done?: boolean;
};
type SetFrames = React.Dispatch<React.SetStateAction<Frame[]>>;
let frameId = 0;

function settle(set: SetFrames, id: number) {
  set((fs) => {
    const top = fs[fs.length - 1];
    if (!top || top.id !== id) return fs;
    return top.kind === 'readout' ? [] : [{ ...top, done: true }];
  });
}

function pushFrame(set: SetFrames, kind: Frame['kind'], path: string) {
  const frame = { id: ++frameId, kind, path };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    set(kind === 'readout' ? [] : [{ ...frame, done: true }]);
    return;
  }
  set((fs) => [...fs.filter((f) => f.path === path), frame]);
  // Fallback in case the glitch-in never runs (e.g. a background tab).
  setTimeout(() => settle(set, frame.id), 500);
}

const KEY =
  'group border-border relative flex min-w-0 flex-1 flex-col justify-between border-r px-2 py-2 text-left font-mono transition-transform duration-75 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:translate-y-px sm:w-30 sm:flex-none sm:px-3 sm:py-2.5';
const SMALL_KEY =
  'grid h-6 min-w-6 shrink-0 place-items-center border px-1.5 font-mono text-[10px] font-medium uppercase sm:h-7 sm:min-w-7 sm:px-2 sm:text-[11px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const SMALL_KEY_ON = 'border-accent bg-accent text-bg';
const SMALL_KEY_OFF =
  'border-border-accent text-text-muted hover:border-accent hover:text-accent';
const SELECT =
  'bg-display text-text hover:text-accent focus-visible:outline-accent border-border h-full w-28 shrink-0 appearance-none border-r px-2 font-mono text-[11px] font-medium tracking-wide uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 sm:w-36 sm:px-3 sm:text-xs sm:tracking-wider';
const LAYER =
  'absolute inset-0 flex items-stretch overflow-x-auto [scrollbar-width:none]';
/** The small label on the display (over a value, or before a row of keys). */
const LABEL = 'text-text-muted font-mono text-[8px] tracking-[0.2em] uppercase';

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
    <div className='border-border flex shrink-0 flex-col justify-center gap-1 border-r px-2 whitespace-nowrap sm:px-3'>
      <span className={LABEL}>{label}</span>
      <span
        className={`font-mono text-xs leading-none font-medium uppercase sm:text-sm ${accent ? 'text-accent' : 'text-text'}`}
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

  // Frames belong to the page they were drawn on, so navigating clears them
  // without an effect.
  const [frames, setFrames] = useState<Frame[]>([]);
  const shown = frames.filter((f) => f.path === pathname);
  const top = shown[shown.length - 1];
  const chooser = top && top.kind !== 'readout' ? top.kind : null;

  const close = () => {
    if (chooser) pushFrame(setFrames, 'readout', pathname);
  };
  const toggle = (c: Chooser) => {
    // On /vs the picker is already the readout: just put focus in it.
    if (c === 'vs' && route.section === 'vs') {
      displayRef.current?.querySelector<HTMLElement>('select')?.focus();
      return;
    }
    if (chooser === c) close();
    else pushFrame(setFrames, c, pathname);
  };

  useEffect(() => {
    if (!chooser) return;
    // Hand focus to the layer so the chooser is reachable by keyboard.
    const layerEl = displayRef.current?.querySelector('[data-layer]');
    (
      layerEl?.querySelector<HTMLElement>('[data-autofocus]') ??
      layerEl?.querySelector<HTMLElement>('a, select, button')
    )?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Return focus to the key that opened the chooser.
      headerRef.current
        ?.querySelector<HTMLElement>(
          '[aria-controls="site-display"][aria-expanded="true"]',
        )
        ?.focus();
      pushFrame(setFrames, 'readout', pathname);
    };
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node))
        pushFrame(setFrames, 'readout', pathname);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [chooser, pathname]);

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
  const keys: ({ section: Section; label: string } & (
    | { chooser: Chooser }
    | { href: string }
  ))[] = [
    { section: 'sesonger', label: 'Sesonger', chooser: 'seasons' },
    { section: 'spillere', label: 'Spillere', chooser: 'players' },
    { section: 'vs', label: 'VS', chooser: 'vs' },
    { section: 'rekorder', label: 'Rekorder', href: '/records' },
  ];

  const renderKey = (k: (typeof keys)[number], index: number) => {
    const here = route.section === k.section;
    const choosing = 'chooser' in k && chooser === k.chooser;
    const lit = here || choosing;
    const inner = (
      <>
        <span className='text-text-muted text-[9px] tracking-widest'>
          {pad(index + 1)}
        </span>
        <span
          aria-hidden='true'
          className={`absolute top-2 right-2 size-1.5 border sm:top-2.5 sm:right-3 ${
            lit ? 'border-accent bg-accent' : 'border-border-accent'
          } ${choosing ? styles.ledBlink : ''}`}
        />
        <span
          className={`group-hover:text-accent truncate text-[9px] tracking-normal uppercase sm:text-xs sm:tracking-widest ${
            lit ? 'text-text' : 'text-text-muted'
          }`}
        >
          {k.label}
        </span>
      </>
    );
    if ('chooser' in k) {
      return (
        <button
          key={k.section}
          type='button'
          className={`${KEY} cursor-pointer`}
          aria-label={k.label}
          aria-expanded={choosing}
          aria-controls='site-display'
          onClick={() => toggle(k.chooser)}
        >
          {inner}
        </button>
      );
    }
    return (
      <Link
        key={k.section}
        href={k.href}
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
    if (route.section === 'vs') {
      // The picker is the readout here (pre-filled with the pair).
      return (
        <VsChooser
          key={pathname}
          data={data}
          initialA={route.a}
          initialB={route.b}
          onGo={(a, b) => router.push(`/vs/${a}/${b}`)}
        />
      );
    }
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

  const chooserContent = (c: Chooser) => {
    if (c === 'seasons') {
      return (
        <div className='flex items-center gap-1 px-2 sm:gap-1.5 sm:px-3'>
          <span className={`${LABEL} mr-1.5 shrink-0`}>Sesong</span>
          {data.seasons.map((s) => {
            const here =
              route.section === 'sesonger' && route.season === s.slug;
            return (
              <Link
                key={s.slug}
                href={`/sesong/${s.slug}`}
                data-autofocus={here || undefined}
                aria-current={here ? 'page' : undefined}
                aria-label={`Sesong ${s.number}`}
                className={`${SMALL_KEY} ${here ? SMALL_KEY_ON : SMALL_KEY_OFF}`}
              >
                {s.number}
              </Link>
            );
          })}
        </div>
      );
    }
    if (c === 'players') {
      const onIndex = route.section === 'spillere' && !route.player;
      return (
        <div className='flex items-stretch'>
          <div className='border-border flex items-center gap-1 border-r px-2 sm:gap-1.5 sm:px-3'>
            {data.players.map((p) => {
              const here =
                route.section === 'spillere' && route.player === p.slug;
              return (
                <Link
                  key={p.slug}
                  href={`/spillere/${p.slug}`}
                  data-autofocus={here || undefined}
                  aria-current={here ? 'page' : undefined}
                  className={`${SMALL_KEY} ${here ? SMALL_KEY_ON : SMALL_KEY_OFF}`}
                >
                  {p.name}
                </Link>
              );
            })}
          </div>
          {/* "Alle" is a different kind of key (the index), so it gets its own
              cell, split off by a full-height hairline like the readout's. */}
          <div className='flex items-center px-2 sm:px-3'>
            <Link
              href='/spillere'
              data-autofocus={onIndex || undefined}
              aria-current={onIndex ? 'page' : undefined}
              className={`${SMALL_KEY} ${onIndex ? SMALL_KEY_ON : SMALL_KEY_OFF}`}
            >
              Alle
            </Link>
          </div>
        </div>
      );
    }
    return (
      <VsChooser
        data={data}
        initialA={route.section === 'spillere' ? route.player : undefined}
        onGo={(a, b) => {
          close();
          router.push(`/vs/${a}/${b}`);
        }}
      />
    );
  };

  return (
    <header ref={headerRef} className='pt-4 pb-8 sm:pt-6 sm:pb-10'>
      <nav
        aria-label='Hovedmeny'
        className='border-border bg-bg flex h-14 border sm:h-16'
      >
        <Link
          href='/'
          aria-label='Forside'
          className={`${styles.logoLink} border-border text-text hover:text-accent focus-visible:outline-accent flex w-12 shrink-0 items-center justify-center border-r focus-visible:outline-2 focus-visible:-outline-offset-2 sm:w-16`}
        >
          {/* 32 × 32 pixels, always drawn 1:1. */}
          <PixelLogo rows={data.logo} state={logoState} className='size-8' />
        </Link>
        {keys.map(renderKey)}
        {/* TODO(copy): the model stamp (Teenage Engineering-style) — best-effort. */}
        <span className='text-text-muted ml-auto hidden self-center px-4 font-mono text-[9px] tracking-[0.2em] lg:block'>
          GG–S{pad(Number(data.currentSeason))}
        </span>
      </nav>
      <div
        id='site-display'
        ref={displayRef}
        className='bg-display border-border relative h-10 overflow-hidden border-x border-b'
      >
        <div className={LAYER} inert={chooser ? true : undefined}>
          {readout()}
        </div>
        {shown.map((f) => {
          const live = f === top && f.kind !== 'readout';
          return (
            <div
              key={f.id}
              data-layer={live || undefined}
              inert={live ? undefined : true}
              aria-hidden={live ? undefined : true}
              className={`${LAYER} bg-display ${f.done ? '' : styles.glitchIn}`}
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget && !e.pseudoElement)
                  settle(setFrames, f.id);
              }}
            >
              {f.kind === 'readout' ? readout() : chooserContent(f.kind)}
            </div>
          );
        })}
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
        className={SELECT}
        data-autofocus
      >
        <option value=''>Spiller A</option>
        {options(b)}
      </select>
      {/* Swap sides, like a flight search's from/to.
          TODO(copy): the accessible name — best-effort. */}
      <button
        type='button'
        aria-label='Bytt side'
        onClick={() => {
          setA(b);
          setB(a);
        }}
        disabled={!a && !b}
        className='border-border text-text-muted hover:text-accent focus-visible:text-accent focus-visible:outline-accent disabled:hover:text-text-muted grid w-9 shrink-0 cursor-pointer place-items-center border-r focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed sm:w-10'
      >
        <svg
          viewBox='0 0 16 16'
          aria-hidden='true'
          className='size-4'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.25'
          strokeLinecap='square'
        >
          <path d='M3 5.5h10M10.5 3 13 5.5 10.5 8' />
          <path d='M13 10.5H3M5.5 8 3 10.5 5.5 13' />
        </svg>
      </button>
      <select
        aria-label='Spiller B'
        value={b}
        onChange={(e) => setB(e.target.value)}
        className={SELECT}
      >
        <option value=''>Spiller B</option>
        {options(a)}
      </select>
      <button
        type='submit'
        disabled={!ok}
        className='border-border text-text hover:text-accent disabled:text-text-muted focus-visible:outline-accent disabled:hover:text-text-muted cursor-pointer border-r px-3 font-mono text-[10px] font-medium tracking-[0.2em] uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed sm:px-4'
      >
        Gå
      </button>
    </form>
  );
}
