---
inclusion: fileMatch
fileMatchPattern: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.css']
---

# Code Conventions

Prefer readable duplication over configurable generics. Avoid clever code.

## Components

- Server Components by default. `'use client'` only for browser APIs, state or
  effects.
- Reach for the platform before client JS: the Popover API (`popovertarget`)
  for detail on demand, `<details>` for disclosure, and an uncontrolled
  checkbox with `:has(input:checked)` to switch between two prerendered
  variants. All the stats pages are interactive this way with no client code.
- Reuse the shared primitives (`Panel`, `Button`, `Checkbox`,
  `StatList`/`StatRow`, `SectionLabel`, `Heading`, `Popover` with
  `RecordLines`) instead of re-inlining surface, button, eyebrow or popover
  markup. Add a new primitive only when a real second use appears.
- Type props with a local `interface Props` above the component. Components that
  represent a data type (e.g. `GamerCard.tsx`) also export that interface. Types
  not tied to one component live in `src/types/`.
- Define small rendering helpers inline above the return.

## Reveal gating

Hide unrevealed content with a boolean ternary, never by commenting it out. Pages
define `revealGamerCards` / `revealGames` / `revealPowerups` and pass them down:

```tsx
{
  revealed ? <RealContent /> : <Placeholder />;
} // placeholder: "?", "Mystisk spill", etc.
```

## React & Next.js

- **Server Actions** for all mutations. No API routes unless Vercel OG needs one.
- **Fetch in Server Components directly.** Add an API layer only if it
  meaningfully simplifies things, decided at the point of need.
- `<Suspense>` around async Server Components; `loading.tsx` and `error.tsx` at
  the route level.
- Dynamic routes pre-render via `generateStaticParams()`.

## Comments

Names and types carry the what; comments carry the why. When unsure whether a
comment earns its place, leave it out.

- Comment only intent, constraints, gotchas and non-obvious contracts
  (e.g. "authoritative — from season_result", "null → notFound()").
- Never restate the name or type (`/** The player's name. */`).
- No design history in code ("tried X, dropped"). Rejected ideas live in
  `design.md` or `TODO.md`.
- A component gets at most a short header comment, and only when its job or a
  rule it enforces isn't obvious from its name.
- A wrong comment is a bug: update or delete it with the code it describes.

## Imports & data files

- `@/*` alias for all cross-directory imports.
- Data files export named consts only: `games`, `gamers`, `powerUps`, `curses`.
- Supabase: the server client (`@/lib/supabase/server`) in Server Components and
  Actions; the browser client (`@/lib/supabase/client`) in `'use client'` only.

## Styling

- Tailwind utilities in markup; CSS Modules (`.module.css`) only for what
  utilities can't express.
- Use the tokens in `src/styles/global.css` (`@theme`) — no raw hex values.
- Mobile-first.

## Naming

- Components: PascalCase (`GamerCard.tsx`). Data and type files: kebab-case
  (`power-ups.ts`).
- Season dirs are zero-padded (`01`–`04`). Game slugs are kebab-case and double
  as data key and route segment.
- Route segments and domain terms are Norwegian (`sesong`, `spillere`); types and
  props are English.
