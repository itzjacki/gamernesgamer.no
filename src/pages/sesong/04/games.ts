import type { Game } from '@/types/game';

export const games: Game[] = [
  {
    title: 'League of Legends',
    slug: 'league-of-legends-04',
    thumbnailPath: '/images/game-thumbnails/04/league-of-legends-04.jpg',
    chosenBy: 'Jørgen',
    duration: '90 min',
    shortDescription:
      'Vi spiller 3 matcher med Arena, roterende lag. Om å gjøre å ha best plasseringer.',
    longDescription:
      'Spillerne spiller Arena-gamemode i lag av to og to. Kampene rulleres til alle har spilt med hverandre. Poeng blir utdelt for plassering i hver enkelt kamp, der 1. Plass gir 8 poeng, 2. = 7p, 3. = 6p, 4. = 5p, 5. = 4p, 6. = 3p, 7. = 2p og 8. = 1p. Spilleren med flest poeng etter alle kampene vinner. Flest best-plasseringer fungerer som tiebreaker. Prep er lov.',
    videoEmbedUrl: undefined,
  },
  {
    title: 'PEAK',
    slug: 'peak',
    thumbnailPath: '/images/game-thumbnails/04/peak.jpg',
    chosenBy: 'Jakob',
    duration: '60 min',
    shortDescription:
      'Om å gjøre å være høyest oppe etter 60 minutter. Ingen revives.',
    longDescription:
      'Om å gjøre å være høyest oppe etter 1 time eller når alle har dødd. Spiller med mod som gjør at vi kan progresse til neste areas uten å vente på alle. Ingen prep (unntatt en kort felles-sesjon). Spilles med proximity voice chat på. Ikke lov å revive andre. Easy difficulty. Vi samler sammen alle tinga som ligger på stranda og “snake drafter” blant de. Velger man ryggsekken får man ikke velge flere items. Klatring til toppen av tårnet på flyplassen bestemmer draft order. Tiebreaker: Race fra start, om å gjøre å komme lengst på 5 min',
    videoEmbedUrl: undefined,
  },
  {
    title: 'Ratz Instagib',
    slug: 'ratz-Instagib',
    thumbnailPath: '/images/game-thumbnails/04/ratz-instagib.jpg',
    chosenBy: 'William',
    duration: '75 min',
    shortDescription:
      'Vi spiller en rekke deathmatches, poeng gis for plassering per match.',
    longDescription: undefined,
    videoEmbedUrl: undefined,
  },
  {
    title: 'Trombone Champ',
    slug: 'trombone-champ',
    thumbnailPath: '/images/game-thumbnails/04/trombone-champ.jpg',
    chosenBy: 'Tobias',
    duration: '60 min',
    shortDescription:
      'Fellesspill av 8 sanger om poeng, etterfulgt 1v1 i finalen og bronsefinalen.',
    longDescription:
      'Alle spillerne banner en sang hver, så velger de sang etter hverandre i den lette kategorien, deretter gjør vi det samme i den medium kategorien. Vi teller poeng ut ifra plassering på hver enkelt sang. De to med mest poeng er i finalen og de to med minst poeng er i bronsefinalen. I finalene spilles det fra den vanskeligste kategorien. Spiller 1 banner en sang også velger spiller 2 sangen dere skal spille. Deretter snur rollene. Dersom det er 1-1 spilles sailors hornpipe.',
    videoEmbedUrl: undefined,
  },
  {
    title: 'Counter-Strike 2',
    slug: 'counter-strike-2',
    thumbnailPath: '/images/game-thumbnails/04/counter-strike-2.jpg',
    chosenBy: 'William',
    duration: '75 min',
    shortDescription:
      'Vi spiller en parkour map som fokuserer på CS movement. Om å gjøre å komme lengst på 75 minutter.',
    longDescription: undefined,
    videoEmbedUrl: undefined,
  },
  {
    title: "Garry's Mod",
    slug: 'garrys-mod',
    thumbnailPath: '/images/game-thumbnails/04/garrys-mod.jpg',
    chosenBy: 'Jørgen',
    duration: '60 min',
    shortDescription:
      'Om å gjøre å vinne flest races på en sled-building-server.',
    longDescription:
      'Spillerne spiller sled build! Om å gjøre å lage den raskeste sleden. Spillerne starter races hver 10. Minutt, hvor 1. Plass gir 4p, 2. = 3p, 3. = 2p og 4. = 1p. Best score når tiden er omme vinner. Dersom man ikke blir med i et race får man plasseringen etter den laveste racende spiller. Hvis to spillere er tied når tiden er omme skal de hver få 5 minutter på å bygge en slede fra scratch, hvor vinneren av dette løpet vinner.',
    videoEmbedUrl: undefined,
  },
  {
    title: 'FC 25',
    slug: 'fc-25',
    thumbnailPath: '/images/game-thumbnails/04/fc-25.jpg',
    chosenBy: 'Jakob',
    duration: '90 min',
    shortDescription:
      'Ultimate team-turnering. Lag bygges fra scratch i prep-preioden. Single round robin etterfulgt av single elimination.',
    longDescription:
      'Ultimate team tournament. Single round robin for seeding, Single elimination med bronsefinale. Man spiller så mye Ultimate Team i prep-tiden som man ønsker, og må bygge lag med det man får herfra. Jakob spanderer litt gamba 😈. Tiebreaker i groups: Målforskjell > Mål for > innbyrdes oppgjør',
    videoEmbedUrl: undefined,
  },
  {
    title: '2XKO',
    slug: '2xko',
    thumbnailPath: '/images/game-thumbnails/04/2xko.jpg',
    chosenBy: 'Tobias',
    duration: '90 min',
    shortDescription:
      'Velger en roster på 3 champions hver. Single round robin inn i Swiss-format (begge Bo3), etterfulgt av finale og bronsefinale (begge Bo5).',
    longDescription:
      'Alle spillere locker inn 3 champs for hele turneringen. Spillformatet er at alle starter med å spille mot hverandre, etter dette er det swiss stage der man spiller mot de som har like mange losses eller wins som deg/de som er igjen. De som får 3 wins er i finalen og de med tre losses er i bronsefinalen. Et game (ingame) er bo3 og vi spiller om best av tre games. Finalene er best of 5 games.',
    videoEmbedUrl: undefined,
  },
];
