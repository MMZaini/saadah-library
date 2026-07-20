# Khoei Rijal Data Tools

Maintainer-only tools for the `/narrators` section.

The production app reads the committed JSON dataset from `data/rijal/khoei` through local API routes. It does not scrape ABLibrary at runtime and it does not serve a duplicate copy from `public/`.

## What Is Here

- `update-khoei.mjs`: fetches the 24 ABLibrary volumes, parses narrator entries, writes the optimized local dataset, validates it, and updates `data/rijal/khoei/current.json`.
- `reindex-search.mjs`: deterministically rebuilds search identities from the active committed narrator shards without a network fetch.
- `validate.mjs`: validates the committed runtime dataset without making network calls.
- `transliteration.mjs`: canonical token-level narrator transliteration rules and deterministic fallback.
- `generate-transliterations.mjs`: rebuilds transliteration artifacts for the active local release.
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
      transliteration-tokens.json
      transliterations.json
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

Rebuild English names after reviewing or extending the canonical token spellings:

```bash
yarn data:rijal:transliterations
```

Rebuild narrator search identities from the committed Arabic entries:

```bash
yarn data:rijal:reindex
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
- Search is by Arabic name/alias, structured identity declarations, subject-directed identity facts
  (such as an opening nisba or explicit `كناه بـ` statement), and English transliteration. A query
  may combine those facts with an exact lineage of two or more segments. It may also omit up to two
  complete internal ancestors when at least three lineage segments remain and the first and last
  segments still agree. The full body and transmission-chain names are intentionally not indexed
  because they frequently identify people other than the entry's subject. Latin diacritics are
  optional and common vowel variants are folded for matching.
- English names are reconstructed from one transliteration per unique Arabic token, keeping
  spellings consistent across every narrator and future dataset rebuild.
- The Arabic entry text is stored as source text; the app does not generate summaries or translations.
