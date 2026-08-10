import { beforeEach, describe, expect, it, vi } from "vitest";
import { isRead, markRead, pruneOldReadRecords } from "./readTracking";

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
});

describe("markRead / isRead", () => {
    it("marks a url as read", () => {
        expect(isRead("https://example.com/a")).toBe(false);
        markRead("https://example.com/a");
        expect(isRead("https://example.com/a")).toBe(true);
    });

    it("is idempotent: the first-seen timestamp is not reset by later calls", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        markRead("https://example.com/a");

        vi.setSystemTime(new Date("2026-01-20T00:00:00.000Z"));
        markRead("https://example.com/a");

        // 31 days after the *first* mark, the record should be pruned as expired
        // (i.e. the second markRead call did not push the clock forward).
        vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
        pruneOldReadRecords(30 * DAY_MS);
        expect(isRead("https://example.com/a")).toBe(false);
    });
});

describe("pruneOldReadRecords", () => {
    it("removes records older than maxAgeMs and keeps newer ones", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        markRead("https://example.com/old");

        vi.setSystemTime(new Date("2026-01-25T00:00:00.000Z"));
        markRead("https://example.com/new");

        vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
        pruneOldReadRecords(30 * DAY_MS);

        expect(isRead("https://example.com/old")).toBe(false);
        expect(isRead("https://example.com/new")).toBe(true);
    });
});

describe("corrupt storage", () => {
    it("treats unparsable stored data as empty instead of throwing", () => {
        localStorage.setItem("hateview:v1:read", "{not json");
        expect(() => isRead("https://example.com/a")).not.toThrow();
        expect(isRead("https://example.com/a")).toBe(false);
        expect(() => markRead("https://example.com/a")).not.toThrow();
    });
});
