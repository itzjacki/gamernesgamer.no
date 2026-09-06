'use client';

import { useRef } from 'react';
import type { Gamer, GamerStats } from '@/types/gamer';
import Statbar from './Statbar';

export interface Props {
  name: string;
  nickname: string;
  stats?: GamerStats;
  imagePath: string;
  revealed: boolean;
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function GamerCard({
  name,
  nickname,
  stats,
  imagePath,
  revealed,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const statBars = stats
    ? Object.entries(stats).filter(([key]) => key !== 'overall')
    : [];

  function animate() {
    const card = cardRef.current;
    if (!card) return;

    const t = targetRef.current;
    const c = currentRef.current;

    c.x += (t.x - c.x) * 0.1;
    c.y += (t.y - c.y) * 0.1;

    card.style.transformOrigin = 'center';
    card.style.transform = `perspective(1000px) rotateX(${c.x}deg) rotateY(${c.y}deg)`;

    const settled = Math.abs(t.x - c.x) < 0.01 && Math.abs(t.y - c.y) < 0.01;
    rafRef.current = settled ? null : requestAnimationFrame(animate);
  }

  function scheduleAnimate() {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(animate);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const mx = e.clientX - (rect.left + rect.width / 2);
    const my = e.clientY - (rect.top + rect.height / 2);
    targetRef.current = {
      x: Math.max(Math.min(-(my / (rect.height / 2)) * 20, 40), -40),
      y: Math.max(Math.min((mx / (rect.width / 2)) * 20, 40), -40),
    };
    scheduleAnimate();
  }

  function handleMouseOut() {
    targetRef.current = { x: 0, y: 0 };
    scheduleAnimate();
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseOut={handleMouseOut}
      className='relative'
    >
      <svg
        width='340'
        height='413'
        viewBox='0 0 340 413'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        aria-hidden='true'
      >
        <rect
          width='201.894'
          height='580.067'
          rx='5'
          transform='matrix(0.877421 0.479722 -0.535829 0.844327 224.626 -62.0838)'
          fill='#DB5461'
        />
        <rect
          x='51.7496'
          y='35.8591'
          width='241.888'
          height='331.231'
          rx='23'
          fill='#334D51'
        />
        <path
          d='M51.7496 206.5H263.862C271.041 206.5 276.862 212.32 276.862 219.5V223.413C276.862 230.593 271.041 236.413 263.862 236.413H51.7496V206.5Z'
          fill='#1D1A1F'
        />
      </svg>

      {revealed ? (
        <div className='cardGrid absolute top-0 left-0 z-10 h-full w-full pr-[15%] pb-[15%] pl-[16%]'>
          <p className='gridRating font-quantico self-end justify-self-center text-6xl'>
            {stats?.overall ?? '–'}
          </p>
          <p className='gridOverall font-quantico self-start justify-self-center text-xl'>
            Overall
          </p>
          <img
            className='gridImage -mb-px -ml-0.75 w-full self-end'
            src={imagePath}
            alt={`Bilde av ${name}`}
          />
          <p className='gridName font-quantico self-center pl-1 text-sm'>
            {name} – {nickname}
          </p>
          <div className='gridStats grid grid-cols-2 gap-x-2 p-2'>
            {statBars.map((stat) => (
              <Statbar
                key={stat[0]}
                statName={capitalizeFirst(stat[0])}
                statValue={stat[1]}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className='cardGrid absolute top-0 left-0 z-10 h-full w-full pr-[15%] pb-[15%] pl-[16%]'>
          <p className='gridRating font-quantico self-end justify-self-center text-6xl'>
            ?
          </p>
          <p className='gridOverall font-quantico self-start justify-self-center text-xl'>
            Overall
          </p>
          <p
            className='gridImage font-quantico w-full place-self-end text-center text-9xl'
            aria-hidden='true'
          >
            ?
          </p>
          <p className='gridName font-quantico self-center pl-1 text-sm'>
            Denne personen avsløres snart!
          </p>
          <div className='gridStats grid grid-cols-2 gap-x-2 p-2'>
            {statBars.map((stat) => (
              <Statbar
                key={stat[0]}
                statName={capitalizeFirst(stat[0])}
                statValue='?'
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        .cardGrid {
          display: grid;
          grid-template:
            'image rating' 35%
            'image overall' 10%
            'image .' 12%
            'name name' 8%
            'stats stats'
            / 55% 45%;
        }
        .gridRating { grid-area: rating; }
        .gridOverall { grid-area: overall; }
        .gridImage { grid-area: image; }
        .gridName { grid-area: name; }
        .gridStats { grid-area: stats; }
      `}</style>
    </div>
  );
}
