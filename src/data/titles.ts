import type { Title } from '@/types/title';

export const titles = {
  sjakk: { name: 'Sjakk', genreTags: ['strategy'] },
  'old-school-runescape': { name: 'Old School RuneScape', genreTags: ['rpg'] },
  'counter-strike': { name: 'Counter-Strike', genreTags: ['shooter'] },
  'the-elder-scrolls-v-skyrim': {
    name: 'The Elder Scrolls V: Skyrim',
    genreTags: ['rpg'],
  },
  tetris: { name: 'Tetris', genreTags: ['puzzle'] },
  'pokemon-showdown': { name: 'Pokemon Showdown!', genreTags: ['strategy'] },
  trackmania: { name: 'Trackmania', genreTags: ['racing'] },
  'flat-out-2': { name: 'Flat Out 2', genreTags: ['racing'] },
  hearthstone: { name: 'Hearthstone', genreTags: ['card', 'strategy'] },
  'curve-fever': { name: 'Curve Fever', genreTags: ['party'] },
  'the-sims-4': { name: 'The Sims 4', genreTags: ['simulation'] },
  'warcraft-3': { name: 'Warcraft 3', genreTags: ['strategy'] },
  poker: { name: 'Poker', genreTags: ['card'] },
  wreckfest: { name: 'Wreckfest', genreTags: ['racing'] },
  'total-war-empire': { name: 'Total War: Empire', genreTags: ['strategy'] },
  'league-of-legends': { name: 'League of Legends', genreTags: ['moba'] },
  'world-of-warcraft': { name: 'World of Warcraft', genreTags: ['rpg'] },
  'battleblock-theater': {
    name: 'BattleBlock Theater',
    genreTags: ['platformer'],
  },
  'kerbal-space-program': {
    name: 'Kerbal Space Program',
    genreTags: ['simulation'],
  },
  geoguessr: { name: 'GeoGuessr', genreTags: ['puzzle'] },
  'jump-king': { name: 'Jump King', genreTags: ['platformer'] },
  'planet-coaster': { name: 'Planet Coaster', genreTags: ['simulation'] },
  'war-thunder': { name: 'War Thunder', genreTags: ['simulation'] },
  'hollow-knight': { name: 'Hollow Knight', genreTags: ['platformer'] },
  'pummel-party': { name: 'Pummel Party', genreTags: ['party'] },
  pubg: { name: "PlayerUnknown's Battlegrounds", genreTags: ['shooter'] },
  peak: { name: 'PEAK', genreTags: ['platformer'] },
  'ratz-instagib': { name: 'Ratz Instagib', genreTags: ['shooter'] },
  'trombone-champ': { name: 'Trombone Champ', genreTags: ['party'] },
  'garrys-mod': { name: "Garry's Mod", genreTags: ['sandbox'] },
  'fc-25': { name: 'FC 25', genreTags: ['sports'] },
  '2xko': { name: '2XKO', genreTags: ['fighting'] },
} as const satisfies Record<string, Title>;

export type TitleId = keyof typeof titles;
