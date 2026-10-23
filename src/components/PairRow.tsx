import Popover from './Popover';

/**
 * The /vs comparison grammar: ONE reading about a pair on a shared axis between
 * two fixed sides (a left, b right), never two figures in two columns. Both
 * figures always share a colour and weight; the gauge carries the relation.
 */

const eyebrow =
  'text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest';

interface Sides {
  a: number;
  b: number;
  /** For screen readers: the figures carry no label. */
  names: { a: string; b: string };
}

/**
 * Every gauge has its needle, however small the sample (0–0 sits dead centre):
 * an axis without one reads as broken.
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
  /** E.g. "34 spill". Opens `detail` if given. */
  scope?: string;
  detail?: React.ReactNode;
  /** Display-size figures, for the masthead. */
  headline?: boolean;
  /** A `PairMinis` set. */
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

export function PairMinis({ children }: { children: React.ReactNode }) {
  return (
    <div className='border-border flex flex-wrap justify-center gap-x-10 gap-y-4 border-t pt-4'>
      {children}
    </div>
  );
}

interface MiniProps extends Sides {
  label: React.ReactNode;
}

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
  label: React.ReactNode;
  /** An unranked line (too few games). */
  muted?: boolean;
}

export function PairLine({ label, a, b, names, muted = false }: LineProps) {
  const figure = `font-mono text-sm tabular-nums ${
    muted ? 'text-text-muted' : 'text-text'
  }`;
  return (
    // Divs, not a <p> with spans: the label may hold a popover, whose panel is
    // a <div> and cannot sit inside phrasing content.
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
