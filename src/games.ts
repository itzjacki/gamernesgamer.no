export interface Game {
  title: string;
  slug: string;
  thumbnailPath: string;
  chosenBy: string;
  duration: string;
  shortDescription: string;
  longDescription?: string;
  videoEmbedUrl?: string;
}

export const games: Game[] = [
  {
    title: 'Hearthstone',
    slug: 'hearthstone',
    thumbnailPath: '/images/game-thumbnails/hearthstone.jpg',
    chosenBy: 'William',
    duration: '30 min',
    shortDescription:
      'Head-to-Head-turnering med decks laget av kun basickortene som alle har.',
  },
  {
    title: 'Curve Fever',
    slug: 'curve-fever',
    thumbnailPath: '/images/game-thumbnails/curve-fever.jpg',
    chosenBy: 'Tobias',
    duration: '30 min',
    shortDescription:
      'Så mange free-for-alls vi rekker på 30 minutter med poengscoring basert på plassering.',
  },
  {
    title: 'The Sims 4',
    slug: 'the-sims-4',
    thumbnailPath: '/images/game-thumbnails/the-sims-4.jpg',
    videoEmbedUrl:
      'https://www.youtube.com/embed/TdZfbh7AdCM?si=5KXcv52O3s0yggRO',
    chosenBy: 'Jakob',
    duration: '30 min',
    shortDescription:
      'Gold rush; om å gjøre å sitte igjen med mest penger etter 30 minutter på en ny sim.',
    longDescription: `
      <p>
        Man har 30 minutter på å skaffe seg så mye penger man kan.
        Alle starter i skjermen for å lage en ny sim i en helt ny verden, vi 
        spiller uten expansions og mods. Når tiden starter lager man en sim og 
        velger den billigste tomme tomta (Bargain Bend) i det første nabolaget 
        (Willow Creek). Man må beholde denne tomta hele runda.
      </p>
      <br>
      <p>
        Følgende er ikke lov:
      </p>
      <ul>
      <li>- Å bruke juksekoder eller åpenbare exploits/bugs</li>
      <li>- Å flytte inn med/flytte inn med en annen sim</li>
      <li>- Å lage malerier</li>
      </ul>
      <br>
      <p>
        Vinneren er den som sitter igjen med mest penger (simoleons) når tiden 
        er ute. Skulle det mot formodning bli uavgjort bestemmes det av hvem som
        raskest klarer å skaffe 100 simoleons til.
      </p>
      `,
  },
  {
    title: 'Warcraft 3',
    slug: 'warcraft-3',
    thumbnailPath: '/images/game-thumbnails/warcraft-3.jpg',
    chosenBy: 'William',
    duration: '60 min',
    shortDescription: '4-way Free for all. Om å gjøre å overleve lengst.',
  },
  {
    title: "Poker - Texas Hold'em",
    slug: 'poker',
    thumbnailPath: '/images/game-thumbnails/poker.jpg',
    chosenBy: 'Jørgen',
    duration: '60 min',
    shortDescription:
      'Cash game, stacks på 200 og 1/2 blinds. Blinds dobler hvert 20. minutt. Om å gjøre å sitte igjen med mest penger etter 60 minutter.',
  },
  {
    title: 'Wreckfest',
    slug: 'wreckfest',
    thumbnailPath: '/images/game-thumbnails/wreckfest.jpg',
    chosenBy: 'Tobias',
    duration: '60 min',
    shortDescription:
      'Så mange races vi rekker på 60 minutter med poengscoring basert på plassering.',
  },
  {
    title: 'Total War: Empire',
    slug: 'total-war-empire',
    thumbnailPath: '/images/game-thumbnails/total-war-empire.jpg',
    videoEmbedUrl:
      'https://www.youtube.com/embed/WSD3k5_TgH4?si=FQulanI70-yWG3Cd',
    chosenBy: 'Jakob',
    duration: '60 min',
    shortDescription:
      'AI battle speedrun for seeding etterfulgt av head-to-head-turnering. Land battles.',
    longDescription: `
    <p>
      Alle battles spilles med følgende regler:
    </p>
    <ul>
      <li>- Multiplayer (også for singleplayer battle, velg 1 AI som opponent)</li>
      <li>- Land Battle</li>
      <li>- Map: Grassy Flatlands I</li>
      <li>- Time period: Late</li>
      <li>- Funds: Medium</li>
      <li>- Unit size: Medium</li>
      <li>- AI strength (der det er relevant): Easy</li>
      <li>
        - Faction: Man velger en faction før turneringa og må bruke denne i
        alle PvP-battles (Denne trenger dog ikke å være den samme som man bruker i  
        AI-battlen man spiller før turneringa).
      </li>
    </ul>
    <br>
    <p>
      Alle spiller mot en AI <em>før</em> turneringsdagen der man prøver å vinne 
      så fort som mulig. Tiden måles av praktiske årsaker med stoppeklokke på
      telefon/pc, man må derfor ikke sette spillet på høyere speed enn 1x. 
      Man kan prøve så mange ganger man vil, beste tid sendes inn innen fredag 
      6. oktober 16:00 og bestemmer seeding i H2H-turneringa.
      <br>
      <br>
      I AI-matchen spiller man mot en easy AI som bruker følgende army:
    </p>
    <ul>
      <li>- Faction: Prussia</li>
      <li>- General: General's Bodyguard</li>
      <li>- 2x Line infantry</li>
      <li>- 2x Superior line infantry</li>
      <li>- 2x Hussars</li>
    </ul>
    <br>
    <p>
      H2H-turneringa spilles på turneringsdagen og er double elimination. Man
      spiller Bo1 i alt unntatt finalen, som er Bo3.
    </p>
    `,
  },
  {
    title: 'League of Legends',
    slug: 'league-of-legends',
    thumbnailPath: '/images/game-thumbnails/league-of-legends.jpg',
    chosenBy: 'Jørgen',
    duration: '30 min',
    shortDescription:
      'Mundo dodgball i baron pit. Round-robin for seeding etterfulgt av head-to-head-turnering.',
  },
];
