# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Saadah Library is a free, non-profit Next.js reader for classical Shia hadith texts (Al-Kāfi and ~20 other works). Stack: **Next.js 15 App Router + Turbopack, React 19, TypeScript (strict), Tailwind CSS 3, Radix UI**. Package manager is **Yarn**. Deployed on Vercel.

The defining architectural constraint: the app is **fully self-contained at runtime and makes no external API calls**. All hadith data is served from a local, versioned JSON dataset under `public/data/thaqalayn`. A CI guard (`scripts/data/check-runtime.mjs`) fails the build if any Thaqalayn API host string is reintroduced into `app/`, `components/`, `lib/`, `next.config.ts`, or `middleware.ts`.

## Commands

```bash
yarn dev                 # dev server (Turbopack) on :3000
yarn build               # production build (plain `next build` → outputs to .next)
yarn start               # serve production build on :3001
yarn lint                # eslint app components lib
yarn lint:fix            # eslint --fix
yarn format              # prettier --write (also format:check for CI)
yarn fix                 # fix:check + format + lint:fix (run before committing)

yarn test                # vitest run (all tests)
npx vitest run tests/data/parser.test.mjs        # single test file
npx vitest run -t "name substring"               # single test by name
yarn test:data           # parser tests + data:validate + check-runtime (the data CI gate)

npx tsc --noEmit         # typecheck (no `typecheck` script; CI runs `yarn tsc --noEmit`)
```

There is no `typecheck` npm script and no single-command "verify everything"; CI runs `test:data`, `lint`, `tsc --noEmit`, and `build` separately (see `.github/workflows/thaqalayn-data.yml`).

### Data pipeline (maintainer-only — never runs at serve time)

```bash
yarn data:import:github  # bootstrap dataset from the ThaqalaynAPI GitHub snapshot
yarn data:crawl          # dry-run sitemap discovery against thaqalayn.net
yarn data:update         # crawl + generate a candidate release
yarn data:validate       # validate the active release
```

## Critical conventions

- **`basePath` is `/read`.** Every client-side `fetch`, share link, and asset URL must be prefixed with `process.env.NEXT_PUBLIC_BASE_PATH || ''` (see `lib/assets.ts` `withBasePath`). Forgetting this breaks links in production but works in some local cases.
- **Import alias `@/*` maps to repo root** (e.g. `@/lib/api`, `@/components/...`).
- **ESLint runs during `yarn build`.** `next.config.ts` sets `eslint.dirs: ['app', 'components', 'lib']` (no `ignoreDuringBuilds`), so the build fails on lint errors (warnings pass). `yarn lint` covers the same dirs.
- **Build output goes to `.next`** (no `distDir` override; `build` is plain `next build`). `.next` is gitignored and not tracked.

## Architecture

### Dataset model (immutable releases)

Data lives in two places with a version pointer:

- `data/thaqalayn/releases/<version>/{canonical,runtime}` — source-of-truth (`canonical`, typed in `lib/data/types.ts`) and app-ready artifacts (`runtime`).
- `public/data/thaqalayn/<version>/runtime/` — the artifacts served to clients: `books.json`, `volumes/<bookId>.json` (full hadiths), `structures/<bookId>.json` + `structures/all.json` (chapter trees), `search/<bookId>.json` (search shards), `lookup.json`, `random.json`.
- `public/data/thaqalayn/current/manifest.json` — points to the active version (`manifest.version`). Everything resolves the version through this manifest first.

### Two data-access layers (important)

The same dataset is read two different ways depending on server vs client:

1. **Server-side: `lib/data/server-repository.ts`** — reads JSON off the filesystem with `fs.readFile` + an in-memory promise cache. Used by the API routes (`/api/search`, `/api/book-structure`, `/api/all-book-structures`).
2. **Client-side: `lib/api.ts` (`thaqalaynApi`, `alKafiApi`, `uyunApi`, `bookApi`)** — fetches the same artifacts over HTTP from `/data/...`, also resolving the version via the manifest. Used directly by page components for hadith content.

`lib/api.ts` exposes API-shaped types (`Hadith`, `BookInfo`, `QueryResponse`) that the whole UI consumes — it is the compatibility surface left over from the migration off a live API.

### Structure metadata caching

Chapter/category structure (small) is fetched through API routes and cached client-side in **IndexedDB** via `lib/hadith-cache.ts`, wrapped by `lib/book-structure.ts`. On app load, `ClientProviders` calls `prefetchAllStructures()` (in `requestIdleCallback`) to pull every book's structure in one request and seed the cache, making book navigation instant. Hadith _content_ (large) is NOT prefetched — only structures.

### Search (two-stage)

1. **Server stage** — `app/api/search/route.ts` branches on `isArabicQuery`. Arabic matches against normalized text (`normalizeArabic`, diacritic-insensitive); English uses `flexibleEnglishMatch` (stemming + Islamic-term synonyms). Both ultimately call `searchLocalHadiths` in the server repo against the search shards. Scope is narrowed with `?book=id1,id2`.
2. **Client stage** — `components/SearchInterface.tsx` re-filters the returned results: grading filters, per-book/volume scoping, and three optional match modes (Flexible / Exact Words / Exact Phrase), plus highlighting via `getHighlightSegments`.

All search/Arabic-normalization logic lives in `lib/search-utils.ts`.

### Routing & book identity

Routes live under `app/` with the `/read` basePath. Book browsing has multiple trees:

- `app/[bookSlug]/...` — the **canonical generic** route for any book (page, `/chapter/...`, `/hadith/...`, `/volume/.../chapter/...`).
- `app/al-kafi/...` — Al-Kāfi-specific route (Al-Kāfi is linked here, not via `[bookSlug]`).
- `app/uyun-akhbar-al-rida/hadith/...` — Uyun-specific hadith route.

`lib/books-config.ts` is the source of truth for book identity: multi- vs single-volume config, URL-slug ↔ bookId mapping (`getBookUrlSlug` / `getBookIdFromUrlSlug`), and `SEARCHABLE_BOOKS` (the global search scope selector). `middleware.ts` 301-redirects known book slugs to lowercase. `lib/books.ts` holds display metadata (titles, authors, cover images) for the homepage grid, matched to bookIds by normalized-name fuzzy matching.

### Client state (all localStorage / in-memory, no backend)

Composed in `components/ClientProviders.tsx`:

- `lib/settings-context.tsx` — theme (forced dark), Arabic/English font size & family; drives CSS custom properties (`--hadith-arabic-font-size`, etc.); persisted with quota handling.
- `lib/bookmarks-context.tsx` — bookmarks (capped at 1000), notes, import/dedup; persisted.
- `lib/navigation-context.tsx` — scroll position + search state restore across navigation (in-memory only).
- `lib/chapter-context.tsx` — current chapter info for hadith pages.

### Display nuances

`components/HadithCard.tsx` is the core rendering unit (used in search, chapters, bookmarks). It strips the sanad (chain) from the matn, detects Arabic overflow for read-more, builds per-hadith share/source URLs (`getHadithUrl` / `getChapterUrl` use `books-config` to pick the right route tree), and renders grading badges with scholarly tooltips. Note `getChapterUrl` returns an unprefixed path, so raw `<a href>` uses must wrap it in `withBasePath` (Next only auto-applies basePath to `next/link` / navigation, not raw anchors).
