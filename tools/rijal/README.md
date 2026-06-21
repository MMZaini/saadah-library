# Khoei Rijal Data Tools

Maintainer-only tools for the `/narrators` section.

The production app reads the committed JSON dataset from `data/rijal/khoei` through local API routes. It does not scrape ABLibrary at runtime and it does not serve a duplicate copy from `public/`.

## What Is Here

- `update-khoei.mjs`: fetches the 24 ABLibrary volumes, parses narrator entries, writes the optimized local dataset, validates it, and updates `data/rijal/khoei/current.json`.
- `validate.mjs`: validates the committed runtime dataset without making network calls.
- `ablibrary-client.mjs`, `protobuf.mjs`, `khoei-parser.mjs`, `shared.mjs`: source adapter, parser, and shared utilities used by the maintainer scripts.
- `tests/`: focused tests for parser behavior, API behavior, repository search/detail reads, and dataset layout.

## Current Production Data

The committed dataset is:

```text
data/rijal/khoei/
  current.json
  releases/<version>/
    manifest.json
    runtime/
      metadata.json
      index.json
      search.json
      narrators/volume-01.json ... volume-24.json
```

Only this compact runtime layout should be committed. Raw scrape snapshots, page dumps, parser reports, and `public/data/rijal/khoei` are intentionally not part of production.

## How It Was Used

The original one-time import fetched exactly 24 Arabic volumes of al-Khoei's `Mu'jam Rijal al-Hadith` from ABLibrary, parsed narrator entries, and generated 24 volume shards.

The generated manifest records the important import checks: discovered volume count, expected/fetched page count, parser entry count, zero omitted pages, and zero boundary errors.

## Commands

Validate the committed dataset:

```bash
yarn data:rijal:validate
```

Run all tests, including these tests:

```bash
yarn test
```

Regenerate the dataset only if the committed data must be rebuilt:

```bash
yarn data:rijal:update
```

Keep raw scrape snapshots for local debugging only:

```bash
yarn data:rijal:update --keep-raw
```

Do not commit `raw/` output. Regenerate again without `--keep-raw` before committing.

## Production Notes

- `/api/narrators/search` and `/api/narrators/[id]` read from `data/rijal/khoei`.
- `next.config.ts` includes the dataset in API route file tracing so deployments receive the JSON files.
- Search is by narrator name and alias, not full body text.
- The Arabic entry text is stored as source text; the app does not generate summaries or translations.
