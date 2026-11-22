'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { SeasonStatus } from '@/types/season-meta';
import PixelLogo, { type LogoState } from './PixelLogo';
import styles from './SiteHeader.module.css';

/**
 * Client half of the header (rules in design.md, "Site header"). A chooser
 * closes on Escape, a click outside, its key again, or navigation.
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
  /** One string per row ('#' = pixel); see readPixelLogo. */
  logo: string[];
  seasons: HeaderSeason[];
  players: HeaderPlayer[];
  /** "a|b" for every ordered pair with a /vs page. */
  pairs: string[];
}

type Section =
  | 'sesonger'
  | 'spillere'
  | 'vs'
  | 'rekorder'
  | 'kort'
  | 'content'
  | 'admin';
type Chooser = 'seasons' | 'players' | 'vs' | 'menu';

function parsePath(pathname: string) {
  const [first, a, b] = pathname.split('/').filter(Boolean);
  if (first === 'sesong') return { section: 'sesonger' as const, season: a };
  if (first === 'spillere') return { section: 'spillere' as const, player: a };
  if (first === 'records') return { section: 'rekorder' as const };
  if (first === 'vs') return { section: 'vs' as const, a, b };
  if (first === 'kort') return { section: 'kort' as const };
  if (first === 'content') return { section: 'content' as const };
  if (first === 'admin') return { section: 'admin' as const };
  return { section: null };
}

/**
 * Keys after Spillere drop into the menu key, from the right, when the header
 * is too narrow for them. Pure CSS: each threshold is the header width the
 * row needs with that key shown (logo 64 + Sesonger/Spillere 2 × 120 + 120
 * per key + menu key 64 + nav border 2, at the sm+ key sizes). The classes
 * are spelled out so Tailwind can see them. Kort and Admin never get a key
 * (`key: null`): they live in the menu, so the menu key is always there.
 */
const OVERFLOW: Partial<
  Record<Section, { key: string | null; item: string; menuLedOff: string }>
> = {
  vs: {
    key: 'hidden @min-[490px]/hdr:flex',
    item: '@min-[490px]/hdr:hidden',
    menuLedOff:
      '@min-[490px]/hdr:border-border-accent @min-[490px]/hdr:bg-transparent',
  },
  rekorder: {
    key: 'hidden @min-[610px]/hdr:flex',
    item: '@min-[610px]/hdr:hidden',
    menuLedOff:
      '@min-[610px]/hdr:border-border-accent @min-[610px]/hdr:bg-transparent',
  },
  content: {
    key: 'hidden @min-[730px]/hdr:flex',
    item: '@min-[730px]/hdr:hidden',
    menuLedOff:
      '@min-[730px]/hdr:border-border-accent @min-[730px]/hdr:bg-transparent',
  },
  kort: { key: null, item: '', menuLedOff: '' },
  admin: { key: null, item: '', menuLedOff: '' },
};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The display is a stack of frames, each glitching in over the one below.
 * When the top frame settles, everything under it is dropped; a readout frame
 * drops itself, leaving the live readout underneath.
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

// No display utility: a key is `flex`, or hidden until its overflow width.
const KEY =
  'group border-border relative min-w-0 flex-1 flex-col justify-between border-r px-2 py-2 text-left font-mono transition-transform duration-75 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:translate-y-px sm:w-30 sm:flex-none sm:px-3 sm:py-2.5';
/**
 * The overflow key, at the right edge: logo-width, an icon instead of number
 * and label. Its left hairline overlaps the last key's when they touch.
 */
const MENU_KEY =
  'group border-border relative -ml-px flex w-12 shrink-0 cursor-pointer items-center justify-center border-l transition-transform duration-75 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:translate-y-px sm:w-16';
const SMALL_KEY =
  'grid h-6 min-w-6 shrink-0 place-items-center border px-1.5 font-mono text-[10px] font-medium uppercase sm:h-7 sm:min-w-7 sm:px-2 sm:text-[11px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const SMALL_KEY_ON = 'border-accent bg-accent text-bg';
const SMALL_KEY_OFF =
  'border-border-accent text-text-muted hover:border-accent hover:text-text-accent';
