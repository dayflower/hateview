import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUrlRecordStore } from "./urlRecordStore";

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
});

describe("add / has", () => {
    it("marks a url as present", () => {
        const store = createUrlRecordStore({
            storageKey: "test:store",
            timestampField: "at",
        });
        expect(store.has("https://example.com/a")).toBe(false);
        store.add("https://example.com/a");
        expect(store.has("https://example.com/a")).toBe(true);
    });

    it("is idempotent: the first-added timestamp is not reset by later calls", () => {
        const store = createUrlRecordStore({
            storageKey: "test:store",
            timestampField: "at",
        });
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        store.add("https://example.com/a");

        vi.setSystemTime(new Date("2026-01-20T00:00:00.000Z"));
        store.add("https://example.com/a");

        vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
        store.prune(30 * DAY_MS);
        expect(store.has("https://example.com/a")).toBe(false);
    });
});

describe("listUrls", () => {
    it("returns every stored url", () => {
        const store = createUrlRecordStore({
            storageKey: "test:store",
            timestampField: "at",
        });
        store.add("https://example.com/a");
        store.add("https://example.com/b");
        expect(store.listUrls()).toEqual(
            new Set(["https://example.com/a", "https://example.com/b"]),
        );
    });
});

describe("remove", () => {
    it("deletes the url", () => {
        const store = createUrlRecordStore({
            storageKey: "test:store",
            timestampField: "at",
        });
        store.add("https://example.com/a");
        store.remove("https://example.com/a");
        expect(store.has("https://example.com/a")).toBe(false);
    });

    it("is a no-op for a url that was never added", () => {
        const store = createUrlRecordStore({
            storageKey: "test:store",
            timestampField: "at",
        });
        expect(() => store.remove("https://example.com/a")).not.toThrow();
    });
});

describe("prune", () => {
    it("removes records older than maxAgeMs and keeps newer ones", () => {
        const store = createUrlRecordStore({
            storageKey: "test:store",
            timestampField: "at",
        });
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        store.add("https://example.com/old");

        vi.setSystemTime(new Date("2026-01-25T00:00:00.000Z"));
        store.add("https://example.com/new");

        vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
        store.prune(30 * DAY_MS);

        expect(store.has("https://example.com/old")).toBe(false);
        expect(store.has("https://example.com/new")).toBe(true);
    });

    it("respects the field name given at creation", () => {
        const store = createUrlRecordStore({
            storageKey: "test:custom-field",
            timestampField: "removedAt",
        });
        store.add("https://example.com/a");
        const raw = JSON.parse(
            localStorage.getItem("test:custom-field") ?? "{}",
        );
        expect(raw["https://example.com/a"]).toHaveProperty("removedAt");
    });

    it("defaults to defaultMaxAgeMs when no argument is given", () => {
        const store = createUrlRecordStore({
            storageKey: "test:store",
            timestampField: "at",
            defaultMaxAgeMs: DAY_MS,
        });
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        store.add("https://example.com/a");

        vi.setSystemTime(new Date("2026-01-03T00:00:00.000Z"));
        store.prune();
        expect(store.has("https://example.com/a")).toBe(false);
    });
});

describe("corrupt storage", () => {
    it("treats unparsable stored data as empty instead of throwing", () => {
        const store = createUrlRecordStore({
            storageKey: "test:corrupt",
            timestampField: "at",
        });
        localStorage.setItem("test:corrupt", "{not json");
        expect(() => store.has("https://example.com/a")).not.toThrow();
        expect(store.has("https://example.com/a")).toBe(false);
        expect(() => store.add("https://example.com/a")).not.toThrow();
    });
});
