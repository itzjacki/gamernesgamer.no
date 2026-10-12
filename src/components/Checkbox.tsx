interface Props {
  /** The visible label. The whole label is the click/touch target. */
  children: React.ReactNode;
  /** Layout-only extra classes for the label. */
  className?: string;
}

/**
 * The VERKSTED checkbox: a native `<input type='checkbox'>` with its system
 * look removed and redrawn as a square hairline box with a solid accent
 * indicator when on — no radius, no white system box on the dark page.
 *
 * Still a real, uncontrolled checkbox, so keyboard, form and accessibility
 * behaviour are the platform's, CSS can react to `:checked` (TagRecord toggles
 * its two variants that way) and it needs no JS — usable in Server Components.
 * Accent is earned on interaction: it only appears once the box is checked.
 */
export default function Checkbox({ children, className = '' }: Props) {
  return (
    <label
      className={`text-text-muted hover:text-text flex min-h-11 cursor-pointer items-center gap-3 font-mono text-xs tracking-widest uppercase transition-colors duration-150 ${className}`.trim()}
    >
      <span className='relative grid size-4 shrink-0 place-items-center'>
        <input
          type='checkbox'
          className='peer border-text-muted bg-bg checked:border-accent focus-visible:outline-accent size-4 cursor-pointer appearance-none border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
        />
        <span
          aria-hidden='true'
          className='bg-accent pointer-events-none absolute hidden size-2 peer-checked:block'
        />
      </span>
      {children}
    </label>
  );
}
