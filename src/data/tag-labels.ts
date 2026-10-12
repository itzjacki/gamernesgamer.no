import type { Tag } from '@/types/tag';

// TODO(copy): best-effort Norwegian display labels — needs Jakob's pass.
export const tagLabels: Record<Tag, string> = {
  shooter: 'Skytespill',
  racing: 'Bilspill',
  strategy: 'Strategi',
  rpg: 'Rollespill',
  simulation: 'Simulator',
  platformer: 'Plattform',
  card: 'Kortspill',
  puzzle: 'Hjernetrim',
  party: 'Partyspill',
  fighting: 'Slåssespill',
  sports: 'Sport',
  moba: 'MOBA',
  sandbox: 'Sandkasse',
  duel: 'Duell',
  'free-for-all': 'Alle mot alle',
  'battle-royale': 'Battle royale',
  'score-attack': 'Poengjakt',
  'gold-rush': 'Gullrush',
  climb: 'Klatring',
  speedrun: 'Speedrun',
};
