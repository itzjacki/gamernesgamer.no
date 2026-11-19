/**
 * A label with its figure (design.md, Readouts). The site header's
 * parameters are the one exception: they are instrument micro text.
 */

export type ReadoutSize = 's' | 'm' | 'l';

interface Props {
  label: React.ReactNode;
  value: React.ReactNode;
  /** s: in rows and tables · m: in plates · l: a page's headline figure. */
  size?: ReadoutSize;
  /**
   * stacked: label over figure · inline: label left, figure right ·
   * inline-then-stacked: inline (at `s`) on phones, stacked from `sm`.
   */
  layout?: 'stacked' | 'inline' | 'inline-then-stacked';
  align?: 'start' | 'end';
  /** Accent only for rank-1 data (design.md, Accent at rest). */
  accent?: boolean;
  /** A word, not a number: display face instead of mono figures. */
  word?: boolean;
  /** Inside a `<dl>`: renders `dt`/`dd`. */
  term?: boolean;
  className?: string;
}

const FIGURE: Record<ReadoutSize, string> = {
  s: 'text-sm',
  m: 'text-2xl',
  l: 'text-5xl sm:text-6xl',
};

/** Literal classes so Tailwind finds them: phones at `s`, then this size. */
const FIGURE_FROM_SM: Record<ReadoutSize, string> = {
  s: 'text-sm',
  m: 'text-sm sm:text-2xl',
  l: 'text-sm sm:text-5xl lg:text-6xl',
};

const LAYOUT = {
  stacked: 'flex flex-col gap-2',
  inline: 'flex items-center justify-between gap-3',
  'inline-then-stacked': 'flex items-baseline gap-2 sm:flex-col sm:gap-1',
};

export default function Readout({
  label,
  value,
  size = 'm',
  layout = 'stacked',
  align = 'start',
  accent = false,
  word = false,
  term = false,
  className = '',
}: Props) {
  const Label = term ? 'dt' : 'span';
  const Value = term ? 'dd' : 'span';

  const figure =
    layout === 'inline-then-stacked' ? FIGURE_FROM_SM[size] : FIGURE[size];
  const face = word
    ? `font-semibold wrap-break-word hyphens-auto ${size === 'm' ? 'text-xl sm:text-2xl' : figure}`
    : `font-mono leading-none tabular-nums ${figure}`;

  return (
    <div
      className={`${LAYOUT[layout]} ${align === 'end' ? 'items-end text-right' : ''} ${className}`}
    >
      <Label className='text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
        {label}
      </Label>
      <Value className={`${accent ? 'text-text-accent' : 'text-text'} ${face}`}>
        {value}
      </Value>
    </div>
  );
}
