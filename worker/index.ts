import { fetchFeed } from "./lib/fetchHotEntries.ts";
import { fetchStarCounts } from "./lib/fetchStars.ts";
import { parseHotEntryRss } from "./lib/parseRdf.ts";
import type {
    BookmarkStarQuery,
    EntriesFile,
    Entry,
    FeedId,
    StarCountsResponse,
} from "./lib/types.ts";

export interface Env {
    ASSETS: Fetcher;
}

const FEED_URLS: Record<FeedId, string> = {
    all: "https://b.hatena.ne.jp/hotentry/all.rss",
    general: "https://b.hatena.ne.jp/hotentry/general.rss",
    it: "https://b.hatena.ne.jp/hotentry/it.rss",
};

const CACHE_TTL_SECONDS = 10 * 60;
const STAR_CACHE_TTL_SECONDS = 3 * 60;

/** Hatena entry ids are numeric, but anything URL-safe is accepted so a change
 *  in their format doesn't break the app — the point is to keep separators out
 *  of the cache key and the star permalink built from it. */
const EID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const USER_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
/** Hatena timestamps look like "2026/08/12 09:59"; only the date part is used. */
const TIMESTAMP_PATTERN = /^\d{4}\/\d{2}\/\d{2}/;
/** Far above a realistic request (500 bookmarks is roughly 20KB), so this only
 *  rejects obvious abuse before the body is parsed. */
const MAX_STAR_REQUEST_BYTES = 1024 * 1024;

/** Vite's dev server injects an inline React Refresh preamble, which a strict
 *  script-src blocks outright. The production build has no inline script, so
 *  only the dev policy is relaxed. */
const IS_DEV = (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;

const CSP_DIRECTIVES = [
    "default-src 'self'",
    // b.hatena.ne.jp is the JSONP endpoint the entry detail page loads as a
    // script; it can be dropped once that call goes through the worker.
    IS_DEV
        ? "script-src 'self' 'unsafe-inline' https://b.hatena.ne.jp"
        : "script-src 'self' https://b.hatena.ne.jp",
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

async function buildEntriesResponse(feed: FeedId): Promise<Response> {
    const xml = await fetchFeed(FEED_URLS[feed]);
    const rawItems = parseHotEntryRss(xml);
    const entries: Entry[] = rawItems.map((item, index) => ({
        ...item,
        rank: index + 1,
    }));
    const body: EntriesFile = {
        generatedAt: new Date().toISOString(),
        entries,
    };
    return new Response(JSON.stringify(body), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
        },
    });
}

function errorResponse(status: number, message: string): Response {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
    });
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
        USER_PATTERN.test(user) &&
        typeof timestamp === "string" &&
        TIMESTAMP_PATTERN.test(timestamp)
    );
}

/** Star counts are a non-essential enhancement, so a malformed bookmark drops
 *  just that bookmark; only a payload that isn't a bookmark list at all fails. */
function parseBookmarkStarQueries(payload: unknown): BookmarkStarQuery[] {
    if (
        typeof payload !== "object" ||
        payload === null ||
        !Array.isArray((payload as { bookmarks?: unknown }).bookmarks)
    ) {
        throw new Error("bookmarks must be an array");
    }
    return (payload as { bookmarks: unknown[] }).bookmarks.filter(
        isBookmarkStarQuery,
    );
}

async function handleEntries(
    request: Request,
    ctx: ExecutionContext,
    feed: string,
): Promise<Response> {
    if (request.method !== "GET") {
        return errorResponse(405, "method not allowed");
    }
    if (!isFeedId(feed)) {
        return errorResponse(404, `unknown feed: ${feed}`);
    }

    // Keyed on the feed alone, so an arbitrary query string cannot miss the
    // cache and turn every request into a fresh fetch against Hatena.
    const cacheKeyRequest = new Request(
        new URL(`/api/entries/${feed}`, request.url),
    );
    const cache = caches.default;
    const cached = await cache.match(cacheKeyRequest);
    if (cached) {
        return cached;
    }

    try {
        const response = await buildEntriesResponse(feed);
        ctx.waitUntil(cache.put(cacheKeyRequest, response.clone()));
        return response;
    } catch (err) {
        console.error("entries request failed", err);
        return errorResponse(502, "upstream request failed");
    }
}

async function handleStars(
    request: Request,
    ctx: ExecutionContext,
    eid: string,
): Promise<Response> {
    if (request.method !== "POST") {
        return errorResponse(405, "method not allowed");
    }
    if (!EID_PATTERN.test(eid)) {
        return errorResponse(400, "invalid entry id");
    }
    if (
        Number(request.headers.get("Content-Length")) > MAX_STAR_REQUEST_BYTES
    ) {
        return errorResponse(413, "request body too large");
    }

    let bookmarks: BookmarkStarQuery[];
    try {
        bookmarks = parseBookmarkStarQueries(await request.json());
    } catch (err) {
        return errorResponse(
            400,
            err instanceof Error ? err.message : String(err),
        );
    }

    // The real request is a POST, so a synthetic GET request keyed on the
    // entry id (not the requested bookmarks) is used as the Cache API key.
    // An entry's bookmark list grows continuously, so keying on its contents
    // would miss the cache for nearly every visitor; the trade-off is that the
    // short-lived cached counts reflect whichever bookmark set arrived first.
    const cacheKeyRequest = new Request(
        new URL(`/api/stars/${encodeURIComponent(eid)}`, request.url),
    );
    const cache = caches.default;
    const cached = await cache.match(cacheKeyRequest);
    if (cached) {
        return cached;
    }

    try {
        const stars = await fetchStarCounts(eid, bookmarks);
        const body: StarCountsResponse = { stars };
        const response = new Response(JSON.stringify(body), {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": `public, max-age=${STAR_CACHE_TTL_SECONDS}`,
            },
        });
        ctx.waitUntil(cache.put(cacheKeyRequest, response.clone()));
        return response;
    } catch (err) {
        console.error("star request failed", err);
        return errorResponse(502, "upstream request failed");
    }
}

async function route(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
): Promise<Response> {
    const url = new URL(request.url);

    const entriesMatch = url.pathname.match(/^\/api\/entries\/([^/]+)$/);
    if (entriesMatch) {
        return handleEntries(request, ctx, entriesMatch[1]);
    }

    const starsMatch = url.pathname.match(/^\/api\/stars\/([^/]+)$/);
    if (starsMatch) {
        return handleStars(request, ctx, starsMatch[1]);
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
