import { beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "./index.ts";

const workerFetch = worker.fetch;
if (!workerFetch) {
    throw new Error("worker.fetch is not defined");
}

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
 xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
 xmlns="http://purl.org/rss/1.0/"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:hatena="http://www.hatena.ne.jp/info/xmlns#"
>
<channel rdf:about="https://b.hatena.ne.jp/hotentry/it">
<items>
 <rdf:Seq>
  <rdf:li rdf:resource="https://example.com/1" />
  <rdf:li rdf:resource="https://example.com/2" />
 </rdf:Seq>
</items>
</channel>
<item rdf:about="https://example.com/1">
<title>Item One</title>
<description>Desc one</description>
<dc:date>2026-08-01T00:00:00Z</dc:date>
<dc:subject>テクノロジー</dc:subject>
<dc:subject>tag1</dc:subject>
<hatena:imageurl>https://example.com/1.png</hatena:imageurl>
<hatena:bookmarkcount>5</hatena:bookmarkcount>
<hatena:bookmarkCommentListPageUrl>https://b.hatena.ne.jp/entry/1</hatena:bookmarkCommentListPageUrl>
</item>
<item rdf:about="https://example.com/2">
<title>Item Two</title>
<description>Desc two</description>
<dc:date>2026-08-02T00:00:00Z</dc:date>
<dc:subject>テクノロジー</dc:subject>
<hatena:imageurl>https://example.com/2.png</hatena:imageurl>
<hatena:bookmarkcount>3</hatena:bookmarkcount>
<hatena:bookmarkCommentListPageUrl>https://b.hatena.ne.jp/entry/2</hatena:bookmarkCommentListPageUrl>
</item>
</rdf:RDF>`;

const ENTRY_URL = "https://example.com/1";

const SAMPLE_JSONLITE = {
    title: "Item One",
    count: 4,
    url: ENTRY_URL,
    entry_url: "https://b.hatena.ne.jp/entry/1",
    eid: "4791455102846917954",
    bookmarks: [
        {
            user: "alice",
            timestamp: "2026/01/01 00:00",
            comment: "hi",
            tags: [],
        },
        { user: "bob", timestamp: "2026/01/02 00:00", comment: "yo", tags: [] },
        // Silent: skipped, so no star lookup is made for it.
        {
            user: "carol",
            timestamp: "2026/01/03 00:00",
            comment: "  ",
            tags: [],
        },
        // Malformed: dropped rather than failing the request.
        {
            user: "d a v e",
            timestamp: "2026/01/04 00:00",
            comment: "x",
            tags: [],
        },
    ],
};

/** Routes each upstream host to its own canned response, so a test can assert
 *  which of Hatena's endpoints were actually called. */
function createFakeUpstream() {
    return vi.fn(async (input: string | Request) => {
        const url = typeof input === "string" ? input : input.url;
        if (url.includes("/hotentry/")) {
            return new Response(SAMPLE_RSS, { status: 200 });
        }
        if (url.includes("/entry/jsonlite/")) {
            return new Response(JSON.stringify(SAMPLE_JSONLITE), {
                status: 200,
            });
        }
        if (url.includes("/entry/json/")) {
            return new Response(JSON.stringify(SAMPLE_JSONLITE), {
                status: 200,
            });
        }
        if (url.includes("s.hatena.ne.jp")) {
            return new Response(
                JSON.stringify({
                    entries: [
                        {
                            uri: "https://b.hatena.ne.jp/alice/20260101#bookmark-4791455102846917954",
                            stars: [
                                { name: "x", quote: "" },
                                { name: "y", quote: "" },
                            ],
                        },
                    ],
                }),
                { status: 200 },
            );
        }
        throw new Error(`unexpected upstream request: ${url}`);
    });
}

function upstreamCalls(pattern: string): string[] {
    return vi
        .mocked(fetch)
        .mock.calls.map((call) =>
            typeof call[0] === "string" ? call[0] : (call[0] as Request).url,
        )
        .filter((url) => url.includes(pattern));
}

function createFakeCache() {
    const store = new Map<string, Response>();
    return {
        async match(request: Request) {
            const cached = store.get(request.url);
            return cached ? cached.clone() : undefined;
        },
        async put(request: Request, response: Response) {
            store.set(request.url, response);
        },
    };
}

describe("worker fetch handler", () => {
    let assetsFetch: ReturnType<typeof vi.fn>;
    let env: Env;
    let pending: Promise<unknown>[];
    let ctx: ExecutionContext;

    beforeEach(() => {
        vi.stubGlobal("caches", { default: createFakeCache() });
        vi.stubGlobal("fetch", createFakeUpstream());
        assetsFetch = vi.fn(async () => new Response("asset"));
        env = { ASSETS: { fetch: assetsFetch } } as unknown as Env;
        pending = [];
        ctx = {
            waitUntil: (promise: Promise<unknown>) => {
                pending.push(promise);
            },
        } as unknown as ExecutionContext;
    });

    // `new Request(url)` types as the general CfProperties shape, but the handler
    // expects the incoming-request shape the runtime actually provides at request time.
    const call = (request: Request) =>
        workerFetch(
            request as unknown as Parameters<typeof workerFetch>[0],
            env,
            ctx,
        );

    it("returns parsed entries for a known feed", async () => {
        const response = await call(
            new Request("https://hateview.example/api/entries/it"),
        );

        expect(response.status).toBe(200);
        const body = (await response.json()) as {
            entries: Array<Record<string, unknown>>;
        };
        expect(body.entries).toHaveLength(2);
        expect(body.entries[0]).toMatchObject({
            url: "https://example.com/1",
            category: "テクノロジー",
            tags: ["tag1"],
        });
        // Entry order (not a rank field) is how rdf:Seq's rank is expressed.
        expect(body.entries.map((entry) => entry.url)).toEqual([
            "https://example.com/1",
            "https://example.com/2",
        ]);
    });

    it("returns 404 for an unknown feed", async () => {
        const response = await call(
            new Request("https://hateview.example/api/entries/bogus"),
        );

        expect(response.status).toBe(404);
    });

    it("returns parsed entries for each newly supported category feed", async () => {
        const newFeeds = [
            "social",
            "economics",
            "life",
            "knowledge",
            "entertainment",
            "game",
            "fun",
        ];
        for (const feed of newFeeds) {
            const response = await call(
                new Request(`https://hateview.example/api/entries/${feed}`),
            );
            expect(response.status).toBe(200);
        }
    });

    it("falls back to static assets for non-api paths", async () => {
        const request = new Request("https://hateview.example/");
        await call(request);

        expect(assetsFetch).toHaveBeenCalledWith(request);
    });

    it("adds security headers to static asset responses", async () => {
        const response = await call(new Request("https://hateview.example/"));

        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(response.headers.get("Referrer-Policy")).toBe(
            "strict-origin-when-cross-origin",
        );
        const csp = response.headers.get("Content-Security-Policy") ?? "";
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).toContain("object-src 'none'");
        expect(await response.text()).toBe("asset");
    });

    it("adds security headers to api responses too", async () => {
        const response = await call(
            new Request("https://hateview.example/api/entries/it"),
        );

        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("serves the second request from cache without re-fetching Hatena", async () => {
        await call(new Request("https://hateview.example/api/entries/it"));
        await Promise.all(pending);

        const response = await call(
            new Request("https://hateview.example/api/entries/it"),
        );

        expect(response.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("ignores the query string when caching entries", async () => {
        await call(new Request("https://hateview.example/api/entries/it?a=1"));
        await Promise.all(pending);

        const response = await call(
            new Request("https://hateview.example/api/entries/it?a=2"),
        );

        expect(response.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("does not leak upstream failure details", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response("", { status: 503 })),
        );

        const response = await call(
            new Request("https://hateview.example/api/entries/it"),
        );

        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({
            error: "upstream request failed",
        });
    });

    const bookmarksUrl = (params: string) =>
        `https://hateview.example/api/bookmarks?${params}`;
    const starsUrl = (params: string) =>
        `https://hateview.example/api/stars?${params}`;
    const urlParam = `url=${encodeURIComponent(ENTRY_URL)}`;

    it("returns the bookmark listing for an entry url, defaulting to the json source", async () => {
        const response = await call(new Request(bookmarksUrl(urlParam)));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(SAMPLE_JSONLITE);
        expect(upstreamCalls("/entry/json/")).toHaveLength(1);
        expect(upstreamCalls("/entry/jsonlite/")).toHaveLength(0);
    });

    it("fetches the jsonlite source when explicitly requested", async () => {
        const response = await call(
            new Request(bookmarksUrl(`${urlParam}&source=jsonlite`)),
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(SAMPLE_JSONLITE);
        expect(upstreamCalls("/entry/jsonlite/")).toHaveLength(1);
        expect(upstreamCalls("/entry/json/")).toHaveLength(0);
    });

    it("serves a repeated bookmark listing from cache", async () => {
        await call(new Request(bookmarksUrl(urlParam)));
        await Promise.all(pending);
        await call(new Request(bookmarksUrl(`${urlParam}&extra=1`)));

        expect(upstreamCalls("/entry/json/")).toHaveLength(1);
    });

    it("caches the json and jsonlite sources separately", async () => {
        await call(new Request(bookmarksUrl(urlParam)));
        await Promise.all(pending);
        await call(new Request(bookmarksUrl(`${urlParam}&source=jsonlite`)));

        expect(upstreamCalls("/entry/json/")).toHaveLength(1);
        expect(upstreamCalls("/entry/jsonlite/")).toHaveLength(1);
    });

    it.each([
        ["missing", ""],
        ["javascript", `url=${encodeURIComponent("javascript:alert(1)")}`],
        ["data", `url=${encodeURIComponent("data:text/html,x")}`],
        ["relative", "url=%2Fnot-absolute"],
        ["over-long", `url=https%3A%2F%2Fexample.com%2F${"a".repeat(2100)}`],
    ])("rejects a %s url on both endpoints", async (_label, params) => {
        for (const target of [bookmarksUrl(params), starsUrl(params)]) {
            const response = await call(new Request(target));
            expect(response.status).toBe(400);
        }
        expect(fetch).not.toHaveBeenCalled();
    });

    it("derives star lookups from the entry's own bookmarks", async () => {
        const response = await call(new Request(starsUrl(urlParam)));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ stars: { alice: 2 } });

        const body = vi
            .mocked(fetch)
            .mock.calls.map((c) => c[1] as RequestInit)
            .find((init) => typeof init?.body === "string")?.body as string;
        const uris = new URLSearchParams(body).getAll("uri");
        // carol is silent and "d a v e" is malformed, so neither is looked up.
        expect(uris).toEqual([
            "https://b.hatena.ne.jp/alice/20260101#bookmark-4791455102846917954",
            "https://b.hatena.ne.jp/bob/20260102#bookmark-4791455102846917954",
        ]);
    });

    it("reuses the cached bookmark listing when counting stars", async () => {
        await call(new Request(bookmarksUrl(urlParam)));
        await Promise.all(pending);

        await call(new Request(starsUrl(urlParam)));

        expect(upstreamCalls("/entry/json/")).toHaveLength(1);
    });

    it("returns no stars for a url nobody has bookmarked", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response("null", { status: 200 })),
        );

        const response = await call(new Request(starsUrl(urlParam)));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ stars: {} });
    });

    it("rejects a non-GET request to the api endpoints", async () => {
        for (const target of [bookmarksUrl(urlParam), starsUrl(urlParam)]) {
            const response = await call(
                new Request(target, { method: "POST" }),
            );
            expect(response.status).toBe(405);
        }
    });
});
