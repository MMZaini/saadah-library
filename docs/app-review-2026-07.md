# Saadah Library — full app review (UX, UI, features, performance, bugs)

_July 2026. Method: full code audit of `app/`, `components/`, `lib/`, plus a production build
(`next build` → `next start`) driven with a real browser at desktop (1440×900) and mobile
(390×844, touch) viewports across: home, global search + filters, Al-Kāfi, generic book pages,
chapter pages, hadith pages, bookmarks (empty + filled, bookmark/unbookmark flow), grading
tooltips, copy menu, narrators, and scans. API latencies and payload sizes were measured against
the local production server._

The app is in genuinely good shape: the build is clean (lint + types pass inside `next build`),
first-load JS is lean (~161–176 KB per route), the dark reading UI is calm and legible, the
IndexedDB caching layer works (a volume read in a chapter is *not* re-downloaded by the
bookmarks page), and touches like the `/reads` typo redirect, scroll restore, and the grading
tooltips with scholarly references are excellent. The findings below are ordered by impact.

---

## 1. Bugs (confirmed)

### 1.1 Kamāl al-Dīn is missing from the homepage, and its book page is broken-looking

The dataset has **21 books**; `lib/books.ts` lists **20** — `Kamal-al-Din-wa-Tamam-al-Nima-Saduq`
has no homepage entry. Consequences (verified in browser):

- The book is unreachable by browsing; only global search or a direct URL
  (`/read/kamal-al-din-wa-tamam-al-nima`) finds it.
- On its book page the H1 renders the **raw dataset ID**: “Kamal-al-Din-wa-Tamam-al-Nima-Saduq”
  (the title-resolution chain `findTitleFromBooksList → getBookConfig(...).englishName` falls
  through to the ID because there is no `books.ts` entry and the single-volume `getBookConfig`
  fabricates `englishName = bookId`).
- Its cover image 404s (broken-image alt text is visible in the header).

Fix: add the book to `lib/books.ts` (title, author, cover) — and consider a data test asserting
`books.ts` covers every `bookId` in `runtime/books.json` so the next dataset update can’t
silently drop a book from the UI.

### 1.2 Raw dataset IDs leak into the search placeholder on every single-volume book page

`app/[bookSlug]/page.tsx` builds the TopBar placeholder from `getBookConfig(bookId)?.englishName`,
which for single-volume books is just the ID. Verified: Al-Tawḥīd’s page shows
**“Search Al-Tawhid-Saduq…”**. `SINGLE_VOLUME_BOOKS` configs need real `englishName`s (the
strings already exist in `SEARCHABLE_BOOKS[].displayName` — reuse them).

### 1.3 `getBookConfig` returns `null` for both Kitāb al-Ghayba books

They are in `URL_TO_BOOK_ID_MAP` and `SEARCHABLE_BOOKS` but **not** in `SINGLE_VOLUME_BOOKS`,
so every `getBookConfig`-dependent path silently degrades for them (volume badge, grading-filter
eligibility, `HadithCard` URL building takes the fallback branch). Add both IDs to
`SINGLE_VOLUME_BOOKS`.

### 1.4 “All Gradings” chip nukes *all* filters

In `SearchInterface.tsx` the `all` grading option is wired to `clearAllFilters()`, which also
clears the “Search In” book scope and the search modes. A user who scoped a search to two books
and then clicks “All Gradings” (intending only to reset gradings) loses the book scope. Should
be `setSelectedGradings(['all'])` only.

### 1.5 The localStorage quota-recovery path can never run

Both `settings-context.tsx` and `bookmarks-context.tsx` detect quota errors with
`error.message.includes('QuotaExceededError')`. Browsers put that string in `error.name`, not
`message` (Chrome: “…exceeded the quota.”, Firefox: “The quota has been exceeded.”), so the
recovery branch is dead code. Check `error.name === 'QuotaExceededError' || error.code === 22`.

### 1.6 Generic chapter page “Back” goes to the homepage

`app/[bookSlug]/chapter/.../page.tsx` renders a “Back” button that does
`router.push(withBasePath('/'))` — from a chapter of Al-Tawḥīd you land on the home grid, not
the book. The Al-Kāfi chapter route has a proper “Back to Al-Kāfi Explorer” button. Make the
generic route go back to `/${bookSlug}` and label it with the book name.

### 1.7 Duplicated “category · chapter” subtitles

