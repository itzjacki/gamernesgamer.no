import type { Game } from '@/types/game';

export const games: Game[] = [
  {
    title: 'Sjakk',
    slug: 'sjakk',
    thumbnailPath: '/images/game-thumbnails/01/sjakk.jpg',
    chosenBy: 'Tobias',
    duration: '30 min',
    shortDescription:
      'Lynsjakkturnering (3/2). Single round robin inn i single elimination.',
  },
  {
    title: 'Old School RuneScape',
    slug: 'old-school-runescape',
    thumbnailPath: '/images/game-thumbnails/01/old-school-runescape.jpg',
    chosenBy: 'Jakob',
    duration: '30 min',
    shortDescription:
      '3 runder Last Man Standing (PvP BR mode), poeng for standing og kills legges sammen på slutten.',
  },
  {
    title: 'Counter-Strike: Global Offensive',
    slug: 'counter-strike-global-offensive',
    thumbnailPath:
      '/images/game-thumbnails/01/counter-strike-global-offensive.jpg',
    chosenBy: 'William',
    duration: '45 min',
    shortDescription:
      '1v1-turnering på custom 1v1-bane. Hver match er første til 7 wins. Single round robin inn i single elimination.',
  },
  {
    title: 'The Elder Scrolls V: Skyrim',
    slug: 'the-elder-scrolls-v-skyrim',
    thumbnailPath: '/images/game-thumbnails/01/the-elder-scrolls-v-skyrim.jpg',
    chosenBy: 'Jakob',
    duration: '60 min',
    shortDescription:
      'Gold Rush! Om å gjøre å skaffe mest penger på 60 minutter. Starter på en helt ny character, vanilla.',
  },
  {
    title: 'Tetris',
    slug: 'tetris',
    thumbnailPath: '/images/game-thumbnails/01/tetris.jpg',
    chosenBy: 'Jørgen',
    duration: '30 min',
    shortDescription:
      'Tetris.com, alle starter en game samtidig. Om å gjøre å få høyest score.',
  },
  {
    title: 'Pokemon Showdown!',
    slug: 'pokemon-showdown',
    thumbnailPath: '/images/game-thumbnails/01/pokemon-showdown.jpg',
    chosenBy: 'Jørgen',
    duration: '60 min',
    shortDescription:
      'Double battles i i Underused-klassen (UU). Man lager lag før dagen som en del av prep. Single round robin inn i single elimination.',
  },
  {
    title: 'Trackmania',
    slug: 'trackmania',
    thumbnailPath: '/images/game-thumbnails/01/trackmania.jpg',
    chosenBy: 'Tobias',
    duration: '60 min',
    shortDescription:
      'Time trials på 5 baner (bane 1 + fire tilfeldige) i den nåværende Winter-campaignen.',
  },
  {
    title: 'Flat Out 2',
    slug: 'flat-out-2',
    thumbnailPath: '/images/game-thumbnails/01/flat-out-2.jpg',
    chosenBy: 'William',
    duration: '45 min',
    shortDescription: 'Alle stunt maps, score kombineres til slutt.',
  },
];
