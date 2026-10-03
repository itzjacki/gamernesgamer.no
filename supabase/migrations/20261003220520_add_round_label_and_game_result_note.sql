-- =============================================================================
-- Add round.label and game_result.note
-- =============================================================================
-- Two purely-additive nullable text columns, both surfaced while seeding the
-- first season of production data:
--
-- • round.label — human-facing caption for a sub-event within a rounds stage.
--   The historical CSVs name their rounds (Trackmania "Track 1/2/7/9/12",
--   Flat Out 2 "High Jump"/"Bowling"/"Curling", Trombone song titles, …) but
--   the schema only had round.ordinal to sequence them. ordinal still orders
--   the rounds; label just preserves the name for display and archive flavour.
--   Nullable: a bare placement round with no meaningful name leaves it null.
--
-- • game_result.note — free-text context for a game's final result, mirroring
--   season_result.note. Its first use is game-level tiebreak stories that are
--   NOT a drawn match_game (match_game.tiebreak_winner already covers those):
--   e.g. S1 OSRS, where Jakob and Jørgen both scored 13 and Jørgen won a
--   tiebreaker. The placement already records WHO won; note records WHY.
--   Nullable: most games have no story and leave it null.
--
-- Both columns are additive and nullable, so there is no backfill and no
-- rewrite of existing rows.
-- =============================================================================

alter table round
  add column label text;

comment on column round.label is 'Optional human-facing caption for this sub-event (e.g. "High Jump", a track or song name). Display/archive only — ordinal still sequences the rounds.';

alter table game_result
  add column note text;

comment on column game_result.note is 'Optional free-text context for the game result, mirroring season_result.note. First use: game-level tiebreak stories that are not a drawn match_game (e.g. S1 OSRS 13–13, Jørgen won the tiebreaker).';
