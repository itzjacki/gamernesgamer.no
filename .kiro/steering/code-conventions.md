# Code Conventions

## Principles

- Prefer readable duplication over overly configurable generics.
- Avoid clever code.

## Formatting

- Prettier (`prettier ^3`), single quotes (`singleQuote: true`), `prettier-plugin-tailwindcss`.
- **Always run `npx prettier --write <files>` before finishing.** Part of done.
- Quality gates: Prettier + TypeScript strict + `next build`. No test framework.

## Components

- Server Components by default. `'use client'` only for browser APIs / state / effects.
- Props typed with a local `interface Props` above the component:

  ```tsx
  interface Props {
    title: string;
    revealed: boolean;
  }

  export default function SeasonHeader({ title, revealed }: Props) { ... }
  ```

- Components representing data types (e.g. `GamerCard.tsx`) also `export` those interfaces.
- Types not tied to one component live in `src/types/`.
- Small rendering helpers defined inline above the return.

## Reveal gating

Hide unrevealed content with a boolean ternary, never by commenting out:

```tsx
const revealGames = true;
{
  revealed ? <RealContent /> : <Placeholder />;
} // placeholder: "?", "Mystisk spill", etc.
```

Pages define `revealGamerCards` / `revealGames` / `revealPowerups` and pass them into cards.

## React & Next.js patterns

- Prefer modern React and Next.js features over older patterns.
- **Server Actions** for all mutations (results entry, admin operations) — no separate API routes unless Vercel OG requires it.
- **Fetch data in Server Components directly** — no API layer in between unless it meaningfully simplifies things. Decide at the point of need, not upfront.
- **`<Suspense>`** boundaries around async Server Components. Use `loading.tsx` for route-level skeletons.
- **Error boundaries** (`error.tsx`) at the route level for graceful failure handling.

## Imports

- `@/*` alias for all cross-directory imports: `import { games } from '@/data/sesong/04/games'`
- Data files export named consts only: `export const games`, `export const gamers`, `export const powerUps`, `export const curses`.
- Supabase: server client (`@/lib/supabase/server`) in Server Components/Actions. Browser client (`@/lib/supabase/client`) in `'use client'` only.

## Styling

- Tailwind utilities in markup. CSS Modules (`.module.css`) for the rare things utilities can't express.
- Use design tokens from `src/styles/global.css` (`@theme`). Read it before styling — no raw hex values.
- Mobile-first responsive design.

## Language & naming

- All UI copy is Norwegian (`lang="no"`). Code identifiers mix English (types, props) and Norwegian domain terms (`sesong`, `gamers`).
- Components: PascalCase (`GamerCard.tsx`). Data/type files: lowercase kebab-case (`power-ups.ts`).
- Season dirs: zero-padded (`01`–`04`). Game slugs: kebab-case. Route segments: Norwegian (`sesong`, `spillere`).
