import { describe, expect, it, vi } from "vitest";
import { buildStarUri, countStars, fetchStarCounts } from "./fetchStars.ts";

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
