# Saadah Library

Saadah Library ("The Library of Happiness") is a free, non-profit online platform that makes classical Islamic texts more accessible to readers worldwide. The project grew from a personal connection to a family library in Iraq and is intended as a public service: a reliable, well-organized digital library for students, researchers, scholars, and the curious public.

## Purpose

- Democratize access to important Islamic works by providing a clean, searchable, and mobile-friendly interface.
- Preserve scholarly material and citations, and make verified references and grading classifications easy to find.
- Provide an environment where translations, annotations, and scholarly contributions can be linked and shared.
- Offer the site as a charitable resource — free to use and open-source.

## What the app provides

- A browsable collection of key works including Al-Kāfi.
- English translations and arabic text.
- Bookmarks and personal saved items for study and review.
- Hadith sharing and grading classifications with verifiable source references.
- Responsive, accessible UI with adjustable text size, and keyboard-friendly navigation.

## Who it's for

- Students and researchers of Islamic studies.
- Community members seeking reliable translations and references.
- Scholars collaborating to improve digital editions and classifications.

## Tech stack

- **Framework:** Next.js 15 (App Router, Turbopack) with React 19
- **Language:** TypeScript
- **Data:** Local, versioned JSON dataset served from `public/data` — no runtime API dependency
- **Styling:** Tailwind CSS 3, tailwindcss-animate
- **UI primitives:** Radix UI (dialog, dropdown-menu, accordion, select, tooltip, etc.)
- **Icons:** Lucide React
- **Utilities:** class-variance-authority, clsx, tailwind-merge
- **Linting / Formatting:** ESLint 9, Prettier (with prettier-plugin-tailwindcss)
- **Package manager:** Yarn
- **Deployment:** Vercel

For developers:

1. Fork the repository and open a branch for your changes.
2. Run the app locally (see "Local development") and include tests where appropriate.
3. Open a pull request with a clear description of your changes.

## Local development

Install dependencies and run the dev server:

```bash
yarn install
yarn data:validate
yarn dev
```

Open http://localhost:3000 in your browser.

## Thaqalayn data

The app is fully self-contained: at runtime it reads a local, versioned dataset from
`public/data/thaqalayn` and makes **no external API calls**. A CI guard
(`scripts/data/check-runtime.mjs`, run via `yarn test:data`) fails the build if any
Thaqalayn API host reference is reintroduced into the app code.

Data is organized as immutable releases:

- `data/thaqalayn/current.json` — pointer to the active ("blessed") release.
- `data/thaqalayn/releases/<version>/canonical` — source-oriented canonical records.
- `data/thaqalayn/releases/<version>/runtime` — app-ready artifacts (books, per-volume
  hadiths, chapter structures, search shards, lookup, and random indexes).
- `public/data/thaqalayn/<version>/runtime` — the artifacts actually served to clients,
  with `public/data/thaqalayn/current/manifest.json` as the active-version pointer.

The crawl/import pipeline (below) is only for maintainers refreshing the dataset; it never
runs as part of serving the site.

Useful commands:

```bash
yarn data:import:github   # bootstrap from the open-source ThaqalaynAPI snapshot
yarn data:crawl           # dry-run sitemap discovery against thaqalayn.net
yarn data:update          # crawl thaqalayn.net and generate a candidate release
yarn test:data            # parser tests, data validation, runtime dependency scan
```

Scheduled data updates are configured in `.github/workflows/thaqalayn-data.yml`. The workflow
opens a PR after crawling, validation, tests, lint, typecheck, and build pass; it does not
auto-publish by default.

## License & Ethics

The project is intended as a charitable, educational resource. If parts of the repository are published under a specific license, they will be noted in their respective directories. If you need specific licensing or permission information for a given text or translation, please check the source files or contact the maintainers.

## Data sources

Hadith data is maintained as a local, versioned Saadah dataset derived from
[thaqalayn.net](http://thaqalayn.net/) and bootstrapped from the
[ThaqalaynAPI](https://github.com/MohammedArab1/ThaqalaynAPI) open-source data by Mohammed Arab.
We are grateful for their work in making this content accessible.

## Acknowledgements

This project is inspired by family history and a commitment to public knowledge. Special thanks to the team behind [thaqalayn.net](http://thaqalayn.net/) and [MohammedArab1](https://github.com/MohammedArab1) for the ThaqalaynAPI, as well as all contributors, reviewers, and scholars helping to improve the quality and scope of the library.
