# Product

## What this project is

Gamernes Gamer is the companion website for a recurring gaming tournament held
between a small group of friends. Each season, participants pick games, compete
across them for points, and crown a winner. The site presents each season's
lineup: the competing "gamers" (as football-card-style player cards with
stats), the games being played (with rules and descriptions), and — in seasons
that use them — power-ups and curses. Content is deliberately hidden behind
"reveal" flags so games and participants can be unveiled as hype builds toward
tournament day.

## Target users

- **The tournament group** (primary) — the participants themselves, using the
  site to see the lineup, rules, and results for each season.
- **Spectators** (secondary) — a modest audience following along. Not a large
  crowd, but a real one worth designing for.

## Key features

- Per-season pages showing gamer cards, games, and (when used) power-ups/curses
- Interactive, football-card-style gamer cards with stats and a tilt effect
- Game detail pages with rules, descriptions, thumbnails, and YouTube embeds
- "Reveal" flags to hide/show games, gamers, and power-ups until they're
  officially unveiled
- A countdown component for building anticipation before a tournament
- Archive of past seasons (currently seasons 1–4)

## Business context

- This is a hobby project, not a commercial product. It exists to make the
  tournament more fun and give spectators something to follow.
- **New seasons are recurring.** Adding a season is a core, repeated workflow —
  the structure is built around it.
- **The participant roster can change between seasons.** It has been stable so
  far, but the code should not assume a fixed set of players. (Commented-out
  entries for a planned-but-unjoined participant, "Kristin", exist in some data
  files for this reason — harmless leftovers.)
- **Power-ups and curses vary per season.** When present, they grant benefits
  paired with mandatory downsides, affecting either in-game play or scoring.
  Both their mechanics and their format can differ from season to season, so
  they are modeled per-season rather than globally.
- The site is Norwegian-language (`lang="no"`); all user-facing content is in
  Norwegian.
- The near-term direction is a significant upgrade to the site's functionality,
  so upcoming work is expected to be more code-heavy than content-heavy.