When `category === chapter` (common in Al-Kāfi vol. 1) the hadith page subtitle shows
“Volume 1 · The Book of Intelligence and Ignorance · The Book of Intelligence and Ignorance”,
and the chapter pager shows the same string as both the chapter name and category caption
(verified in screenshots). Dedupe when the two strings match.

### 1.8 “1 hadiths”, “1 chapters”

Category rows in `VolumeStructure`/`GenericBookBrowser` don’t singularize
(“1 hadiths • 1 chapters” visible on the Al-Kāfi Introduction row). `HadithCard`’s chapter cards
already do this correctly — copy the pattern.

### 1.9 Persian-yeh ḍaʿīf spellings are inconsistently matched

`GradingFilter.classifyGrading` matches both `ضعيف` (Arabic yeh) and `ضعیف` (Persian yeh), but
`HadithCard.gradingVariant` and the server’s `GRADING_KEYWORDS` only match the Arabic-yeh form.
A hadith graded with the Persian-yeh spelling gets a grey (not red) badge and is missed by the
`daif` search filter. Normalize yeh forms before matching (you already normalize them in
`normalizeArabic` — reuse it).

### 1.10 Clipboard actions have no failure handling

All copy handlers in `HadithCard` `await navigator.clipboard.writeText(...)` with no catch. On
insecure origins / denied permission this is an unhandled rejection and the user gets no
feedback (the “Copied” flash never appears, but neither does an error). Wrap with a fallback
(`document.execCommand('copy')` textarea trick) or at least flash “Copy failed”.

### 1.11 Search history is effectively dead

`SearchBar` only saves a query to history on **Enter**, but the whole app searches live on
debounce — most users never press Enter, so the “Recent searches” dropdown stays empty forever.
Save the query when a search actually runs (e.g. debounced, after ≥3 chars, from
`use-server-search`), not on Enter.

### 1.12 Bookmarks-page papercuts

- **“Refresh” = `window.location.reload()`** — a full page reload on a purely local page; it
  also renders when there are zero bookmarks. Either remove it or make it re-run the fetch.
- **Removing a bookmark flashes the whole list into a loading spinner** — the fetch effect is
  keyed on `bookmarks`, so any toggle refetches everything (cache makes it fast, but the list
  still unmounts into the `loading` branch). Key the fetch on the set of bookmark keys and
  drop removed items locally instead.
- **Legacy fallback can download the entire corpus**: for a bookmark without `bookId`,
  `searchAllBooks('#id')` fetches *every volume* (~100 MB raw / ~15 MB gzipped) client-side.
  Old-format bookmarks arrive via Import. Drop the fallback and show “couldn’t locate” instead.

---

## 2. Performance

### 2.1 `/api/search` returns unbounded multi-megabyte responses (highest-impact issue)

Measured on the production build (local, warm):

| Query                     | Time  | Payload      | Results |
| ------------------------- | ----- | ------------ | ------- |
| `q=patience`              | 1.40s | **4.6 MB**   | 343     |
| `q=knowledge`             | 1.52s | **13.8 MB**  | 1,249   |
| `q=god`                   | 1.47s | **18.2 MB**  | 2,575   |
| `filterOnly=1&grading=daif` | 0.17s | **14.3 MB** | 4,281   |

Each hit is a **full `Hadith` object** (complete Arabic + English + sanad + gradings). The
client then paginates 10 per page, re-filters, and *also* keeps the whole array in memory in
`navigation-context`. On a phone connection a common query is many seconds of download, and on
Vercel it’s function egress per keystroke-settle. Fixes, in increasing order of effort:

1. **Cap + paginate on the server** (`?limit/&offset`, default ~100–200), and return trimmed
   records for the list view (id, bookId, volume, chapter ids, gradings, ~300-char snippets
   around the first match). Full text is already fetchable per-hadith via the cached volume
   artifact when a card is opened.
2. Add `Cache-Control: public, s-maxage=...` to search responses (dataset is immutable per
   version; key the cache off the manifest version). `/api/all-book-structures` already does
   this — search has **no cache header at all**.
3. Precompute normalized/tokenized search shards at release-build time. Today every request
   re-runs `normalize('NFKD')`/tokenization over all ~33k entries
   (`matchesEnglishExactPhrase` tokenizes the full text of every entry per request), which is
   where the ~1.4s CPU goes. Storing pre-normalized text (or token arrays) in the shards would
   cut this dramatically; a simple inverted index would make it near-instant.
4. The server `jsonCache` grows without bound — a single `filterOnly` over all books loads the
   entire 101 MB dataset into the function’s memory permanently. Add an LRU or size cap.

