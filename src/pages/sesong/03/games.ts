import type { Game } from '@/types/game';

export const games: Game[] = [
  {
    title: 'World of Warcraft',
    slug: 'world-of-warcraft',
    thumbnailPath: '/images/game-thumbnails/03/world-of-warcraft.jpg',
    chosenBy: 'William',
    duration: '60 min',
    shortDescription:
      'Alle starter på en helt fersk bruker, om å gjøre å tjene mest gold på 60 minutter.',
    longDescription: `
      Goldrush på 60 minutter. Mest gold i inventory når 60 min har gått vinner. Må selge osv. før tiden går ut.
      30 min uten coms - 30 min med coms
      <br><br>
      Alle classes er tillatt. Lov å customisere karakteren før man starter, men ikke ha startet gamet før med den karakteren. Hvis man ikke har laget karakter går det av tiden din.
      Trening er ikke tillatt.
    `,
    videoEmbedUrl: undefined,
  },
  {
    title: 'BattleBlock Theater',
    slug: 'battleblock-theater',
    thumbnailPath: '/images/game-thumbnails/03/battleblock-theater.jpg',
    chosenBy: 'Kristin',
    duration: '60 min',
    shortDescription:
      'Vi spiller chapter 1 og får poeng for å finishe levels og samle gems, mens vi taper poeng for å dø.',
    longDescription: `
      Samle flest mulig poeng ved å spille gjennom hele chapter 1. Alle 9 levler + bossrom, IKKE bonusnivåene. Det er lov til å ta levler om igjen om man vil riske det.
      <br><br>
      Alle starter på 0 poeng (ja, du kan ende opp i minus)<br>
      -1 per death<br>
      +1 per level cleared<br>
      +2 per full gem clear på et level<br>
      +1 per yarn
      <br><br>
      Dersom man ender opp på samme poengsum kan man avgjøre en vinner ved å finne gjennomsnittskarakteren man har fått i kapittelet. Beste karakter (grade) vinner.
      <br><br>
      Normal difficulty. Ingen guides/internett. Ellers ingen restrictions.
      <br><br>
      Tiebreakers blir avgjort ved å bli enige om et nivå man skal fullføre fortest mulig, men man må samle alle gems + yarn. Uenighet? Resten bestemmer level som fullføres.
    `,
    videoEmbedUrl: undefined,
  },
  {
    title: 'Kerbal Space Program',
    slug: 'kerbal-space-program',
    thumbnailPath: '/images/game-thumbnails/03/kerbal-space-program.jpg',
    chosenBy: 'Jakob',
    duration: '60 min',
    shortDescription:
      'Ny save i science mode. Om å gjøre å unlocke flest techs på 60 minutter.',
    longDescription: `
      Vi starter på en ny save i Science mode, den som har unlocket flest techs etter 60 minutter vinner. Vi spiller på Easy difficulty, men skrur av quickloading og stock vessles. Det er altså ikke lov til å lagre/laste spillet vilkårlig - dersom noe går galt kan man leve med det eller revertere til launch (dette gjør at det er høye stakes på slutten av lange missions). Det er ikke lov til å bruke ship designs fra tidligere saves, men romskip man lager i løpet av de 60 minuttene har man lov til å lagre og gjenbruke skulle man ønske det.
      <br><br>
      Det er som nevnt antall techs som bestemmer hvem som vinner, det er ikke nok å ha science til å unlocke techs, man må faktisk unlocke de. Tiebreaker om noen har like mange techs er mengden science de har til overs.
    `,
    videoEmbedUrl: undefined,
  },
  {
    title: 'GeoGuessr',
    slug: 'geoguessr',
    thumbnailPath: '/images/game-thumbnails/03/geoguessr.jpg',
    chosenBy: 'Jørgen',
    duration: '60 min',
    shortDescription:
      'Vi spiller Community World, i 3 forskjellige moduser (alt lov, NM, NMPZ). Flest wins på 60 min vinner.',
    longDescription: `
      Spiller party geoguessr som vanlig, med formatet “Live Challenge”. Skal bare spille banen “A Community World”. De første 10 minuttene av spillet har man 60s per runde, og man har muligheten til å bevege seg fritt rundt. De neste 25 minuttene har man 20s per runde, og man har ikke mulighet til å gå rundt, men kan fremdeles scrolle og zoome. De siste 10 minuttene har man 10s per runde, og ikke mulighet til å bevege seg på noen måte. 
      <br><br>
      Vinneren er den som har flest førsteplasser. 
      <br><br>
      Tie breakers:
      <br>
      Hvis to spillere har uavgjort skal de spille i Duels-format uten multipliers eller healing., og de kan selv velge map om de vil. Dersom de ikke blir enige om en map så skal community world brukes. 
      Første person som vinner, vinner.
      Hvis det er flere enn 2 spillere som har uavgjort skal de spille Live Challenge, no moving 20s. Valgfri map dersom alle blir enige, hvis ikke blir det community world. Den som vinner i den rekkefølgen de ender opp i.
    `,
    videoEmbedUrl: undefined,
  },
  {
    title: 'Jump King',
    slug: 'jump-king',
    thumbnailPath: '/images/game-thumbnails/03/jump-king.jpg',
    chosenBy: 'Tobias',
    duration: '60 min',
    shortDescription:
      'Vi starter på en ny save. Personen som er høyest øyeblikket 60 minutter har passert vinner.',
    longDescription:
      'Starter new save, om å gjøre å komme seg høyest opp etter en time. En av oss tar tida og teller ned når det nærmer seg. Plasseringen til deltakerne når det har gått en time er den som er gjeldende, dersom to personer er like høyt oppe starter de fra bånn og har om å gjøre å komme seg høyest opp på 5 minutter.',
    videoEmbedUrl: undefined,
  },
  {
    title: 'Planet Coaster',
    slug: 'planet-coaster',
    thumbnailPath: '/images/game-thumbnails/03/planet-coaster.jpg',
    chosenBy: 'Jørgen',
    duration: '60 min',
    shortDescription:
      'Vi starter på en ny park i challenge mode. Om å gjøre å ha flest besøkende øyeblikket 60 minutter har passert.',
    longDescription:
      'Starter en ny save i Challenge mode, medium difficulty. For å starte denne saven går man på Play -> Challenge -> Grassland (er denne banen vi skal bruke) -> Medium Difficulty. Deretter er det nesten helt fritt fram, med unntak av selv-designede blueprints og alle former for lån. Det er altså lov med de blueprintsa som allerede finnes i spillet (som f.eks. klovnedo), men det er ikke lov å designe blueprints på forhånd og deretter bruke dem i GG. Deretter handler det bare om å ha flest mulig mennesker i parken etter 60 min. Det handler ikke om flest antall mennesker på et bestemt tidspunkt i løpet av spillet, men etter 60 min. (Ikke peak mennesker, men current mennesker). Dersom det er noen tie-breakers (Jeg tviler på at dette skjer), så skal begge personene fortsette saven i 5 minutter, hvor den som har høyest befolkning vinner.',
    videoEmbedUrl: undefined,
  },
  {
    title: 'War Thunder',
    slug: 'war-thunder',
    thumbnailPath: '/images/game-thumbnails/03/war-thunder.jpg',
    chosenBy: 'Jakob',
    duration: '60 min',
    shortDescription:
      'Turnering med 1v1 Bo3 duels i fly (maks 1.7 BR). Gruppespill etterfulgt av bronsefinale og finale.',
    longDescription: `
      Vi spiller en turnering med 1v1s i jagerfly. Vi starter med å spille en single round robin bo1 for seeding. Vi spiller til first blood, og pga. måten War Thunder funker (man kan bare bruke samme fly én gang per game) må vi starte match på nytt når noen dør. Dersom spillerene kræsjer i hverandre og begge dør på impact så telles ikke runden som en win for noen. Dersom noen dør av noen annen grunn (bli skutt ned, kræsjer i terrenget, kræsjer i motstander uten at motstander dør) så telles det som en win for spilleren som ikke døde først.
      <br><br>
      Etter gruppespillet spiller vi en double elimination bracket, der alle matcher er Bo3 med unntak av losers bracket finals, winners bracket finals, og eventuell winners bracket finals replay, disse er Bo5. Tiebreakers i gruppespillet skjer slik som dette H2H record om det er to som er tied og en Bo1 mini 1v1 bracket om det er flere enn to.
      <br><br>
      Man har bare lov til å bruke én flytype gjennom hele turneringa. Flyene man kan bruke må man unlocke, og består av nesten alle fighters og noen interceptors som er max BR 1.7 i Arcade Air Battles (Battle Rank er mål på hvor bra et fly er). Det er lov å unlocke upgrades til flyet sitt (dette går relativt fort), men ikke lov å oppgradere crewet sitt. Det er heldigvis lett å bytte til et u-oppgradert crew dersom man blir tvunget til å oppgradere crewet som del av opplæring eller glemmer seg, så ikke stress om dette skjer.
      <br><br>
      Matchene spilles i Custom battles, der man kan velge fritt blant “1v1 duel”-banene. Taper av forrige runde velger bane, mens i første runde bør den som har valgt først færrest ganger velge. Har man valgt først like mange ganger kan man slå mynt om det. Dere er voksne, figure it out. Det er viktig at man husker å endre weather til clear - siden det virker som at skyer kan være forskjellige hos forskjellige folk,vi skrur de derfor av så det garantert er likt.
    `,
    videoEmbedUrl: undefined,
  },
  {
    title: 'Hollow Knight',
    slug: 'hollow-knight',
    thumbnailPath: '/images/game-thumbnails/03/hollow-knight.jpg',
    chosenBy: 'Kristin',
    duration: '60 min',
    shortDescription:
      'Om å gjøre en boss rush med 10 bosser raskest mulig. Beste run i løpet av 60 minutter vinner.',
    longDescription: `
      Boss rush i 60 min. Om å gjøre å få best mulig tid på et fullført run. Screenshot eller skriv ned tiden etter runnet. Tiden kan eventuelt verifies ved replay.
      <br><br>
      Dersom dere blir ferdig før tiden kan dere spille gjennom boss rushet så mange ganger dere rekker for å forbedre tiden. Beste tid står.
      Dersom dere ikke kommer gjennom hele runnet er det bare om å gjøre og komme lengst mulig.
      <br><br>
      Det ligger en save file pinned i discord. Den skal gi tilgang til alle charms, spells og være fully upgradet. Bare paste filen inn i Hollow Knight folderen. 
      Min ligger i denne pathen: C:\Users\Kristin\AppData\LocalLow\Team Cherry\Hollow Knight
      <br><br>
      Hvordan dere velger å builde charms er helt fritt. De er kinda som runes eller upgrades. Sitt på benken for å endre charms. Det er ikke mulig andre steder. Hver charm tar x antall points, og du har et maks antall points å bruke. Choose wisely :))
      <br><br>
      Ingen bruk av guides/internett o.l. Lurer dere på basics er det selvfølgelig lov å spørre meg. Ingen bruk av bindings (de gjør det vanskeligere).
      <br><br>
      Tiebreakers bestemmes ved å bli enige om én boss begge skal fighte. Om å gjøre å slå den først. Tilgang via. boss practise rommet (Hall of Gods). MÅ være fra dette boss rushet.
    `,
    videoEmbedUrl: undefined,
  },
  {
    title: 'Pummel Party',
    slug: 'pummel-party',
    thumbnailPath: '/images/game-thumbnails/03/pummel-party.jpg',
    chosenBy: 'Tobias',
    duration: '60 min',
    shortDescription:
      'Vi spiller minigames i Pummel Party. Beste sammenlagte score vinner.',
    longDescription:
      'Vi spiller gjennom så mange minigames vi rekker på en time',
    videoEmbedUrl: undefined,
  },
  {
    title: "PlayerUnknown's Battlegrounds",
    slug: 'pubg',
    thumbnailPath: '/images/game-thumbnails/03/pubg.jpg',
    chosenBy: 'William',
    duration: '60 min',
    shortDescription:
      'Vi spiller en 5-spiller runde Battle Royale. Siste person i live vinner.',
    longDescription: `
      FFA - Last man standing
      Trekkes tilfeldig map fra en pool på 4 muligheter. Ikke snømap :)
    `,
    videoEmbedUrl: undefined,
  },
];
