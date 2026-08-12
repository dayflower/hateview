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

function parseBookmarkStarQueries(payload: unknown): BookmarkStarQuery[] {
    if (
        typeof payload !== "object" ||
        payload === null ||
        !Array.isArray((payload as { bookmarks?: unknown }).bookmarks)
    ) {
        throw new Error("bookmarks must be an array");
    }
    return (payload as { bookmarks: unknown[] }).bookmarks.map((entry) => {
        if (
            typeof entry !== "object" ||
            entry === null ||
            typeof (entry as { user?: unknown }).user !== "string" ||
            typeof (entry as { timestamp?: unknown }).timestamp !== "string"
        ) {
            throw new Error("invalid bookmark entry");
        }
        return entry as BookmarkStarQuery;
    });
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

    const cache = caches.default;
    const cached = await cache.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await buildEntriesResponse(feed);
        ctx.waitUntil(cache.put(request, response.clone()));
        return response;
    } catch (err) {
        return errorResponse(
            502,
            err instanceof Error ? err.message : String(err),
        );
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
        return errorResponse(
            502,
            err instanceof Error ? err.message : String(err),
        );
    }
}

export default {
    async fetch(request, env, ctx): Promise<Response> {
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
    },
} satisfies ExportedHandler<Env>;
