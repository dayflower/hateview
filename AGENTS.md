# AGENTS.md

## Project overview

hateview is a single-page web client for browsing Hatena Bookmark
("はてなブックマーク") hot entries. There is no periodic build/update job: a
Cloudflare Worker (`worker/index.ts`) fetches Hatena's RSS feeds on demand,
per request, and caches the response with the Workers Cache API. The React
app fetches this on-demand API at runtime. Per-entry bookmark comments are
fetched live from Hatena's JSONP API directly from the browser. The app is
deployed to Cloudflare Workers (with Static Assets serving the SPA build).

Client-only state (read/unread tracking, hide rules, read-later list, removed
entries) is kept entirely in `localStorage` — there is no user account or
server-side persistence.

## Tech stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Routing: a minimal hand-rolled hash router (`src/router/`), no library
- Package manager / worker runtime: **Bun** locally, **Cloudflare Workers**
  (workerd) in dev and production via `@cloudflare/vite-plugin`
- Formatting/linting: **Biome** (4-space indent, double quotes, import
  organization on save/check — not Prettier/ESLint)
- Tests: **Vitest** with `jsdom` environment

## Commands

```bash
bun install          # install dependencies
bun run dev           # start Vite dev server (port 5173); runs worker/index.ts on workerd too
bun run build          # type-check (tsc -b) then production build (client + worker)
bun run preview          # preview the production build
bun run test          # run vitest once
bun run lint          # biome check (no writes)
bun run check          # biome check --write (format + lint + fix)
bun run deploy         # build then `wrangler deploy` to Cloudflare
```

Always run `bun run check` (or at least `bun run lint`) and `bun run test`
before considering frontend/worker changes done. Run `bun run build` when
changes might affect type-correctness, since `tsc -b` is stricter than the
editor may show.

## Architecture

### Two separate TypeScript worlds

- `src/` — the React app (browser), configured by `tsconfig.app.json`.
- `worker/` — the Cloudflare Worker that serves the on-demand RSS API and
  falls back to static assets for everything else, configured by
  `tsconfig.worker.json` (`@cloudflare/workers-types`). `worker/lib/` holds
  the fetch/parse logic shared by nothing else (it has no Node/Bun-only
  dependencies, only `fetch`, so it runs as-is under workerd).

They do not share a tsconfig; keep browser-only APIs out of `worker/` and
Node/Bun-only APIs out of `src/` or `worker/`.

### Data flow

1. On each request to `/api/entries/:feed` (`feed` is `all`/`general`/`it`),
   `worker/index.ts` checks the Workers Cache API first. On a miss, it fetches
   the corresponding `https://b.hatena.ne.jp/hotentry/*.rss` feed, parses it
   (`worker/lib/parseRdf.ts`), and caches the JSON response for a few minutes
   before returning it. There is no periodic job — freshness is bounded only
   by the cache TTL. The three feeds are fetched and cached independently;
   there is no cross-feed merging.
2. Each RSS item's category badge comes directly from that item's own first
   `dc:subject` value (e.g. テクノロジー, 暮らし, 学び) — this is unrelated to
   which of the three feeds (`all`/`general`/`it`) it was fetched from.
3. The app fetches `/api/entries/:feed` per selected tab via `useEntries`
   (`src/lib/hooks/useEntries.ts`), which also marks/diffs "new" entries
   against `localStorage` (`src/lib/storage/seenEntries.ts`). Switching tabs
   fetches a different feed; each feed's result is cached client-side for the
   session.
4. Per-entry bookmark comments are fetched on demand from Hatena's JSONP
   endpoint (`src/lib/jsonp/hatenaBookmarkApi.ts` + `src/lib/jsonp/jsonp.ts`)
   directly from the browser — there is no proxy.

### Routing

`src/router/routes.tsx` defines a small closed `Route` union (`list`,
`entry`, `later`, `settings`) matched against a `useHashPath()` string
(`src/router/useHashRoute.ts`, hash-based, no external router library).
`App.tsx` reads the route and switches which page component to render, and
redirects to `/` when the hash doesn't match anything.

### Client-side state (all localStorage-backed)

Each concern lives in its own hook/provider pair under
`src/lib/hooks/` + `src/lib/storage/`, wired up as nested Context providers
in `src/main.tsx`:

- `useHideRules` / `storage/hideRules.ts` — domain + title-glob rules for
  hiding entries
- `useReadLater` / `storage/readLater.ts` — saved-for-later list
- `useReadTracking` / `storage/readTracking.ts` — read/unread state
- `useRemovedEntries` / `storage/removedEntries.ts` — manually dismissed rows
- `storage/seenEntries.ts` — tracks which entry URLs have already been seen,
  to compute the "new" badge

`storage/localStorageJson.ts` provides the shared read/write-JSON-safely
helpers; storage modules generally have a colocated `*.test.ts`.

### Components

- `src/components/entry-list/` — hot-entry list page pieces (row, category
  filter bar)
- `src/components/entry-detail/` — per-entry bookmark comment list
- `src/components/common/` — shared building blocks (badges, avatars,
  thumbnails, the hide-rule modal, icon buttons)
- `src/components/layout/` — `Header`

## Conventions

- Biome owns formatting: 4-space indent, double-quoted strings, organized
  imports. Don't hand-format against these rules — run `bun run check`.
- Path-relative imports (`../../types/entry`), no path aliases configured.
- Prefer the existing Provider+hook pattern for new client-only state rather
  than introducing a new state management approach.
- Tests are colocated as `*.test.ts` next to the module they cover (see
  `src/lib/storage/*.test.ts`, `worker/index.test.ts`), using
  `describe`/`it`/`expect` from vitest.
- The app is served from `/` in production (see `742c5c0`); don't reintroduce
  a `/hateview/` base path.
