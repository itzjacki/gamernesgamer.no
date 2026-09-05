# Code Conventions

## Principles

- Always prefer readable duplication with reusable components to overly configurable generics.
- Avoid clever code.

## Formatting: Prettier

- Formatting is handled by **Prettier** (`prettier ^3`) with
  **`prettier-plugin-astro`** for `.astro` files. Both are devDependencies.
- Config lives in `.prettierrc`: **single quotes** (`singleQuote: true`). The
  editor also sets `prettier.jsxSingleQuote: true` (in `.vscode/settings.json`),
  so JSX/attribute quotes are single too.
- **Always run Prettier on changed files before considering work finished.**
  There is no `format` npm script, so invoke it directly, e.g.:

  ```bash
  npx prettier --write <changed files>
  ```

  Running Prettier is part of "done" — treat unformatted changes as incomplete.
  (There is no linter; Prettier + TypeScript strict + `astro build` are the
  quality gates.)

## Astro component structure

- Components declare a local `interface Props { ... }` in the frontmatter, then
  destructure from `Astro.props`:

  ```astro
  ---
  interface Props {
    title: string;
    revealed: boolean;
  }
  const { title, revealed } = Astro.props;
  ---
  ```

- Some components additionally `export` the data interface they represent so data
  files can import it (e.g. `GamerCard.astro` exports `Gamer`/`GamerStats`,
  `PowerUpCard.astro` exports `PowerUp`). Types not tied to a single component
  live in `src/types/` (e.g. `Game`).
- Small helper functions used only for rendering are defined inline in the
  frontmatter (e.g. `capitalizeFirst` in `GamerCard.astro`).

## "Reveal" gating pattern

Content that should stay hidden until officially unveiled is gated by a boolean
and rendered with a ternary that shows a placeholder ("?", "Mystisk spill",
etc.) in the hidden branch:

```astro
const revealGames = true;
...
{ revealed ? <RealContent /> : <Placeholder /> }
```

Pages define `revealGamerCards` / `revealGames` / `revealPowerups` consts and
pass them into the relevant cards. Follow this pattern rather than commenting
content out.

## Imports

- Use the `@/*` alias (maps to `src/*`) for cross-directory imports:
  `import { games } from '@/data/sesong/04/games'`. Prefer it over deep relative
  paths. (A few older files still use relative imports for same-folder siblings;
  the alias is the going-forward default.)
- Data modules export **named consts** — `export const games`,
  `export const gamers`, `export const powerUps`, and sometimes
  `export const curses`. Import the named binding, not a default.

## Styling

- **Tailwind utility classes** in markup, plus scoped `<style>` blocks for the
  rare things utilities can't express (e.g. CSS grid template areas in
  `GamerCard.astro`).
- Use the project's design tokens defined in `src/styles/global.css` via the
  `@theme` block rather than raw hex values:
  - Colors: `reddish` (`#db5461`), `blueish` (`#73c9bb`), `grayish` (`#1d1a1f`),
    `darkblueish` (`#334d51`) — used as `text-reddish`, `bg-darkblueish`, etc.
  - Fonts: `font-sans` (Inter) and `font-quantico` (Quantico, used for headings
    and stat/display text).

## Language

- All user-facing copy is **Norwegian** (`<html lang="no">`). Keep new UI text,
  labels, and content in Norwegian. Code identifiers are a mix of English
  (types, props) and Norwegian domain terms (`sesong`, `gamers`) — follow the
  surrounding file.

## Naming

- Astro components: PascalCase (`GameCard.astro`).
- Data/type files: lowercase, kebab-case when multi-word (`power-ups.ts`).
- Seasons: zero-padded two-digit directories (`01`–`04`).
- Game `slug`s: kebab-case; they double as data keys and route segments.
