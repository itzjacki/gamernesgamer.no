import Popover from './Popover';

/**
 * The /vs page's comparison grammar: ONE reading about a pair on a shared axis
 * between two fixed sides (a on the left, b on the right), never two figures in
 * two columns. Both figures always share a colour and weight; the relation is
 * carried by where the needle sits on the gauge, not by colouring a leader — in
 * a one-sided pairing that would paint one side top to bottom. The needle
 * itself is the accent: it marks the reading, not a player, so every row
 * carries one small red mark whoever is ahead.
 *
 * Four pieces, so the page composes them freely:
 *  - `PairRow`: a full cell (mono eyebrow + scope, then figure · gauge · figure),
 *    a `bg-bg` cell meant for a `bg-border gap-px` wall like CareerLedger's.
 *  - `PairMini`: a sub-part of a row — the same layout at a smaller size, on a
 *    shorter axis centred under the main one (matches per series length, the
 *    split by whose pick the game was). `PairMinis` lays a set of them out.
 *  - `PairLine`: the one-line list variant (label · figure · gauge · figure)
 *    for the category list, its label set like the other category tables'.
 *
 * Detail on demand (the games or matches behind a figure) is the site's shared
 * `Popover`, opened from a row's scope label.
 */

const eyebrow =
  'text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest';

interface Sides {
  a: number;
  b: number;
  /** The two players' names, for screen readers (the figures carry no label). */
  names: { a: string; b: string };
}

/**
 * The gauge: a hairline track with a fixed centre mark and a needle that leans
 * toward whoever has more — dead centre when level (0–0 included). Every
 * gauge has its needle, however small the sample: the figures beside it say
 * how much is behind it, and an axis without one reads as broken.
 */
export function PairGauge({ a, b }: { a: number; b: number }) {
  const total = a + b;
  return (
    <span aria-hidden='true' className='relative block h-4 min-w-8'>
      <span className='bg-text-muted absolute inset-x-0 top-1/2 h-px' />
      <span className='bg-text-muted absolute top-1/2 left-1/2 h-2 w-px -translate-y-1/2' />
      <span
        className='bg-accent absolute top-0 h-4 w-[3px] -translate-x-1/2'
        style={{ left: total === 0 ? '50%' : `${(b / total) * 100}%` }}
      />
    </span>
  );
}

interface RowProps extends Sides {
  /** Unique on the page; names the detail popover. */
  id: string;
  label: string;
  /** The sample behind the figures, e.g. "34 spill". Opens `detail` if given. */
  scope?: string;
  /** What is behind the figures, shown in a popover off the scope. */
  detail?: React.ReactNode;
  /** The masthead's row prints its figures at display size. */
  headline?: boolean;
  /** Sub-parts under the gauge (a `PairMinis` set). */
  children?: React.ReactNode;
}

export function PairRow({
  id,
  label,
  scope,
  detail,
  headline = false,
  a,
  b,
  names,
  children,
}: RowProps) {
  const figure = `text-text font-mono tabular-nums ${
    headline ? 'text-4xl sm:text-6xl' : 'text-3xl'
  }`;

  return (
    <div className='bg-bg flex flex-col gap-3 p-4 sm:px-8 sm:py-5'>
      <div className='flex items-baseline justify-between gap-4'>
        <h3 className={eyebrow}>{label}</h3>
        {scope &&
          (detail ? (
            <Popover
              id={`pair-${id}`}
              heading={label}
              panel={detail}
              className={`shrink-0 ${eyebrow}`}
            >
              {scope}
            </Popover>
          ) : (
            <span className={`shrink-0 ${eyebrow}`}>{scope}</span>
          ))}
      </div>

      <p className='grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-6'>
        <span className={figure}>
          <span className='sr-only'>{names.a}: </span>
          {a}
        </span>
        <PairGauge a={a} b={b} />
        <span className={figure}>
          <span className='sr-only'>, {names.b}: </span>
          {b}
        </span>
      </p>

      {children}
    </div>
  );
}

/**
 * A set of sub-parts: centred under the main axis, side by side from `sm` up
 * and stacked on phones. Centred whether there are one, two or three.
 */
export function PairMinis({ children }: { children: React.ReactNode }) {
  return (
    <div className='border-border flex flex-wrap justify-center gap-x-10 gap-y-4 border-t pt-4'>
      {children}
    </div>
  );
}

interface MiniProps extends Sides {
  /** The part's label: plain text, or a popover for detail on demand. */
  label: React.ReactNode;
}

/** One sub-part: PairRow's layout, smaller, on a shorter centred axis. */
export function PairMini({ label, a, b, names }: MiniProps) {
  const figure = 'text-text font-mono text-lg tabular-nums';
  return (
    <div className='flex w-full max-w-56 flex-col items-center gap-1 sm:w-44'>
      <div className={eyebrow}>{label}</div>
      <p className='grid w-full grid-cols-[auto_1fr_auto] items-center gap-3'>
        <span className={figure}>
          <span className='sr-only'>{names.a}: </span>
          {a}
        </span>
        <PairGauge a={a} b={b} />
        <span className={figure}>
          <span className='sr-only'>, {names.b}: </span>
          {b}
        </span>
      </p>
    </div>
  );
}

interface LineProps extends Sides {
  /** The line's label: plain text, or a popover trigger for detail on demand. */
  label: React.ReactNode;
  /** An unranked line (too few games): label and figures step back to muted. */
  muted?: boolean;
}

/** The list variant: label, then figure · gauge · figure on one line. */
export function PairLine({ label, a, b, names, muted = false }: LineProps) {
  const figure = `font-mono text-sm tabular-nums ${
    muted ? 'text-text-muted' : 'text-text'
  }`;
  return (
    // Divs, not a <p> with spans: the label may hold a popover, whose panel is
    // a <div> and cannot sit inside phrasing content. The label is set like a
    // row header in TagRecord/TagCrowns (text face, semibold when ranked).
    <div className='border-border grid min-h-11 grid-cols-[minmax(0,8.5rem)_1.5rem_1fr_1.5rem] items-center gap-3 border-t sm:grid-cols-[minmax(0,12rem)_2rem_1fr_2rem] sm:gap-4'>
      <div
        className={`truncate ${
          muted ? 'text-text-muted font-normal' : 'text-text font-semibold'
        }`}
      >
        {label}
      </div>
      <span className={`text-right ${figure}`}>
        <span className='sr-only'>{names.a}: </span>
        {a}
      </span>
      <PairGauge a={a} b={b} />
      <span className={figure}>
        <span className='sr-only'>, {names.b}: </span>
        {b}
      </span>
    </div>
  );
}
