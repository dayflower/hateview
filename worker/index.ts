import type {
    HatenaBookmark,
    HatenaJsonliteResponse,
} from "../src/types/bookmark.ts";
import type { EntriesFile, Entry, FeedId } from "../src/types/entry.ts";
import type {
    BookmarkStarQuery,
    StarCountsResponse,
} from "../src/types/star.ts";
import { fetchBookmarkEntry } from "./lib/fetchBookmarkEntry.ts";
import { fetchFeed } from "./lib/fetchHotEntries.ts";
import { fetchStarCounts } from "./lib/fetchStars.ts";
import { parseHotEntryRss } from "./lib/parseRdf.ts";

export interface Env {
    ASSETS: Fetcher;
}

const FEED_URLS: Record<FeedId, string> = {
    all: "https://b.hatena.ne.jp/hotentry/all.rss",
    general: "https://b.hatena.ne.jp/hotentry/general.rss",
    social: "https://b.hatena.ne.jp/hotentry/social.rss",
    economics: "https://b.hatena.ne.jp/hotentry/economics.rss",
    life: "https://b.hatena.ne.jp/hotentry/life.rss",
    knowledge: "https://b.hatena.ne.jp/hotentry/knowledge.rss",
    it: "https://b.hatena.ne.jp/hotentry/it.rss",
    entertainment: "https://b.hatena.ne.jp/hotentry/entertainment.rss",
    game: "https://b.hatena.ne.jp/hotentry/game.rss",
    fun: "https://b.hatena.ne.jp/hotentry/fun.rss",
};

const CACHE_TTL_SECONDS = 10 * 60;
const STAR_CACHE_TTL_SECONDS = 3 * 60;
const BOOKMARKS_CACHE_TTL_SECONDS = 60;

/** Hatena entry ids and usernames are both plain URL-safe tokens, so the same
 *  pattern checks either — the point is to keep separators out of the star
 *  permalink built from them, not to validate their exact upstream format. */
const URL_SAFE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** Hatena timestamps look like "2026/08/12 09:59"; only the date part is used. */
const TIMESTAMP_PATTERN = /^\d{4}\/\d{2}\/\d{2}/;
const MAX_ENTRY_URL_LENGTH = 2048;

/** Vite's dev server injects an inline React Refresh preamble, which a strict
 *  script-src blocks outright. The production build has no inline script, so
 *  only the dev policy is relaxed. */
const IS_DEV = (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;

const CSP_DIRECTIVES = [
    "default-src 'self'",
    IS_DEV ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'",
    "connect-src 'self'",
    // Thumbnails, favicons and avatars are served from the bookmarked sites
    // themselves, so their hosts can't be enumerated up front.
    "img-src 'self' data: https:",
    // React writes inline style attributes for measured positions and sizes.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
];

const SECURITY_HEADERS: Record<string, string> = {
    "Content-Security-Policy": CSP_DIRECTIVES.join("; "),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
};

/** Responses from `fetch`/the Cache API have immutable headers, so the headers
 *  are applied to a copy on the way out. */
function withSecurityHeaders(response: Response): Response {
    const result = new Response(response.body, response);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        result.headers.set(name, value);
    }
    return result;
}

function isFeedId(value: string): value is FeedId {
    return value in FEED_URLS;
}

