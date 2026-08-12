import { describe, expect, it, vi } from "vitest";
import {
    buildStarUri,
    countStars,
    fetchStarCounts,
    MAX_STAR_TARGETS,
    STAR_CHUNK_SIZE,
    selectStarTargets,
} from "./fetchStars.ts";

describe("buildStarUri", () => {
    it("builds the bookmark permalink used as the star target uri", () => {
        expect(
            buildStarUri("4791455102846917954", "circma", "2026/08/12 09:59"),
        ).toBe(
            "https://b.hatena.ne.jp/circma/20260812#bookmark-4791455102846917954",
        );
    });

    it("encodes usernames", () => {
        expect(buildStarUri("1", "a b", "2026/01/02 00:00")).toBe(
            "https://b.hatena.ne.jp/a%20b/20260102#bookmark-1",
        );
    });
});

describe("countStars", () => {
    it("counts a plain list of stars", () => {
        expect(
            countStars([
                { name: "a", quote: "" },
                { name: "b", quote: "" },
            ]),
        ).toBe(2);
    });

    it("expands the compressed [first, count-2, last] form", () => {
        expect(
            countStars([
                { name: "a", quote: "" },
                856,
                { name: "b", quote: "" },
            ]),
        ).toBe(858);
    });

    it("does not treat a 3-item plain list as compressed", () => {
        expect(
            countStars([
                { name: "a", quote: "" },
                { name: "b", quote: "" },
                { name: "c", quote: "" },
            ]),
        ).toBe(3);
    });

    it("returns 0 for an empty list", () => {
        expect(countStars([])).toBe(0);
    });
});

describe("selectStarTargets", () => {
    it("orders bookmarks oldest first regardless of input order", () => {
        const selected = selectStarTargets([
            { user: "bob", timestamp: "2026/01/03 00:00" },
            { user: "alice", timestamp: "2026/01/01 00:00" },
            { user: "carol", timestamp: "2026/01/02 00:00" },
        ]);

        expect(selected.map((bookmark) => bookmark.user)).toEqual([
            "alice",
            "carol",
            "bob",
        ]);
    });

    it("keeps the oldest bookmark per user", () => {
        const selected = selectStarTargets([
            { user: "alice", timestamp: "2026/01/05 00:00" },
            { user: "alice", timestamp: "2026/01/01 00:00" },
        ]);

        expect(selected).toEqual([
            { user: "alice", timestamp: "2026/01/01 00:00" },
        ]);
    });

    it("caps the selection at MAX_STAR_TARGETS, dropping the newest", () => {
        const bookmarks = Array.from(
            { length: MAX_STAR_TARGETS + 10 },
            (_, index) => ({
                user: `user${index}`,
                timestamp: `2026/01/01 ${String(index).padStart(5, "0")}`,
            }),
        );

        const selected = selectStarTargets(bookmarks);

        expect(selected).toHaveLength(MAX_STAR_TARGETS);
        expect(selected[0].user).toBe("user0");
        expect(selected.at(-1)?.user).toBe(`user${MAX_STAR_TARGETS - 1}`);
    });
});

describe("fetchStarCounts", () => {
    it("returns an empty map without calling the API for no bookmarks", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        const result = await fetchStarCounts("1", []);

        expect(result).toEqual({});
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("maps star counts back to usernames by uri, defaulting missing entries", async () => {
        const uriA = "https://b.hatena.ne.jp/alice/20260101#bookmark-1";
        const uriB = "https://b.hatena.ne.jp/bob/20260102#bookmark-1";

        vi.stubGlobal(
            "fetch",
            vi.fn(
                async () =>
                    new Response(
                        JSON.stringify({
                            entries: [
                                {
                                    uri: uriA,
                                    stars: [
                                        { name: "x", quote: "" },
                                        { name: "y", quote: "" },
                                    ],
                                },
                            ],
                        }),
                        { status: 200 },
                    ),
            ),
        );

        const result = await fetchStarCounts("1", [
            { user: "alice", timestamp: "2026/01/01 00:00" },
            { user: "bob", timestamp: "2026/01/02 00:00" },
        ]);

        expect(result).toEqual({ alice: 2 });
        expect(result.bob).toBeUndefined();
        expect(uriB).toContain("bob");
    });

    it("splits large lookups into chunked upstream requests and merges them", async () => {
        const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
            const uris = new URLSearchParams(init.body as string).getAll("uri");
            return new Response(
                JSON.stringify({
                    entries: uris.map((uri) => ({
                        uri,
                        stars: [{ name: "x", quote: "" }],
                    })),
                }),
                { status: 200 },
            );
        });
        vi.stubGlobal("fetch", fetchMock);

        const count = STAR_CHUNK_SIZE * 2 + 5;
        const bookmarks = Array.from({ length: count }, (_, index) => ({
            user: `user${index}`,
            timestamp: `2026/01/01 ${String(index).padStart(5, "0")}`,
        }));

        const result = await fetchStarCounts("1", bookmarks);

        expect(fetchMock).toHaveBeenCalledTimes(3);
        const sentUriCounts = fetchMock.mock.calls.map(
            (call) =>
                new URLSearchParams(
                    (call[1] as RequestInit).body as string,
                ).getAll("uri").length,
        );
        expect(sentUriCounts).toEqual([STAR_CHUNK_SIZE, STAR_CHUNK_SIZE, 5]);
        expect(Object.keys(result)).toHaveLength(count);
        expect(result.user0).toBe(1);
    });

    it("never looks up more than MAX_STAR_TARGETS bookmarks", async () => {
        const fetchMock = vi.fn(
            async (_url: string, _init: RequestInit) =>
                new Response(JSON.stringify({ entries: [] })),
        );
        vi.stubGlobal("fetch", fetchMock);

        const bookmarks = Array.from(
            { length: MAX_STAR_TARGETS + STAR_CHUNK_SIZE },
            (_, index) => ({
                user: `user${index}`,
                timestamp: `2026/01/01 ${String(index).padStart(5, "0")}`,
            }),
        );

        await fetchStarCounts("1", bookmarks);

        const sentUris = fetchMock.mock.calls.flatMap((call) =>
            new URLSearchParams((call[1] as RequestInit).body as string).getAll(
                "uri",
            ),
        );
        expect(sentUris).toHaveLength(MAX_STAR_TARGETS);
    });

    it("fails the whole lookup when a single chunk fails", async () => {
        let calls = 0;
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                calls += 1;
                return calls === 1
                    ? new Response(JSON.stringify({ entries: [] }))
                    : new Response("", { status: 500 });
            }),
        );

        const bookmarks = Array.from(
            { length: STAR_CHUNK_SIZE + 1 },
            (_, index) => ({
                user: `user${index}`,
                timestamp: `2026/01/01 ${String(index).padStart(5, "0")}`,
            }),
        );

        await expect(fetchStarCounts("1", bookmarks)).rejects.toThrow();
    });

    it("throws when the upstream request fails", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => new Response("", { status: 500 })),
        );

        await expect(
            fetchStarCounts("1", [
                { user: "alice", timestamp: "2026/01/01 00:00" },
            ]),
        ).rejects.toThrow();
    });
});
