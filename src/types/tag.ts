// One concept to everything that reads it (see `Tag`). The two vocabularies
// exist only because of where a tag is attached in the data.

// Attached to the title.
export type GenreTag =
  | 'shooter'
  | 'racing'
  | 'strategy'
  | 'rpg'
  | 'simulation'
  | 'platformer'
  | 'card'
  | 'puzzle'
  | 'party'
  | 'fighting'
  | 'sports'
  | 'moba'
  | 'sandbox';

// Attached to one season's instance. Hand-tagged, deliberately not derived
// from the DB's stage kinds, which record how results are stored.
export type FormatTag =
  | 'duel'
  | 'free-for-all'
  | 'battle-royale'
  | 'score-attack'
  | 'gold-rush'
  | 'climb'
  | 'speedrun';

export type Tag = GenreTag | FormatTag;
