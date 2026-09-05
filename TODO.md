# Review TODO

Found during code review, 2026-09-05.

## Bugs

- [ ] `sesong/01/games/[game].astro` — "Gå tilbake" link points to `/sesong/03` instead of `/sesong/01`
- [ ] `sesong/04/games/[game].astro` — "Gå tilbake" link points to `/sesong/03` instead of `/sesong/04`
- [ ] `src/data/sesong/01/gamers.ts` — copy-paste of sesong 02 data (wrong image paths, possibly wrong stats too)
- [ ] `src/data/sesong/02/gamers.ts` and `sesong/03/gamers.ts` are bit-for-bit identical — sesong 03 data was never filled in

## Structural

- [ ] `[game].astro` is duplicated across all four seasons with only the import path and back-link varying — consolidate into a shared component or layout
- [x] `Gamer`/`GamerStats` types are exported from `GamerCard.astro`; `PowerUp` from `PowerUpCard.astro` — move all types to `src/types/` so data files don't import from components
- [ ] `revealGamerCards`, `revealGames`, `revealPowerups` flags are copy-pasted in every season page — consider moving them into the season's data file

## Polish

- [ ] `LightningIcon.astro` — two near-identical SVG paths differing only in fill colour; collapse to one SVG with a dynamic `fill`
- [ ] `SeasonHeader.astro` — season links are a hardcoded static array; derive from a `CURRENT_SEASON` constant so adding a new season is one change, not many
- [ ] Hover colour `#2a252c` is hardcoded in both `GameCard.astro` and `PreviousSeasonLink.astro` — add as a design token in `global.css`
- [ ] `ScuffedCountdown.astro` — uses `var`, is commented out everywhere; either delete it or add a note that it's reactivated each pre-season
