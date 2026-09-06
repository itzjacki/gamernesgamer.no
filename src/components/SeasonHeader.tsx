import { seasonData, currentSeason, type Season } from '@/data/sesong';

export default function SeasonHeader() {
  const seasons = Object.keys(seasonData) as Season[];

  return (
    <header>
      <nav>
        <ul className='bg-darkblueish mb-8 flex flex-wrap justify-center rounded-2xl px-2'>
          {seasons.map((season) => (
            <li
              key={season}
              className='border-grayish hover:border-y-reddish border-y-2 border-r-2 text-sm transition-all duration-200 last:border-r-0'
            >
              <a
                href={season === currentSeason ? '/' : `/sesong/${season}`}
                className='block p-2'
              >
                Sesong {Number(season)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