### 2.2 Whole-volume downloads for single-hadith/chapter views

Every chapter/hadith read fetches the full volume JSON (Al-Kāfi vols: 6.3–7.2 MB raw,
~1.1 MB gzipped). The IndexedDB layer makes the *second* visit free, but first visits — and the
**Random** tab, which downloads a full volume to show one hadith — pay it every time per volume.
Options:

- Ship per-chapter artifacts (`volumes/<bookId>/<categoryId>-<chapterId>.json`) alongside the
  volume files; chapter/hadith pages fetch those, volume-level features keep the big file.
- For **Random**, add a tiny `/api/random` (the server already has `getLocalRandomHadith`
  reading the purpose-built `runtime/random.json`) instead of downloading a volume client-side.

### 2.3 Chapter pages render every hadith at once, and every card thrashes layout

A large chapter mounts hundreds of `HadithCard`s with no windowing, and each card’s
Arabic-overflow check **clones its DOM subtree into `document.body`** on mount and on **every
window resize** (unthrottled listener per card). With ~100 cards, one resize = ~100 clone +
append + measure + remove cycles.

- Replace the clone-measure with a direct `scrollHeight > clientHeight` check on the clamped
  element (or a shared `ResizeObserver`), debounce it, and
- Render long chapters incrementally (slice + “Load more” or virtualization).

### 2.4 First-load structure prefetch is 3.3 MB (≈420 KB gzipped)

`prefetchAllStructures()` pulls `structures/all.json` on every cold browser. It makes book
navigation feel instant (nice!), but it’s a chunky idle download on mobile data for a visitor
who may only read one hadith from a share link. Consider: don’t prefetch on hadith/chapter
landing pages (deep links), or prefetch only the current book’s structure there.

### 2.5 Covers ship at full size

`next/image` is `unoptimized` (deliberate) but the source JPEGs are up to **400 KB** each,
~3 MB for the grid, decoded at 80×112 px on mobile. Pre-generate resized WebP/AVIF variants at
build time (e.g. 160/320/640 w) and use `srcSet` — no Vercel optimizer needed.

### 2.6 Bookmark toggles re-render every visible card

`isBookmarked` linearly scans the bookmarks array, and because the context value changes
identity on any toggle, all memoized `HadithCard`s re-render. Keep a `Set` of
`bookId::id` keys (O(1) lookup), and/or split the context so cards subscribe to a stable
`isBookmarked` accessor.

### 2.7 Repo/deploy weight

`public/pdfs` is **975 MB tracked in git** (the `.git` dir is ~1 GB) and `public/data` is
176 MB. Clones, CI checkouts, and deploy uploads all carry this. Consider Git LFS or moving
PDFs to object storage/release assets; also `data/thaqalayn/releases/<v>/` duplicates what’s in
`public/data/thaqalayn/<v>/`.

### 2.8 Smaller items

- Search requests aren’t aborted — the seq guard prevents stale state, but a superseded 18 MB
  response still downloads fully. Use `AbortController` in `use-server-search`.
- `getBookIdFromUrlSlug` rebuilds its lowercase map on every call (it runs in render paths).
  Hoist it to module scope.
- `navigation-context` stores full result arrays per path for the whole session — store ids or
  cap the size.
- `VolumeStructure`’s cursor-glow updates CSS variables on every `mousemove`; combined with
  700–1100 ms `max-height` transitions the chapter cards feel heavier than they should.
- The `data-motion="reduced"` setting exists, but the OS-level `prefers-reduced-motion` media
  query is ignored — respect it as the default.

---

## 3. UX / UI suggestions

### Both platforms

1. **Search state isn’t in the URL.** Queries, scopes, and filters vanish on share/refresh
   (in-memory restore only helps the same session). Sync `?q=`, scope, and modes to
   `searchParams` — this also makes browser back/forward behave as users expect.
2. **Relevance + snippets.** Results are sorted by volume/id, so query “patience” returns as
   hit #1 a page-long theological preamble whose match is buried below the fold (verified).
   Rank by match quality (phrase > all-words > stem; term frequency) and show a snippet
   window centered on the first match instead of the first 750 characters.
3. **No “clear” (×) inside the search field itself** — clearing means selecting-all + delete on
   mobile (the Clear button lives down in the results header). Add an inline ×.
