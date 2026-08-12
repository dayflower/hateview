import { beforeEach, describe, expect, it, vi } from "vitest";
import { getNewUrls, markUrlSeen, pruneOldSeenRecords } from "./seenEntries";

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
});

describe("getNewUrls", () => {
    it("reports every url as new on the first-ever call", () => {
        const newUrls = getNewUrls([
            "https://example.com/a",
            "https://example.com/b",
        ]);
        expect(newUrls).toEqual(
            new Set(["https://example.com/a", "https://example.com/b"]),
        );
    });

    it("keeps reporting a url as new across repeat calls when it's never marked seen", () => {
        getNewUrls(["https://example.com/a", "https://example.com/b"]);
        const newUrls = getNewUrls([
            "https://example.com/a",
            "https://example.com/b",
        ]);
        expect(newUrls).toEqual(
            new Set(["https://example.com/a", "https://example.com/b"]),
        );
    });

    it("excludes urls that have been marked seen", () => {
        markUrlSeen("https://example.com/a");
        const newUrls = getNewUrls([
            "https://example.com/a",
            "https://example.com/b",
        ]);
        expect(newUrls).toEqual(new Set(["https://example.com/b"]));
    });
});

describe("markUrlSeen", () => {
    it("no longer reports a url as new once marked seen", () => {
        markUrlSeen("https://example.com/a");
        const newUrls = getNewUrls([
            "https://example.com/a",
            "https://example.com/b",
        ]);
        expect(newUrls).toEqual(new Set(["https://example.com/b"]));
    });

    it("is idempotent for a url that's already marked seen", () => {
        markUrlSeen("https://example.com/a");
        markUrlSeen("https://example.com/a");
        const newUrls = getNewUrls(["https://example.com/a"]);
        expect(newUrls.size).toBe(0);
    });
});

describe("pruneOldSeenRecords", () => {
    it("forgets a url older than maxAgeMs, treating it as new again if it reappears", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        markUrlSeen("https://example.com/a");

        vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
        pruneOldSeenRecords(30 * DAY_MS);

        const newUrls = getNewUrls(["https://example.com/a"]);
        expect(newUrls).toEqual(new Set(["https://example.com/a"]));
    });

    it("keeps urls younger than maxAgeMs", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        markUrlSeen("https://example.com/a");

        vi.setSystemTime(new Date("2026-01-10T00:00:00.000Z"));
        pruneOldSeenRecords(30 * DAY_MS);

        const newUrls = getNewUrls(["https://example.com/a"]);
        expect(newUrls.size).toBe(0);
    });
});
