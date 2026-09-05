# Technology Stack

## Languages

- **TypeScript** — used throughout (`.ts` data/type files and inside `.astro`
  component scripts). Config extends `astro/tsconfigs/strict`.
- **Astro** component syntax (`.astro` files) for pages, layouts, and
  components.
- **CSS** via Tailwind (utility classes) plus small scoped `<style>` blocks and
  one global stylesheet.

## Frameworks & libraries

- **Astro `^7.3.1`** — static site framework; the core of the project.
- **Tailwind CSS `^4.x`** — styling, wired in through `@tailwindcss/vite`.
  Theme tokens (custom colors, fonts) are defined in `src/styles/global.css`
  via the `@theme` block.
- **React `^19.x`** with `@astrojs/react` — the integration is installed and
  configured, though the current pages are authored in Astro. Available for
  interactive components when needed.
- **@astrojs/vercel** — Vercel adapter for deployment.

## Development tools

- Build: `npm run build` (`astro build`)
- Dev server: `npm run dev` (`astro dev`)
- Preview production build: `npm run preview` (`astro preview`)
- Format: Prettier (`prettier-plugin-astro`). Config: single quotes
  (`singleQuote: true`), and JSX single quotes enabled in the editor.
- Lint: no dedicated linter configured. TypeScript strict mode + `astro build`
  serve as the correctness check.

There is no test framework configured in this project.

## Infrastructure

- **Hosting: Vercel**, connected via Git integration (push to deploy). There is
  no `vercel.json`; deployment settings live in the Vercel dashboard.
- Build output goes to `dist/` (gitignored). Astro's generated types live in
  `.astro/` (gitignored).
- No CI workflows in the repo — Vercel handles build/deploy on push.

## Key constraints

- **Output is static.** `astro build` renders every route to static HTML.
  Because of this, any `.ts` file placed under `src/pages/` is treated as a
  route/endpoint and must export an HTTP handler — plain data modules belong in
  `src/data/`, not `src/pages/`.
- Dynamic routes (e.g. game detail pages) must supply `getStaticPaths()` so
  Astro can pre-render every page at build time.
- User-facing content is Norwegian.
