import type { PowerUp } from '@/components/PowerUpCard.astro';

export const powerUps: PowerUp[] = [
  {
    name: 'Double-Edged Sword',
    description:
      'Man bruker 3 poeng for å få doble poeng fra neste spill. Man kan ikke velge sitt eget spill',
    imagePath: '/images/power-ups/double-up.svg',
  },
  {
    name: "Crystal Ballin'",
    description:
      'Man gjetter rekkefølgen som alle kommer på i et spill før spillet. Man får 2 poeng dersom man treffer på alle.',
    imagePath: '/images/power-ups/safety-net.svg',
  },
  {
    name: 'Accounting Error',
    description:
      'Man får en liten forbedring i resultatet i et spill, som avhenger av spillet power-upen brukes i.',
    imagePath: '/images/power-ups/gamba-time.svg',
  },
];