4. **Hadith numbering is confusing**: the page title says “Al-Kāfi Hadith #5” while the text
   begins “4. Muhammad ibn Yahya…” (dataset id vs in-chapter number). Label both explicitly,
   e.g. “Hadith 4 in this chapter · #5 in Volume 1”.
5. **Jump-to-hadith / position**: on long chapter pages there’s no way to jump to hadith N, no
   scroll-to-top button, and no progress indicator. A small sticky “n / N” with a jump field
   would help serious readers.
6. **Explore mode names**: “Volume Explorer / Chapter Tree / Random” — the first is a chapter
   grid, the second is a two-pane browser, and internally the keys (`structure/chapters/explorer`)
   don’t match the labels. Consider “Chapters / Tree view / Random hadith”.
7. **Two-pane Chapter Tree selection isn’t shareable** — picking a chapter loads hadiths in
   place with no URL change, while the Volume Explorer navigates to real chapter routes. Make
   the tree link to the chapter routes too (it also removes the nested-scrollbar issue below).
8. **Grading tooltip content is great** — consider adding the same explanations to a small
   “What do gradings mean?” page linked from the filter, since the tooltip is easy to miss.
9. **Light theme**: full light-mode CSS tokens exist in `globals.css` but the theme is forced
   dark. Either ship the toggle (reading apps get strong demand for light/sepia modes) or
   delete the dead tokens. Note the hardcoded `zinc-*`/legacy classes (§4.2) block this today.
10. **PWA/offline**: the app is fully self-contained and already caches data in IndexedDB — a
    manifest + service worker would make it installable and offline-capable, which is a
    standout feature for a hadith reader. (Precache shell + current dataset version.)
11. **“Continue reading”**: persist the last few visited chapters (localStorage) and surface
    them on the homepage.
12. **Accessibility**: icon-only buttons (bookmark, language toggle, open-in-new-tab, TopBar
    tools) have tooltips but no `aria-label`; the bookmark toggle should expose
    `aria-pressed`. Radix Tooltip content is not an accessible name. Quick, high-value fixes.
13. **Empty-state Refresh / error styling**: error banners in the legacy components use
    light-mode palettes (`bg-red-50` with `dark:` overrides) while the app is dark-only —
    unify on the `destructive` tokens.

### Mobile-specific

14. **Side-by-side default on phones**: `sideBySide: true` by default renders Arabic + English
    stacked on every card, and the per-card language toggle is hidden in this mode — a phone
    user can’t collapse Arabic without finding Settings. Consider defaulting side-by-side off
    below `lg`, or keeping the per-card toggle visible on mobile.
15. **Long-press previews on chapter cards** (250 ms hold to expand the clipped title) are
    undiscoverable, and a “slow tap” (>250 ms) does nothing — it neither navigates nor clearly
    previews. Simplest: let titles wrap to 3–4 lines on mobile and make every tap navigate.
16. **Nested scroll containers** (Chapter Tree panes with `max-h-[60vh]`, chapter hadith pane
    with `max-h-[80vh]`) create scroll-within-scroll on touch. Prefer full-page flow on mobile.
17. **Breadcrumb is hidden on phones** — inside a chapter the only context is the card header
    that scrolls away. A compact sticky context row (book › vol › chapter) under the TopBar
    would orient readers.
18. **Filters panel** works well, but the grading chips row wraps to 4+ lines on 390 px; a
    collapsible “Gradings” section (collapsed by default) would shorten the panel.

### Desktop-specific

19. **Search field width** caps at `max-w-md` while the breadcrumb area is mostly empty on
    wide screens; let it grow (`max-w-lg/xl`) on `lg+`.
20. **Keyboard shortcuts**: Ctrl+K and “/” focus search (good) — advertise them in the
    placeholder (“Search all books… (Ctrl K)”) and consider ↑/↓ to move through results.
21. **BookCard hover** is implemented with mouse-enter state + inline transforms; pure CSS
    `:hover` (group-hover) would be simpler and avoids re-renders.

### Feature ideas

22. **Narrators: transliteration search.** The rijāl dataset is Arabic-only and the UI only
    matches Arabic input (it tells you so after you type Latin text). Many users think in
    transliteration (“Zurara”, “ibn Abi Umayr”). A build-time transliteration index (even naive
    rule-based) would open this tool to non-Arabic-typers; meanwhile, state “Arabic input
    only” in the placeholder.
23. **Cross-referencing**: from a hadith, link the narrators in its sanad to the Narrators tool
    (name-match against the rijāl index) — the two halves of the app currently never touch.
