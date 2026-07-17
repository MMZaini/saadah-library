# Saadah Library

Saadah Library ("The Library of Happiness") is a free, non-profit online platform that makes classical Islamic texts more accessible to readers worldwide. The project grew from a personal connection to a family library in Iraq and is intended as a public service: a reliable, well-organized digital library for students, researchers, scholars, and the curious public.

## Purpose

- Democratize access to important Islamic works by providing a clean, searchable, and mobile-friendly interface.
- Preserve scholarly material and citations, and make verified references and grading classifications easy to find.
- Provide an environment where translations, annotations, and scholarly contributions can be linked and shared.
- Offer the site as a charitable resource - free to use and open-source.

## What the app provides

- A browsable collection of key works including Al-Kafi and the current local Thaqalayn-derived corpus.
- Volume, category, and chapter explorers for multi-volume and single-volume books.
- English translations and Arabic text, with optional side-by-side reading.
- Persistent top-bar search across the whole library or within a book, with book/volume scoping, exact phrase, exact words, flexible matching, Arabic-aware matching/highlighting, and filter-only discovery.
- Bookmarks and personal saved items for study and review.
- Hadith sharing, copy actions, direct links, and grading classifications with verifiable source references.
- Volume-aware hadith routes for books whose hadith numbers repeat by volume, plus previous/next chapter navigation.
- Responsive, accessible UI with adjustable Arabic and English text size, reading preferences, reduced-motion support, and keyboard-friendly navigation.
- Local runtime data with client-side caching for large volume payloads and lightweight structure metadata.

## Who it's for

- Students and researchers of Islamic studies.
- Community members seeking reliable translations and references.
- Scholars collaborating to improve digital editions and classifications.

## Tech stack

- **Framework:** Next.js 15 (App Router, Turbopack) with React 19
- **Language:** TypeScript
- **Data:** Local, versioned JSON dataset served from `public/data`; the app has no external runtime API dependency
- **Search:** Server-backed local search over generated per-book search shards
- **Styling:** Tailwind CSS 3, tailwindcss-animate
- **UI primitives:** Radix UI (dialog, dropdown-menu, accordion, select, tooltip, etc.)
- **Icons:** Lucide React
- **Utilities:** class-variance-authority, clsx, tailwind-merge
- **Testing:** Vitest
- **Linting / Formatting:** ESLint 9, Prettier (with prettier-plugin-tailwindcss)
- **Package manager:** Yarn
- **Deployment:** Vercel

For developers:

1. Fork the repository and open a branch for your changes.
2. Run the app locally (see "Local development") and include tests where appropriate.
3. Open a pull request with a clear description of your changes.

## Local development

Install dependencies, validate the active dataset, run tests, and start the dev server:

```bash
yarn install
yarn data:validate
yarn test
yarn dev
```

Open http://localhost:3000 in your browser.

Useful development checks:

```bash
yarn test:data       # parser tests, grading coverage checks, data validation, runtime dependency scan
yarn test            # unit and regression tests
yarn lint            # eslint over app, components, and lib
yarn build           # production build
yarn format:check    # prettier check for app, scripts, tests, docs, and workflows
```

## Thaqalayn data

The app is fully self-contained: at runtime it reads a local, versioned dataset from
`public/data/thaqalayn` and makes **no external API calls**. A CI guard
(`scripts/data/check-runtime.mjs`, run via `yarn test:data`) fails the build if any
Thaqalayn API host reference is reintroduced into the app code.

Data is organized as immutable releases:

- `data/thaqalayn/current.json` - repository-side pointer used by validation and maintenance
  tooling; manual candidate generation can move it before a release is blessed.
- `data/thaqalayn/releases/<version>/canonical` - source-oriented canonical records.
- `data/thaqalayn/releases/<version>/runtime` - app-ready artifacts (books, per-volume hadiths, chapter structures, merged structure metadata, search shards, lookup, and random indexes).
- `public/data/thaqalayn/<version>/runtime` - the artifacts actually served to clients, with
  `public/data/thaqalayn/current/manifest.json` as the blessed active-version pointer.

The app reads those artifacts directly and uses a local `/api/search` route for server-side search/filtering. In the browser, large runtime payloads are cached in IndexedDB behind a versioned URL so repeated reading stays fast without making the dataset mutable.

The crawl/import pipeline below is a manual, maintainer-only tool. Saadah Library does **not**
automatically crawl, import, generate, advance, or publish Thaqalayn data. No GitHub Action is
configured to update the dataset. Dataset changes must be initiated deliberately, reviewed as
content changes, and promoted separately from ordinary application releases.

Useful commands:

```bash
yarn data:import:github   # manual bootstrap from the open-source ThaqalaynAPI snapshot
yarn data:crawl           # manual dry-run sitemap discovery against thaqalayn.net
yarn data:update          # manually crawl and generate an unreviewed candidate release
yarn test:data            # parser tests, data validation, runtime dependency scan
```

The normal CI workflow validates the checked-in dataset but never changes it. Running
`yarn data:update` writes a candidate release and repoints `data/thaqalayn/current.json`; it
does not update the public runtime unless a maintainer explicitly performs a separate
publication step. Generated candidates must not be treated as blessed merely because the
structural checks pass.

Data quality notes:

- Parser regression tests cover page parsing, grading extraction, and search behavior.
- `tests/data/gradings.test.mjs` keeps the list of books with grading data in sync with the active dataset.
- `data/thaqalayn/RECONSTRUCTIONS.md` records known reconstruction decisions and source cleanup notes.
- `scripts/data/check-runtime.mjs` guards against reintroducing runtime calls to Thaqalayn API hosts.

## License & Ethics

The project is intended as a charitable, educational resource. If parts of the repository are published under a specific license, they will be noted in their respective directories. If you need specific licensing or permission information for a given text or translation, please check the source files or contact the maintainers.

## Data sources

Hadith data is maintained as a local, versioned Saadah dataset derived from
[thaqalayn.net](http://thaqalayn.net/) and bootstrapped from the
[ThaqalaynAPI](https://github.com/MohammedArab1/ThaqalaynAPI) open-source data by Mohammed Arab.
We are grateful for their work in making this content accessible.

## Acknowledgements

This project is inspired by family history and a commitment to public knowledge. Special thanks to the team behind [thaqalayn.net](http://thaqalayn.net/) and [MohammedArab1](https://github.com/MohammedArab1) for the ThaqalaynAPI, as well as all contributors, reviewers, and scholars helping to improve the quality and scope of the library.
