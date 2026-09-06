import Link from 'next/link';
import { seasonData, currentSeason, type Season } from '@/data/sesong';

export default function SeasonHeader() {
  const seasons = Object.keys(seasonData) as Season[];

  return (
    <header className='py-8'>
      <nav aria-label='Sesonger'>
        <ul className='flex flex-wrap justify-center'>
          {seasons.map((season) => (
            <li key={season} className='-mr-px'>
              <Link
                href={season === currentSeason ? '/' : `/sesong/${season}`}
                className='border-border-accent bg-bg text-text-muted hover:border-accent hover:text-accent focus-visible:outline-accent block w-[121px] border px-4 py-2 text-center font-mono text-xs tracking-widest uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
              >
                Sesong {Number(season)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
