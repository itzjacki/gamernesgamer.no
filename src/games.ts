export interface Game {
  title: string;
  thumbnailPath: string;
  heroPath: string;
  chosenBy: string;
  duration: string;
  shortDescription: string;
  longDescription: string;
}

export const games: Game[] = [
  {
    title: 'Hearthstone',
    thumbnailPath: 'images/game-thumbnails/hearthstone.jpg',
    heroPath: 'https://i.imgur.com/5YQqZ5M.png',
    chosenBy: 'William',
    duration: '30 min',
    shortDescription:
      'Head-to-Head-turnering med decks laget av kun basickortene som alle har.',
    longDescription: 'Descriiiiiiiiiiiiiption',
  },
  {
    title: 'Curve Fever',
    thumbnailPath: 'images/game-thumbnails/curve-fever.jpg',
    heroPath: 'https://i.imgur.com/5YQqZ5M.png',
    chosenBy: 'Tobias',
    duration: '30 min',
    shortDescription:
      'Så mange free-for-alls vi rekker på 30 minutter med poengscoring basert på plassering.',
    longDescription: 'Descriiiiiiiiiiiiiption',
  },
  {
    title: 'The Sims 4',
    thumbnailPath: 'images/game-thumbnails/the-sims-4.jpg',
    heroPath: 'https://i.imgur.com/5YQqZ5M.png',
    chosenBy: 'Jakob',
    duration: '30 min',
    shortDescription:
      'Gold rush; om å gjøre å sitte igjen med mest penger etter 30 minutter på en ny sim.',
    longDescription: 'Descriiiiiiiiiiiiiption',
  },
  {
    title: 'Warcraft 3',
    thumbnailPath: 'images/game-thumbnails/warcraft-3.jpg',
    heroPath: 'https://i.imgur.com/5YQqZ5M.png',
    chosenBy: 'William',
    duration: '60 min',
    shortDescription: '4-way Free for all. Om å gjøre å overleve lengst.',
    longDescription: 'Descriiiiiiiiiiiiiption',
  },
  {
    title: "Poker - Texas Hold'em",
    thumbnailPath: 'images/game-thumbnails/poker.jpg',
    heroPath: 'https://i.imgur.com/5YQqZ5M.png',
    chosenBy: 'Jørgen',
    duration: '60 min',
    shortDescription:
      'Cash game, stacks på 200 og 1/2 blinds. Blinds dobler hvert 20. minutt. Om å gjøre å sitte igjen med mest penger etter 60 minutter.',
    longDescription: 'Descriiiiiiiiiiiiiption',
  },
  {
    title: 'Wreckfest',
    thumbnailPath: 'images/game-thumbnails/wreckfest.jpg',
    heroPath: 'https://i.imgur.com/5YQqZ5M.png',
    chosenBy: 'Tobias',
    duration: '60 min',
    shortDescription:
      'Så mange races vi rekker på 60 minutter med poengscoring basert på plassering.',
    longDescription: 'Descriiiiiiiiiiiiiption',
  },
  {
    title: 'Total War: Empire',
    thumbnailPath: 'images/game-thumbnails/total-war-empire.jpg',
    heroPath: 'https://i.imgur.com/5YQqZ5M.png',
    chosenBy: 'Jakob',
    duration: '60 min',
    shortDescription:
      'Round-robin for seeding etterfulgt av head-to-head-turnering. Land battles.',
    longDescription: 'Descriiiiiiiiiiiiiption',
  },
  {
    title: 'League of Legends',
    thumbnailPath: 'images/game-thumbnails/league-of-legends.jpg',
    heroPath: 'https://i.imgur.com/5YQqZ5M.png',
    chosenBy: 'Jørgen',
    duration: '30 min',
    shortDescription:
      'Mundo dodgball i baron pit. Round-robin for seeding etterfulgt av head-to-head-turnering.',
    longDescription: 'Descriiiiiiiiiiiiiption',
  },
];
