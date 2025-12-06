import type { Gamer } from '@/components/GamerCard.astro';

export const gamers: Gamer[] = [
  {
    name: 'Jakob',
    nickname: '"The Professor"',
    imagePath: '/images/gamers/04/jakob.png',
    stats: {
      focus: 86,
      strategy: 99,
      mechanics: 83,
      mental: 78,
      versatility: 97,
      consistency: 86,
      tactics: 98,
    },
    overallRating: 90,
  },
  {
    name: 'Tobias',
    nickname: '"The Maestro"',
    imagePath: '/images/gamers/04/tobias.png',
    stats: {
      focus: 99,
      strategy: 85,
      mechanics: 89,
      mental: 86,
      versatility: 94,
      consistency: 92,
      tactics: 92,
    },
    overallRating: 90,
  },

  {
    name: 'Jørgen',
    nickname: '"All in"',
    imagePath: '/images/gamers/04/jorgen.png',
    stats: {
      focus: 83,
      strategy: 87,
      mechanics: 90,
      mental: 74,
      versatility: 77,
      consistency: 80,
      tactics: 86,
    },
    overallRating: 82,
  },
  {
    name: 'William',
    nickname: '"Iron Will"',
    imagePath: '/images/gamers/04/william.png',
    stats: {
      focus: 95,
      strategy: 59,
      mechanics: 92,
      mental: 90,
      versatility: 51,
      consistency: 92,
      tactics: 70,
    },
    overallRating: 78,
  },
];