24. **Export**: “copy as formatted citation” exists (nice); consider export of a chapter or
    search result set to Markdown/PDF for students.
25. **Daily/random hadith on the homepage** (there’s already `runtime/random.json`): a
    lightweight “Hadith of the day” card would make the home page a destination.

---

## 4. Code health (affects velocity more than users)

1. **Massive duplication in the browser components.** `AlKafiBookBrowser` vs
   `GenericBookBrowser` differ by ~90% shared code (729-line diff for ~480-line files);
   `AlKafiVolumeStructure` vs `VolumeStructure` likewise; and `VolumeStructure` contains the
   *same ~180-line chapter card JSX twice* (a `renderChapterCard` helper exists but the
   category-grid branch re-implements it inline). Every fix (e.g. the “1 hadiths” bug) must be
   made in 3–4 places. Consolidate on the generic components with a config for Al-Kāfi.
2. **Two styling systems.** Newer components use the token utilities (`text-foreground`,
   `bg-surface-1`); the browser/explorer components still use legacy aliases (`text-primary`,
   `bg-card`, `border-theme` — 120+ usages) plus hardcoded `zinc-800/700/600` colors. This is
   why some panels visibly differ in polish, and it blocks a light theme.
3. **Dead/legacy code**: `lib/api.ts` client-side `search*` functions (superseded by
   `/api/search`; the remaining caller is the risky bookmarks fallback, §1.12),
   `getTtlForUrl`’s old `/api/v2/` URL parsing in `hadith-cache.ts`, `measurePerformance`
   no-ops in `performance.ts`, and the unused `theme: 'light'` machinery.
4. **Silent catches** (“Error logging removed”) throughout the data-loading paths make field
   debugging hard — add `console.warn` with context at minimum.

---

## 5. Quick wins (small diffs, immediate user impact)

1. Add Kamāl al-Dīn to `lib/books.ts` + add the books/dataset coverage test (§1.1).
2. Real `englishName`s for single-volume books → fixes placeholder + Kamāl title (§1.2).
3. Add the two Ghayba books to `SINGLE_VOLUME_BOOKS` (§1.3).
4. `all` grading chip → `setSelectedGradings(['all'])` only (§1.4).
5. Quota check by `error.name` (§1.5).
6. Generic chapter “Back” → book page (§1.6); dedupe `category · chapter` (§1.7);
   singularize counts (§1.8).
7. `limit` + `Cache-Control` on `/api/search` (§2.1 items 1–2) — one route file.
8. `/api/random` for the Random tab (§2.2).
9. `aria-label`s on icon buttons (§3.12).
10. Save search history from the debounced search, not Enter (§1.11).

---

## 6. Implementation status (July 2026 follow-up)

Every finding above was either implemented on this branch or explicitly deferred
with the reason recorded here. Verification: `tsc --noEmit`, `eslint`, all 207
vitest tests, `test:data`, `next build`, plus a browser walkthrough (desktop
1440×900 and mobile 390×844) of every changed flow.

### Implemented

**Bugs** — all of §1: Kamāl al-Dīn on the homepage with a generated
matching-style cover (`/covers/39-round.jpeg`) plus a dataset↔homepage coverage
test; real `englishName`s for all single-volume books (placeholder/title fix),
shared with `SEARCHABLE_BOOKS` so they can't drift; both Ghayba books
registered; "All Gradings" now only resets gradings; quota detection via
`error.name` (shared `isQuotaExceededError`); generic chapter "Back" goes to
the book page with its name; `category · chapter` deduped everywhere (shared
`hadithLocationLabel`); counts pluralized (shared `pluralize`); Persian-yeh
gradings folded via `normalizeArabic` (badge, server filter, client filter —
plus Persian yeh/kaf added to `normalizeArabic` itself, which also improves
Arabic search); clipboard helper with fallback + accurate "Copy failed" flash
and unmount-safe timers; search history recorded from the live debounced
search (with on-focus refresh); bookmarks page: Refresh removed, removal no
longer re-fetches/flashes (per-key incremental fetch), whole-corpus legacy
fallback removed (previews render instead, mixed lists no longer hide them).