const SELECT =
  'bg-display text-text hover:text-text-accent focus-visible:outline-accent border-border h-full w-28 shrink-0 appearance-none border-r px-2 font-mono text-[11px] font-medium tracking-wide uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 sm:w-36 sm:px-3 sm:text-xs sm:tracking-wider';
const LAYER =
  'absolute inset-0 flex items-stretch overflow-x-auto [scrollbar-width:none]';
const LABEL = 'text-text-muted font-mono text-[8px] tracking-[0.2em] uppercase';

function Param({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className='border-border flex shrink-0 flex-col justify-center gap-1 border-r px-2 whitespace-nowrap sm:px-3'>
      <span className={LABEL}>{label}</span>
      <span
        className={`font-mono text-xs leading-none font-medium uppercase sm:text-sm`}
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
    // Hand focus to the layer so the chooser is reachable by keyboard. The
    // menu hides items whose key is in the bar, so skip anything not shown.
    const layerEl = displayRef.current?.querySelector('[data-layer]');
    const visible = (sel: string) =>
      [...(layerEl?.querySelectorAll<HTMLElement>(sel) ?? [])].find(
        (el) => el.getClientRects().length > 0,
      );
    (visible('[data-autofocus]') ?? visible('a, select, button'))?.focus();
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
  const keys: ({ section: Section; label: string } & (
    | { chooser: Chooser }
    | { href: string }
  ))[] = [
    { section: 'sesonger', label: 'Sesonger', chooser: 'seasons' },
    { section: 'spillere', label: 'Spillere', chooser: 'players' },
    { section: 'vs', label: 'VS', chooser: 'vs' },
    { section: 'rekorder', label: 'Rekorder', href: '/records' },
    { section: 'content', label: 'Content', href: '/content' },
    { section: 'kort', label: 'Kort', href: '/kort' },
    { section: 'admin', label: 'Admin', href: '/admin' },
  ];
  // In the menu every key is a link: VS goes to /vs and picks there.
  const menuItems = keys.flatMap((k) => {
    const overflow = OVERFLOW[k.section];
    return overflow
      ? [
          {
            section: k.section,
            label: k.label,
            href: 'href' in k ? k.href : '/vs',
            hide: overflow.item,
          },
        ]
      : [];
  });
  const menuLed = route.section && OVERFLOW[route.section];

  const renderKey = (k: (typeof keys)[number], index: number) => {
    const overflow = OVERFLOW[k.section];
    if (overflow?.key === null) return null;
    const here = route.section === k.section;
    const choosing = 'chooser' in k && chooser === k.chooser;
    const lit = here || choosing;
    const display = overflow?.key ?? 'flex';
    const inner = (
      <>
        <span className='text-text-muted text-[8px] tracking-widest'>
          {pad(index + 1)}
        </span>
        <span
          aria-hidden='true'
          className={`absolute top-2 right-2 size-1.5 border sm:top-2.5 sm:right-3 ${
            lit ? 'border-accent bg-accent' : 'border-border-accent'
          } ${choosing ? styles.ledBlink : ''}`}
        />
        <span
          className={`group-hover:text-text-accent truncate text-[10px] tracking-normal uppercase sm:text-xs sm:tracking-widest ${
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
          className={`${KEY} ${display} cursor-pointer`}
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
        className={`${KEY} ${display}`}
        aria-label={k.label}
        aria-current={here ? 'page' : undefined}
      >
        {inner}
      </Link>
    );
  };

  // ---------------------------------------------------------------- display
  const readout = () => {
    if (route.section === 'vs') {
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
      if (!s) {
        return (
          <>
            <Param label='Sesonger' value={data.seasons.length} />
            {latestDone && (
              <Param
                label='Regjerende mester'
                value={latestDone.champion!.name}
              />
            )}
          </>
        );
      }
      return (
        <>
          <Param label='Sesong' value={`S${s.number}`} />
          <Param label='Dato' value={s.date} />
          <Param label='Spill' value={s.games} />
          <Param label='Vinner' value={s.champion?.name ?? '—'} />
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
          <Param label='Titler' value={p.titles} />
        </>
      );
    }
    if (route.section === 'rekorder') {
      const done = data.seasons.filter((s) => s.champion);
      return (
        <>
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
    return latestDone ? (
      <>
        <Param label='Sesong' value={`S${latestDone.number}`} />
        <Param label='Regjerende mester' value={latestDone.champion!.name} />
        <Param label='Dato' value={latestDone.date} />
      </>
    ) : null;
  };

  const chooserContent = (c: Chooser) => {
    if (c === 'seasons') {
      const onIndex = route.section === 'sesonger' && !route.season;
      return (
        <div className='flex items-stretch'>
          <div className='border-border flex items-center gap-1 border-r px-2 sm:gap-1.5 sm:px-3'>
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
          <div className='flex items-center px-2 sm:px-3'>
            <Link
              href='/sesong'
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
    if (c === 'menu') {
      return (
        <div className='flex items-center gap-1 px-2 sm:gap-1.5 sm:px-3'>
          {menuItems.map((m) => {
            const here = route.section === m.section;
            return (
              <Link
                key={m.section}
                href={m.href}
                data-autofocus={here || undefined}
                aria-current={here ? 'page' : undefined}
                className={`${SMALL_KEY} ${here ? SMALL_KEY_ON : SMALL_KEY_OFF} ${m.hide}`}
              >
                {m.label}
              </Link>
            );
          })}
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
    <header
      ref={headerRef}
      className='@container/hdr pt-4 pb-8 sm:pt-6 sm:pb-10'
    >
      <nav
        aria-label='Hovedmeny'
        className='border-border bg-bg flex h-14 border sm:h-16'
      >
        <Link
          href='/'
          aria-label='Forside'
          className={`${styles.logoLink} border-border text-text hover:text-accent focus-visible:outline-accent flex w-12 shrink-0 items-center justify-center border-r focus-visible:outline-2 focus-visible:-outline-offset-2 sm:w-16`}
        >
          <PixelLogo rows={data.logo} state={logoState} className='size-8' />
        </Link>
        {keys.map(renderKey)}
        {/* Pushes the menu key to the right edge. Below sm the keys fill the
            row themselves. */}
        <div aria-hidden='true' className='sm:flex-1' />
        <button
          type='button'
          className={MENU_KEY}
          aria-label='Flere sider'
          aria-expanded={chooser === 'menu'}
          aria-controls='site-display'
          onClick={() => toggle('menu')}
        >
          <span
            aria-hidden='true'
            className={`absolute top-2 right-2 size-1.5 border sm:top-2.5 sm:right-3 ${
              chooser === 'menu'
                ? `border-accent bg-accent ${styles.ledBlink}`
                : menuLed
                  ? `border-accent bg-accent ${menuLed.menuLedOff}`
                  : 'border-border-accent'
            }`}
          />
          <svg
            viewBox='0 0 12 12'
            aria-hidden='true'
            className={`group-hover:text-text-accent size-3 ${
              chooser === 'menu' ? 'text-text' : 'text-text-muted'
            }`}
            fill='currentColor'
            shapeRendering='crispEdges'
          >
            <rect x='0' y='2' width='12' height='1' />
            <rect x='0' y='5.5' width='12' height='1' />
            <rect x='0' y='9' width='12' height='1' />
          </svg>
        </button>
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

/** Mounts fresh each time it opens. */
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
      <button
        type='button'
        aria-label='Bytt side'
        onClick={() => {
          setA(b);
          setB(a);
        }}
        disabled={!a && !b}
        className='border-border text-text-muted hover:text-text-accent focus-visible:text-text-accent focus-visible:outline-accent disabled:hover:text-text-muted grid w-9 shrink-0 cursor-pointer place-items-center border-r focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed sm:w-10'
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
        className='border-border text-text hover:text-text-accent disabled:text-text-muted focus-visible:outline-accent disabled:hover:text-text-muted cursor-pointer border-r px-3 font-mono text-[10px] font-medium tracking-[0.2em] uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed sm:px-4'
      >
        Gå
      </button>
    </form>
  );
}
