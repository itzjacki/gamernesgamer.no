# Product

## What this project is

Gamernes Gamer is the companion website for a recurring gaming tournament held
between a small group of friends. Each season, participants pick games, compete
across them for points, and crown a winner. The site is the permanent monument
and celebration of the tournament — an archive of every season's lineup, results,
and memorable moments, as well as a live companion during the 2-day event itself.

The primary value is **post-tournament**: stats, career records, champion history,
and "remember when" content that makes the tournament feel worth celebrating long
after it ends. The secondary value is **during-tournament**: a live leaderboard
and results tracker for the 2 days the event runs.

The social hub for the group is the group chat, not the site. The site supports
the chat by producing shareable artifacts (champion cards, podium graphics, player
stat cards) that people drop into it.

## Target users

- **The tournament participants** (primary) — the 4–5 competitors themselves,
  using the site to relive seasons, track career stats, and follow the live event.
- **Spectators** (secondary) — a modest audience following along. Not a large
  crowd, but a real one worth designing for.

## Key features (current and planned)

### Live

- Per-season pages showing gamer cards, games, and (when used) power-ups/curses
- Interactive, football-card-style gamer cards with stats and a tilt effect
- Game detail pages with rules, descriptions, thumbnails, and YouTube embeds
- "Reveal" flags to hide/show games, gamers, and power-ups until unveiled
- A countdown component for building anticipation before a tournament
- Archive of past seasons (currently seasons 1–4)

### Planned

- **The Hall** — a proper landing page celebrating the champion lineage, not just
  the most recent season
- **Player career pages** — all-time stats, championships, win rate, head-to-head
  records per player
- **Results in Supabase** — all historical results in a database, driving live
  stats and the admin panel
- **Live leaderboard** — real-time standings during the 2-day tournament (polling)
- **Admin panel** — custom results entry for a small group of trusted admins;
  replaces the spreadsheet
- **Shareable images** — champion card, podium, player stat cards via Vercel OG,
  for dropping into the group chat
- **Hall of Records** — all-time records and superlatives across all seasons
- **Head-to-head pages** — per-pairing career records and side-by-side stats
- **Content/media integration** — videos, funny images, and lore attached to
  seasons, games, and players; floating non-season content in Skattkammeret (/lore)
- **Collectible card variants** — champion cards, season cards, and moment cards
  building on the FIFA card visual identity

## Business context

- Hobby project. Fun and polish matter as much as utility.
- **New seasons are recurring.** Adding a season is a core, repeated workflow.
- **The participant roster can change between seasons.** Never assume a fixed set of players.
- **Power-ups and curses vary per season.** Modeled per-season, not globally.
- Norwegian-language site (`lang="no"`). All user-facing content in Norwegian.
- Tournaments run every 6–12 months, last 2 days. Monument for ~363 days, live companion for ~2.
- The group chat is the social layer. The site produces artifacts for it — no comments, reactions, or notifications.
