interface Props {
  children: React.ReactNode;
  /** Layout only. */
  className?: string;
}

/**
 * A real, uncontrolled checkbox, restyled: CSS elsewhere reacts to `:checked`
 * (TagRecord toggles its two variants that way).
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
