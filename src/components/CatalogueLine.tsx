import { Fragment } from 'react';
import SerialLink from './SerialLink';

/**
 * The catalogue line above a page title (design.md, Notation). It always
 * opens with GG, the way home; the parts follow, split by " / ".
 */
export default function CatalogueLine({ parts }: { parts: React.ReactNode[] }) {
  return (
    <p className='text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
      <SerialLink href='/' label='GG, til forsiden'>
        GG
      </SerialLink>
      {parts.map((part, i) => (
        <Fragment key={i}> / {part}</Fragment>
      ))}
    </p>
  );
}
