// What a game was about, for "what is this player good at" stats. ONE concept
// to everything that reads it (stats, labels, UI — see `Tag`). The two
// vocabularies exist only because of where a tag is attached in the data.

// Follows the title: what kind of game it is, every season it appears.
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

// Follows one season's instance: what the contest was that time. Hand-tagged,
// deliberately not derived from the DB's stage kinds — those record how
// results are stored.
export type FormatTag =
  | 'duel'
  | 'free-for-all'
  | 'battle-royale'
  | 'score-attack'
  | 'gold-rush'
  | 'climb'
  | 'speedrun';

export type Tag = GenreTag | FormatTag;
