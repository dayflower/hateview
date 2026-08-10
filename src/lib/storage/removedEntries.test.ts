import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    isRemoved,
    pruneOldRemovedRecords,
    removeEntry,
} from "./removedEntries";

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
});

describe("removeEntry / isRemoved", () => {
    it("marks a url as removed", () => {
        expect(isRemoved("https://example.com/a")).toBe(false);
        removeEntry("https://example.com/a");
        expect(isRemoved("https://example.com/a")).toBe(true);
    });
});

describe("pruneOldRemovedRecords", () => {
    it("removes records older than maxAgeMs and keeps newer ones", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        removeEntry("https://example.com/old");

        vi.setSystemTime(new Date("2026-01-25T00:00:00.000Z"));
        removeEntry("https://example.com/new");

        vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
        pruneOldRemovedRecords(30 * DAY_MS);

        expect(isRemoved("https://example.com/old")).toBe(false);
        expect(isRemoved("https://example.com/new")).toBe(true);
    });
});

describe("corrupt storage", () => {
    it("treats unparsable stored data as empty instead of throwing", () => {
        localStorage.setItem("hateview:v1:removed", "{not json");
        expect(() => isRemoved("https://example.com/a")).not.toThrow();
        expect(isRemoved("https://example.com/a")).toBe(false);
    });
});
