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

    it("serves the second request from cache without re-fetching Hatena", async () => {
        await call(new Request("https://hateview.example/api/entries/it"));
        await Promise.all(pending);

        const response = await call(
            new Request("https://hateview.example/api/entries/it"),
        );

        expect(response.status).toBe(200);
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});
