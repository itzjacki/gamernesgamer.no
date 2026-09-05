## Bugs

- [x] `sesong/01/games/[game].astro` — "Gå tilbake" link points to `/sesong/03` instead of `/sesong/01`
- [x] `sesong/04/games/[game].astro` — "Gå tilbake" link points to `/sesong/03` instead of `/sesong/04`

## Structural

- [x] `[game].astro` is duplicated across all four seasons with only the data import and back-link varying
- [x] Types (`Gamer`, `GamerStats`, `PowerUp`) were defined inside components and imported by data files — moved to `src/types/`
- [x] `revealGamerCards`, `revealGames`, `revealPowerups` flags are copy-pasted across every season page
- [x] `src/data/sesong/01/gamers.ts` — season 1 has no stats; the file is a copy of sesong 02's data as a workaround

## Polish

- [x] `LightningIcon.astro` — two near-identical SVG paths that only differ in fill colour
- [ ] `SeasonHeader.astro` — season links are a hardcoded static array
- [ ] Hover colour `#2a252c` is hardcoded in both `GameCard.astro` and `PreviousSeasonLink.astro`
- [ ] `ScuffedCountdown.astro` — uses `var`, is commented out in all pages
