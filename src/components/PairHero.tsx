import Link from 'next/link';
import type { PairPlayerView } from '@/lib/results/view-models';

/**
 * The /vs masthead. The two names sit at the outer edges and the two portraits
 * meet in the middle across ONE diagonal hairline — the same geometry as the
 * player index plates, and the page's only "vs": there is no lettering for it.
 * The pair's headline reading (a PairRow) closes the plate along its foot.
 *
 * Each side is ONE link to that player's career page, name and portrait
 * together: hovering or focusing anywhere on a side brings its portrait's
 * colour back and turns its name accent. The portrait is a child of its side's
 * link but is positioned against the whole plate, so the two can meet across
 * the diagonal; its clip-path is also its hit area, so each half of the
 * picture belongs to the right player.
 *
 * Accent at rest is the diagonal alone: an identity mark, like PlayerHero's
 * hairline, not a ranking signal — neither side is "the leader" here. Both
 * portraits are desaturated at rest so photos from different seasons read as
 * one set and neither player is dimmed relative to the other. (An accent
 * duotone on hover was tried in place of the colour and dropped.)
 *
 * On phones the names share a row above the portraits; nothing is dropped.
 */

interface Props {
  a: PairPlayerView;
  b: PairPlayerView;
  /** The mono strip: which seasons and how many games the page covers. */
  scope: string;
  /** The headline reading, set along the foot of the plate. */
  children: React.ReactNode;
}

/** Where the diagonal meets the top and bottom edge, in % of the portrait box. */
const TOP = 58;
const BOTTOM = 42;

/**
 * The portrait box, positioned against the plate's body: a full-width band
 * under the names on phones, a seven-cell box in the middle from `sm` up.
 */
const box =
  'absolute inset-x-0 bottom-0 h-40 sm:inset-x-auto sm:inset-y-0 sm:left-1/2 sm:h-auto sm:w-70 sm:-translate-x-1/2';

const clip = {
  a: `polygon(0 0, ${TOP}% 0, ${BOTTOM}% 100%, 0 100%)`,
  b: `polygon(${TOP}% 0, 100% 0, 100% 100%, ${BOTTOM}% 100%)`,
};

function Side({ player, side }: { player: PairPlayerView; side: 'a' | 'b' }) {
  return (
    // Not `relative`: the portrait inside resolves against the plate's body.
    // The padding keeps the name clear of the portrait box (below it on
    // phones, beside it from `sm` up).
    <Link
      href={`/spillere/${player.slug}`}
      className={`group focus-visible:outline-accent flex min-w-0 flex-col gap-1 p-4 pb-44 focus-visible:outline-2 focus-visible:-outline-offset-2 sm:h-60 sm:justify-center sm:gap-2 sm:p-8 ${
        side === 'a'
          ? 'sm:pr-[10.75rem]'
          : 'items-end text-right sm:pl-[10.75rem]'
      }`}
    >
      <span className='group-hover:text-accent group-focus-visible:text-accent max-w-full truncate text-2xl font-extrabold tracking-tight uppercase transition-colors sm:text-4xl'>
        {player.name}
      </span>
      <span className='text-text-muted max-w-full truncate font-mono text-xs tracking-wide sm:tracking-widest sm:uppercase'>
        {player.nickname}
      </span>

      <span aria-hidden='true' className={box} style={{ clipPath: clip[side] }}>
        <img
          src={player.imagePath}
          alt=''
          className={`absolute inset-y-0 h-full w-[58%] object-cover object-top brightness-90 contrast-125 grayscale transition duration-300 group-hover:brightness-100 group-hover:contrast-100 group-hover:grayscale-0 group-focus-visible:brightness-100 group-focus-visible:contrast-100 group-focus-visible:grayscale-0 motion-reduce:transition-none ${
            side === 'a' ? 'left-0' : 'right-0'
          }`}
        />
      </span>
    </Link>
  );
}

export default function PairHero({ a, b, scope, children }: Props) {
  return (
    <section className='border-border bg-bg border'>
      <p className='border-border text-text-muted flex h-10 items-center border-b px-4 font-mono text-xs tracking-wide uppercase sm:px-8 sm:tracking-widest'>
        {scope}
      </p>

      <div className='relative grid grid-cols-2'>
        <Side player={a} side='a' />
        <Side player={b} side='b' />

        {/* The portrait box's frame and the diagonal, drawn over both halves. */}
        <span
          aria-hidden='true'
          className={`border-border pointer-events-none border-t sm:border-x sm:border-t-0 ${box}`}
        >
          <svg
            viewBox='0 0 100 100'
            preserveAspectRatio='none'
            className='text-accent absolute inset-0 h-full w-full'
          >
            <line
              x1={TOP}
              y1='0'
              x2={BOTTOM}
              y2='100'
              stroke='currentColor'
              strokeWidth='1'
              vectorEffect='non-scaling-stroke'
            />
          </svg>
        </span>
      </div>

      <div className='border-border border-t'>{children}</div>
    </section>
  );
}
