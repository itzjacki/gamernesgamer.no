# Tech Stack

- **Next.js App Router** — Server Components by default. `'use client'` only when genuinely needed.
- **React 19** — `.tsx` for all pages and components.
- **TypeScript strict** — extends `next` tsconfig.
- **Tailwind CSS v4** — tokens in `src/styles/global.css` via `@theme`.
- **Supabase** (`@supabase/ssr`) — Postgres (results only) + Auth (admin allowlist, invite-only, no public accounts).
- **Vercel OG / Satori** — shareable image generation as edge functions.

## Commands

- `npm run build` — primary correctness check (no test framework)
- `npm run dev` / `npm run start`
- `npm run lint` (`next lint`)
- `npx prettier --write <files>` — single quotes, `prettier-plugin-tailwindcss`

## Constraints

- Static content (gamers, games, power-ups) stays in `src/data/` as TypeScript. Never in the DB.
- Results data (points, finishing positions) lives in Supabase only.
- Admin routes protected server-side via Supabase session. Never client-side auth gating.
- Dynamic routes use `generateStaticParams()` for pre-rendering.
- All user-facing copy is Norwegian.
- Hosting: Vercel (Git push to deploy, no CI).
