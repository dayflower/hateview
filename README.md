# hateview

A single-page web client for browsing Hatena Bookmark
("はてなブックマーク") hot entries.

## Features

- **On-demand data, no build/update job.** A Cloudflare Worker
  (`worker/index.ts`) fetches Hatena's RSS feeds per request and caches the
  response with the Workers Cache API, so freshness is bounded only by the
  cache TTL.
- **Per-entry bookmark comments and star counts**, proxied through the same
  worker.
- **Client-only state**, kept entirely in `localStorage` — read/unread
  tracking, hide rules, a read-later list, and removed entries. There is no
  user account or server-side persistence.

## Tech stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- A minimal hand-rolled hash router, no routing library
- [Bun](https://bun.sh/) locally, Cloudflare Workers (workerd) for the API in
  dev and production
- [Biome](https://biomejs.dev/) for formatting/linting
- [Vitest](https://vitest.dev/) for tests

See [AGENTS.md](AGENTS.md) for a detailed architecture overview.

## Getting started

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

## License

MIT — see [LICENSE](LICENSE).
