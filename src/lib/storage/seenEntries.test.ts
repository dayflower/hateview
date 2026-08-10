import { beforeEach, describe, expect, it, vi } from "vitest";
import { markFetchAndGetNewUrls, pruneOldSeenRecords } from "./seenEntries";

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
});

describe("markFetchAndGetNewUrls", () => {
    it("reports every url as new on the first-ever call", () => {
        const newUrls = markFetchAndGetNewUrls([
            "https://example.com/a",
            "https://example.com/b",
        ]);
        expect(newUrls).toEqual(
            new Set(["https://example.com/a", "https://example.com/b"]),
        );
    });

    it("reports no urls as new on a repeat call with the same urls", () => {
        markFetchAndGetNewUrls([
            "https://example.com/a",
            "https://example.com/b",
        ]);
        const newUrls = markFetchAndGetNewUrls([
            "https://example.com/a",
            "https://example.com/b",
        ]);
        expect(newUrls.size).toBe(0);
    });

    it("reports only urls not seen in a previous call", () => {
        markFetchAndGetNewUrls(["https://example.com/a"]);
        const newUrls = markFetchAndGetNewUrls([
            "https://example.com/a",
            "https://example.com/b",
        ]);
        expect(newUrls).toEqual(new Set(["https://example.com/b"]));
    });

    it("no longer reports a url as new on the call after it first appeared", () => {
        markFetchAndGetNewUrls(["https://example.com/a"]);
        markFetchAndGetNewUrls([
            "https://example.com/a",
            "https://example.com/b",
        ]);
        const newUrls = markFetchAndGetNewUrls([
            "https://example.com/a",
            "https://example.com/b",
        ]);
        expect(newUrls.size).toBe(0);
    });
});

describe("pruneOldSeenRecords", () => {
    it("forgets a url older than maxAgeMs, treating it as new again if it reappears", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        markFetchAndGetNewUrls(["https://example.com/a"]);

        vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
        pruneOldSeenRecords(30 * DAY_MS);

        const newUrls = markFetchAndGetNewUrls(["https://example.com/a"]);
        expect(newUrls).toEqual(new Set(["https://example.com/a"]));
    });

    it("keeps urls younger than maxAgeMs", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        markFetchAndGetNewUrls(["https://example.com/a"]);

        vi.setSystemTime(new Date("2026-01-10T00:00:00.000Z"));
        pruneOldSeenRecords(30 * DAY_MS);

        const newUrls = markFetchAndGetNewUrls(["https://example.com/a"]);
        expect(newUrls.size).toBe(0);
    });
});
