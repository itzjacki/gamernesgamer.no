export interface Gamer {
  name: string;
  nickname: string;
  imagePath: string; // should be 1000px tall
  overallRating: number;
  stats: GamerStats;
}

export interface GamerStats {
  focus: number;
  strategy: number;
  mechanics: number;
  mental: number;
  versatility: number;
  consistency: number;
  tactics: number;
}

export const gamers: Gamer[] = [
  {
    name: 'Tobias Knapp Eliassen',
    nickname: '"The Maestro"',
    imagePath: 'images/gamers/tobias.png',
    stats: {
      focus: 99,
      strategy: 89,
      mechanics: 86,
      mental: 88,
      versatility: 86,
      consistency: 91,
      tactics: 95,
    },
    overallRating: 91,
  },
  {
    name: 'Jørgen Endrestad Kielland',
    nickname: '"All in"',
    imagePath: 'images/gamers/jorgen.png',
    stats: {
      focus: 96,
      strategy: 87,
      mechanics: 98,
      mental: 83,
      versatility: 76,
      consistency: 81,
      tactics: 91,
    },
    overallRating: 87,
  },

  {
    name: 'Jakob Endrestad Kielland',
    nickname: '"The Professor"',
    imagePath: 'images/gamers/jakob.png',
    stats: {
      focus: 74,
      strategy: 99,
      mechanics: 77,
      mental: 83,
      versatility: 94,
      consistency: 86,
      tactics: 95,
    },
    overallRating: 87,
  },
  {
    name: 'William Grimholt',
    nickname: '"Iron Will"',
    imagePath: 'images/gamers/william.png',
    stats: {
      focus: 93,
      strategy: 73,
      mechanics: 95,
      mental: 96,
      versatility: 76,
      consistency: 79,
      tactics: 77,
    },
    overallRating: 84,
  },
  // {
  //   name: 'Kristin Helene Lie Størkson',
  //   nickname: '"Sleeping Tiger"',
  //   imagePath: 'images/image.png',
  //   stats: {
  //     focus: 80,
  //     strategy: 93,
  //     mechanics: 79,
  //     mental: 93,
  //     versatility: 94,
  //     consistency: 95,
  //     tactics: 80,
  //   },
  //   overallRating: 88,
  // },
];