function errorResponse(status: number, message: string): Response {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

/** Rejects any request that isn't a GET before `handler` runs, so each API
 *  route doesn't have to repeat the same method check. */
function requireGet(
    request: Request,
    handler: () => Promise<Response>,
): Promise<Response> {
    return request.method === "GET"
        ? handler()
        : Promise.resolve(errorResponse(405, "method not allowed"));
}

/** Logs and converts any error `produce` throws into a 502, so callers don't
 *  leak upstream failure details to the client. */
async function withUpstreamErrorHandling(
    label: string,
    produce: () => Promise<Response>,
): Promise<Response> {
    try {
        return await produce();
    } catch (err) {
        console.error(`${label} request failed`, err);
        return errorResponse(502, "upstream request failed");
    }
}

/** Serves `cacheKey` from the Workers Cache API when present; otherwise calls
 *  `produce`, serializes its result as the JSON response body, and caches
 *  that response under `cacheKey` for `ttlSeconds` before returning it. */
async function cachedJson<T>(
    cacheKey: Request,
    ctx: ExecutionContext,
    ttlSeconds: number,
    produce: () => Promise<T>,
): Promise<Response> {
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
        return cached;
    }

    const body = await produce();
    const response = new Response(JSON.stringify(body), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${ttlSeconds}`,
        },
    });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
}

async function buildEntries(feed: FeedId): Promise<EntriesFile> {
    const xml = await fetchFeed(FEED_URLS[feed]);
    const entries: Entry[] = parseHotEntryRss(xml);
    return {
        generatedAt: new Date().toISOString(),
        entries,
    };
}

function isBookmarkStarQuery(value: unknown): value is BookmarkStarQuery {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const { user, timestamp } = value as {
        user?: unknown;
        timestamp?: unknown;
    };
    return (
        typeof user === "string" &&
        URL_SAFE_TOKEN_PATTERN.test(user) &&
        typeof timestamp === "string" &&
        TIMESTAMP_PATTERN.test(timestamp)
    );
}

/** Silent bookmarks almost never collect stars yet make up a large share of a
 *  hot entry's list, so they are left out of the lookup. A bookmark Hatena
 *  reports in an unexpected shape is skipped rather than failing the request,
 *  since star counts are a non-essential enhancement. */
function starQueriesFor(bookmarks: HatenaBookmark[]): BookmarkStarQuery[] {
    return bookmarks
        .filter((bookmark) => bookmark.comment.trim() !== "")
        .filter(isBookmarkStarQuery);
}

/** The entry url is the only client-supplied input to the bookmark and star
 *  endpoints; the upstream url is built from a fixed endpoint plus this value. */
function entryUrlParam(url: URL): string | null {
    const target = url.searchParams.get("url");
    if (!target || target.length > MAX_ENTRY_URL_LENGTH) {
        return null;
    }
    let parsed: URL;
    try {
        parsed = new URL(target);
    } catch {
        return null;
    }
    return parsed.protocol === "http:" || parsed.protocol === "https:"
        ? target
        : null;
}

/** Keyed on the entry url alone, so unrelated query parameters can neither
 *  bypass the cache nor create a separate entry for the same lookup. */
function apiCacheKey(request: Request, path: string, target: string): Request {
    const key = new URL(path, request.url);
    key.searchParams.set("url", target);
    return new Request(key);
}

async function handleEntries(
    request: Request,
    ctx: ExecutionContext,
    feed: string,
): Promise<Response> {
    if (!isFeedId(feed)) {
        return errorResponse(404, `unknown feed: ${feed}`);
    }

    // Keyed on the feed alone, so an arbitrary query string cannot miss the
    // cache and turn every request into a fresh fetch against Hatena.
    const cacheKeyRequest = new Request(
        new URL(`/api/entries/${feed}`, request.url),
    );
    return withUpstreamErrorHandling("entries", () =>
        cachedJson(cacheKeyRequest, ctx, CACHE_TTL_SECONDS, () =>
            buildEntries(feed),
        ),
    );
}

/** Returns the cached-or-freshly-fetched bookmark listing for an entry. Both
 *  the bookmark and the star endpoint go through here, so a page view costs at
 *  most one upstream call for the listing. */
function loadBookmarkEntry(
    request: Request,
    ctx: ExecutionContext,
    target: string,
): Promise<Response> {
    const cacheKeyRequest = apiCacheKey(request, "/api/bookmarks", target);
    return cachedJson(cacheKeyRequest, ctx, BOOKMARKS_CACHE_TTL_SECONDS, () =>
        fetchBookmarkEntry(target),
    );
}

async function handleBookmarks(
    request: Request,
    ctx: ExecutionContext,
    url: URL,
): Promise<Response> {
    const target = entryUrlParam(url);
    if (!target) {
        return errorResponse(400, "invalid url");
    }

    return withUpstreamErrorHandling("bookmarks", () =>
        loadBookmarkEntry(request, ctx, target),
    );
}

async function countStarsFor(
    request: Request,
    ctx: ExecutionContext,
    target: string,
): Promise<StarCountsResponse> {
    const entryResponse = await loadBookmarkEntry(request, ctx, target);
    const entry = (await entryResponse.json()) as HatenaJsonliteResponse | null;
    const stars =
        entry && URL_SAFE_TOKEN_PATTERN.test(entry.eid)
            ? await fetchStarCounts(entry.eid, starQueriesFor(entry.bookmarks))
            : {};
    return { stars };
}

async function handleStars(
    request: Request,
    ctx: ExecutionContext,
    url: URL,
): Promise<Response> {
    const target = entryUrlParam(url);
    if (!target) {
        return errorResponse(400, "invalid url");
    }

    // The response is now a function of the entry url alone — the bookmarks to
    // look up are derived here rather than supplied by the caller — so the
    // cache key describes the response exactly.
    const cacheKeyRequest = apiCacheKey(request, "/api/stars", target);
    return withUpstreamErrorHandling("star", () =>
        cachedJson(cacheKeyRequest, ctx, STAR_CACHE_TTL_SECONDS, () =>
            countStarsFor(request, ctx, target),
        ),
    );
}

async function route(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
): Promise<Response> {
    const url = new URL(request.url);

    const entriesMatch = url.pathname.match(/^\/api\/entries\/([^/]+)$/);
    if (entriesMatch) {
        return requireGet(request, () =>
            handleEntries(request, ctx, entriesMatch[1]),
        );
    }

    if (url.pathname === "/api/bookmarks") {
        return requireGet(request, () => handleBookmarks(request, ctx, url));
    }

    if (url.pathname === "/api/stars") {
        return requireGet(request, () => handleStars(request, ctx, url));
    }

    return env.ASSETS.fetch(request);
}

export default {
    async fetch(request, env, ctx): Promise<Response> {
        const response = await route(request, env, ctx);
        // A websocket upgrade carries no body to copy, so it is passed through
        // untouched; nothing else this worker serves needs that exemption.
        return response.status === 101
            ? response
            : withSecurityHeaders(response);
    },
} satisfies ExportedHandler<Env>;
