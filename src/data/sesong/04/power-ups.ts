import type { PowerUp } from '@/components/PowerUpCard.astro';

export const powerUps: PowerUp[] = [
  {
    name: 'Safety Net',
    description:
      'Få mer poeng for siste (+2) og nest siste (+1) plass, men få mindre poeng for første (-2) og andre (-1) plass.',
    imagePath: '/images/power-ups/safety-net.svg',
  },
  {
    name: 'Gamba Time',
    description:
      'Gjett på hvem som kommer til å vinne neste spill, om personen vinner får man 2 poeng. Man kan ikke velge seg selv eller personen som valgte spillet.',
    imagePath: '/images/power-ups/gamba-time.svg',
  },
  {
    name: 'Double-Edged Sword',
    description:
      'Man bruker 4 poeng for å få doble poeng fra neste spill. Man kan ikke velge sitt eget spill',
    imagePath: '/images/power-ups/double-up.svg',
  },
  {
    name: "Crystal Ballin'",
    description:
      'Man gjetter rekkefølgen som alle kommer på i et spill. Man får 2 poeng dersom man treffer på alle.',
    imagePath: '/images/power-ups/gamba-time.svg',
  },
  {
    name: 'Successful tax evasion',
    description:
      'Man får en liten forbedring i resultatet i et spill, som avhenger av spillet power-upen brukes i.',
    imagePath: '/images/power-ups/safety-net.svg',
  },
  {
    name: 'Power-up-cloner',
    description:
      'Hvis man klarer å forutse at noen vil bruke en power-up på et spill, får man bruke den samme power-upen. Power-upens regler gjelder fortsatt. Kan brukes to ganger.',
    imagePath: '/images/power-ups/gamba-time.svg',
  },
  {
    name: 'Wide net',
    description:
      'Man får +1 på alle posisjoner unntatt første plass, der man får -2.',
    imagePath: '/images/power-ups/safety-net.svg',
  },
  {
    name: 'Back to back',
    description:
      'Brukes før et spill. Får man samme posisjon i spillet og spillet etter, så får man +2 poeng.',
    imagePath: '/images/power-ups/double-up.svg',
  },
];

export const curses: PowerUp[] = [
  {
    name: 'Unsuccessful tax evasion',
    description:
      'Man får en liten ulempe i et spill, avhenger av spillet den brukes i.',
    imagePath: '/images/power-ups/gamba-time.svg',
    isCurse: true,
  },
  {
    name: 'Sucks to suck',
    description:
      'Få 0 poeng dersom du får 4. eller 3. plass. Kan ikke brukes på eget spill.',
    imagePath: '/images/power-ups/safety-net.svg',
    isCurse: true,
  },
  {
    name: 'Not beating the allegations',
    description:
      'Motstanderne gjetter plasseringen du kommer til å få i et spill, dersom gjennomsnittet er riktig mister du 2 poeng.',
    imagePath: '/images/power-ups/double-up.svg',
    isCurse: true,
  },
  {
    name: 'Curse of the gambler',
    description: 'Du får en tilfeldig curse, blant cursesa valgt av andre.',
    imagePath: '/images/power-ups/gamba-time.svg',
    isCurse: true,
  },
];
