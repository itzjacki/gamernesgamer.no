import type { PowerUp } from '@/types/power-up';

export const powerUps: PowerUp[] = [
  {
    slug: 'double-up',
    name: 'Double Up',
    description:
      'Dobbelt poeng for neste spill. Man kan ikke velge sitt eget spill',
    imagePath: '/images/power-ups/double-up.svg',
  },
  {
    slug: 'safety-net',
    name: 'Safety Net',
    description:
      'Få mer poeng for siste (+2) og nest siste (+1) plass, men få mindre poeng for første (-2) og andre (-1) plass.',
    imagePath: '/images/power-ups/safety-net.svg',
  },
  {
    slug: 'gamba-time',
    name: 'Gamba Time',
    description:
      'Gjett på hvem som kommer til å vinne neste spill, om personen vinner får man 3 poeng. Man kan ikke velge seg selv eller personen som valgte spillet.',
    imagePath: '/images/power-ups/gamba-time.svg',
  },
];
