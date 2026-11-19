/**
 * Shared table anatomy (design.md, Tables): every table reads as one timing
 * sheet, with 40px rows. Compose with template strings; a table only adds
 * what is its own (column widths beyond these, alignment, tone).
 */

export const TABLE =
  'border-border bg-bg w-full border-collapse border text-left';

export const HEAD_ROW =
  'border-border text-text-muted h-10 border-b font-mono text-xs tracking-wide uppercase sm:tracking-widest';

export const ROW = 'border-border h-10 border-b last:border-b-0';

/** Cell padding. Tables with many columns use `px-1.5 sm:px-3`. */
export const PAD = 'px-3';

export const HEAD_CELL = 'font-normal';

/** The leading rank column: a plain "1" (design.md, Notation). */
export const RANK_CELL = 'w-12 text-center font-mono text-sm tabular-nums';

export const NAME_CELL = 'text-text font-semibold';

export const FIGURE_CELL = 'w-20 text-right font-mono text-sm tabular-nums';

/** A name in a table: plain until hover (design.md, Interaction states). */
export const NAME_LINK =
  'focus-visible:outline-accent relative underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-3 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2';
