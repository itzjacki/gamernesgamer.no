import Link from 'next/link';

/**
 * A linked part of a catalogue line (design.md, Notation): the way back up,
 * e.g. `GG` to the front page or `Spillere` to the index. The hit area
 * reaches above and below the small type.
 */
export default function SerialLink({
  href,
  label,
  children,
}: {
  href: string;
  /** For when the visible part alone doesn't say where it goes. */
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className='hover:text-text-accent focus-visible:outline-accent relative underline underline-offset-2 transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-3 focus-visible:outline-2 focus-visible:outline-offset-2'
    >
      {children}
    </Link>
  );
}