**Performance** — §2.1: `/api/search` capped (default 200, max 500) with
relevance ranking (phrase frequency + early-position bonus, occurrence cap so
mega-texts don't dominate, scored over a bounded window), `total`/`truncated`
metadata surfaced in the UI ("N found — showing the 200 best matches"),
`Cache-Control: s-maxage=86400`, an in-process response memo (repeat queries
~20 ms), parallel hit hydration, and a bounded volume LRU + resident shard
cache replacing the unbounded server cache. Measured: `q=god` 18.2 MB → 2.5 MB.
§2.2: `/api/random` (4 KB) now backs the Random explorers and a new homepage
"Random hadith" button, with client fallback. §2.3: the per-card DOM-clone
overflow probe and per-card resize listeners are gone (length-based rule,
matching English), and chapter pages render incrementally (40 at a time,
IntersectionObserver + "Show all"). §2.4: the 3.3 MB structure prefetch is
skipped on hadith deep links and Save-Data/2G connections. §2.5: pre-generated
160/360 w WebP cover thumbnails (`scripts/generate-cover-thumbs.mjs`, with a
test that they exist) served via `srcSet` + lazy loading. §2.6: bookmark
lookups via a memoized key Set. §2.8: search requests aborted via
`AbortController`; slug map hoisted; navigation-context no longer stores
result arrays (query only).

**UX** — §3.1: `?q=` synced to the URL (shareable searches; URL param wins on
load). §3.2: server-side relevance ranking + match-centered excerpts (the
collapsed card recenters its 750-char window on the first highlight). §3.4:
inline ✕ clear button in the search field. §3.5/3.20: "(Ctrl+K)" hint appended
on pointer devices. §3.6: floating scroll-to-top on chapter pages. §3.8:
"Hadith N of M in this chapter · #id in volume numbering" clarifier (computed
from the already-cached volume). §3.9: distinguishing subtitles on the two
Amālī entries. §3.10/14: side-by-side defaults off below `lg` for new
visitors (saved settings win). §3.11/15: the dead-tap window is gone — any
touch that neither long-pressed nor scrolled navigates. §3.12: aria-labels +
aria-pressed on all icon-only controls. §3.13: error banners unified on
`destructive` tokens. §3.16: nested pane scrolling (and sticky pane headers)
are lg-only; phones get full-page flow. §3.17: compact breadcrumb row under
the TopBar on phones for chapter/hadith pages. §3.18: grading chips collapse
behind a toggle on phones. §3.19: TopBar search grows to `lg:max-w-lg
xl:max-w-xl`. §3.21: BookCard hover is pure CSS (`group-hover`). §3.22
(partial): narrators placeholder states "(Arabic)". §3.23-adjacent quick wins:
§3.25 "Random hadith" homepage button and §U17 "Continue reading" strip
(localStorage, last 3 chapters). §U20: silent catches now `console.warn`.
§U23: Explore modes renamed to Chapters / Tree View / Random Hadith. Reduced
motion defaults from `prefers-reduced-motion`.

**Code health** — §4.1 (partial): the ~180-line duplicated chapter card inside
`VolumeStructure` now renders through `renderChapterCard`; all shared fixes
applied to every copy. §4.3/4.4: removed `searchAllBooks`/`searchAlKafi`/
`searchUyun`/`getRandomHadith`, the dead `/api/v2/` TTL parser, the
`measurePerformance` no-ops, and the now-unused `OptimizedImage`; hadith URL
builders extracted to `lib/hadith-urls.ts`.

### Deferred (with reasons)

- **Full Al-Kāfi ↔ generic component consolidation (§4.1)** — the two families
  use incompatible volume-value shapes (numeric vs volume-ID strings) shared
  through the PDF-selection state on the flagship page; merging them safely is
  its own PR with visual regression testing. All behavioral fixes were applied
  to both copies in the meantime.
- **Per-chapter data artifacts (§2.2) and a prebuilt search index (§2.1 item
  3)** — release-pipeline changes (scripts/data) that alter the dataset
  format; the cap/rank/cache work above removes the acute pain first.
- **Git LFS / moving the 975 MB of PDFs (§2.7)** — rewrites repository
  history; needs the owner's call and coordination with clones/CI.
- **Light theme (§3.9/15)** — tokens exist but shipping it is a product/design
  decision; the remaining `zinc-*` hardcodes (§4.2) should be migrated first.
- **PWA manifest + service worker (§3.10/U16)** — needs brand icon assets and
  a deliberate SW caching strategy; high-value follow-up.
- **Narrator transliteration search (§3.22) and sanad → narrator links
  (§3.23)** — require building a transliteration/name-matching index in the
  data pipeline.
- **Chapter list dropdown in the breadcrumb (§3.7), keyboard result navigation
  (§3.20), chapter export (§3.24)** — nice-to-haves left for a design pass.
