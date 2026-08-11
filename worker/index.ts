import { fetchFeed } from "./lib/fetchHotEntries.ts";
import { parseHotEntryRss } from "./lib/parseRdf.ts";
import type { EntriesFile, Entry, FeedId } from "./lib/types.ts";

export interface Env {
    ASSETS: Fetcher;
}

const FEED_URLS: Record<FeedId, string> = {
    all: "https://b.hatena.ne.jp/hotentry/all.rss",
    general: "https://b.hatena.ne.jp/hotentry/general.rss",
    it: "https://b.hatena.ne.jp/hotentry/it.rss",
};

const CACHE_TTL_SECONDS = 10 * 60;

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

export default {
    async fetch(request, env, ctx): Promise<Response> {
        const url = new URL(request.url);
        const match = url.pathname.match(/^\/api\/entries\/([^/]+)$/);

        if (!match) {
            return env.ASSETS.fetch(request);
        }
        if (request.method !== "GET") {
            return errorResponse(405, "method not allowed");
        }

        const feed = match[1];
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
    },
} satisfies ExportedHandler<Env>;
