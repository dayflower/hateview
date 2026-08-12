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
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response(SAMPLE_RSS, { status: 200 })),
        );
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
            rank: 1,
        });
    });

    it("returns 404 for an unknown feed", async () => {
        const response = await call(
            new Request("https://hateview.example/api/entries/game"),
        );

        expect(response.status).toBe(404);
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

    const starsRequest = (
        eid: string,
        bookmarks: unknown[],
        headers?: HeadersInit,
    ) =>
        new Request(`https://hateview.example/api/stars/${eid}`, {
            method: "POST",
            headers,
            body: JSON.stringify({ bookmarks }),
        });

    // A literal "/" is already excluded by the route pattern, but a
    // percent-encoded one survives URL normalization and reaches the handler.
    it("rejects a malformed entry id", async () => {
        const response = await call(
            starsRequest("%2F..%2Fevil", [
                { user: "alice", timestamp: "2026/01/01 00:00" },
            ]),
        );

        expect(response.status).toBe(400);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("rejects an oversized star request before parsing it", async () => {
        const response = await call(
            starsRequest("1", [], {
                "Content-Length": String(2 * 1024 * 1024),
            }),
        );

        expect(response.status).toBe(413);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("rejects a payload that is not a bookmark list", async () => {
        const response = await call(
            new Request("https://hateview.example/api/stars/1", {
                method: "POST",
                body: JSON.stringify({ bookmarks: "nope" }),
            }),
        );

        expect(response.status).toBe(400);
    });

    it("drops malformed bookmarks instead of failing the request", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(
                async () =>
                    new Response(
                        JSON.stringify({
                            entries: [
                                {
                                    uri: "https://b.hatena.ne.jp/alice/20260101#bookmark-1",
                                    stars: [{ name: "x", quote: "" }],
                                },
                            ],
                        }),
                    ),
            ),
        );

        const response = await call(
            starsRequest("1", [
                { user: "alice", timestamp: "2026/01/01 00:00" },
                { user: "b o b", timestamp: "2026/01/01 00:00" },
                { user: "carol", timestamp: "not a timestamp" },
                { user: "dave" },
                null,
            ]),
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ stars: { alice: 1 } });

        const body = (vi.mocked(fetch).mock.calls[0][1] as RequestInit)
            .body as string;
        expect(new URLSearchParams(body).getAll("uri")).toEqual([
            "https://b.hatena.ne.jp/alice/20260101#bookmark-1",
        ]);
    });
});
