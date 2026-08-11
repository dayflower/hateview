import { beforeEach, describe, expect, it, vi } from "vitest";
import { isMarked, list, remove, toggle } from "./readLater";

beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
});

describe("toggle", () => {
    it("adds a full snapshot on the first call and reports marked", () => {
        const marked = toggle({
            url: "https://example.com/a",
            title: "A",
            description: "desc",
            imageUrl: "https://example.com/a.png",
            bookmarkCount: 10,
            category: "テクノロジー",
            tags: ["tag"],
        });

        expect(marked).toBe(true);
        expect(isMarked("https://example.com/a")).toBe(true);
        const [entry] = list();
        expect(entry).toMatchObject({
            url: "https://example.com/a",
            title: "A",
            description: "desc",
            imageUrl: "https://example.com/a.png",
            bookmarkCount: 10,
            category: "テクノロジー",
            tags: ["tag"],
        });
        expect(typeof entry.markedAt).toBe("string");
    });

    it("removes the entry on the second call", () => {
        toggle({ url: "https://example.com/a", title: "A" });
        const marked = toggle({ url: "https://example.com/a", title: "A" });

        expect(marked).toBe(false);
        expect(isMarked("https://example.com/a")).toBe(false);
        expect(list()).toHaveLength(0);
    });
});

describe("remove", () => {
    it("deletes the entry by url", () => {
        toggle({ url: "https://example.com/a", title: "A" });
        toggle({ url: "https://example.com/b", title: "B" });

        remove("https://example.com/a");

        expect(isMarked("https://example.com/a")).toBe(false);
        expect(isMarked("https://example.com/b")).toBe(true);
    });
});

describe("list", () => {
    it("sorts entries by markedAt descending (most recently marked first)", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        toggle({ url: "https://example.com/old", title: "Old" });

        vi.setSystemTime(new Date("2026-01-02T00:00:00.000Z"));
        toggle({ url: "https://example.com/new", title: "New" });

        expect(list().map((entry) => entry.url)).toEqual([
            "https://example.com/new",
            "https://example.com/old",
        ]);
    });
});
