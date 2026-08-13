import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    applyTheme,
    readThemeSetting,
    resolveTheme,
    THEME_STORAGE_KEY,
    writeThemeSetting,
} from "./theme";

function mockMatchMedia(prefersDark: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)" && prefersDark,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
});

describe("readThemeSetting / writeThemeSetting", () => {
    it("defaults to system when nothing is stored", () => {
        expect(readThemeSetting()).toBe("system");
    });

    it("round-trips a stored setting", () => {
        writeThemeSetting("dark");
        expect(readThemeSetting()).toBe("dark");
    });

    it("falls back to system for a corrupted/invalid value", () => {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify("neon"));
        expect(readThemeSetting()).toBe("system");
    });
});

describe("resolveTheme", () => {
    it("returns the explicit setting for light/dark", () => {
        expect(resolveTheme("light")).toBe("light");
        expect(resolveTheme("dark")).toBe("dark");
    });

    it("resolves system based on prefers-color-scheme", () => {
        mockMatchMedia(true);
        expect(resolveTheme("system")).toBe("dark");
        mockMatchMedia(false);
        expect(resolveTheme("system")).toBe("light");
    });
});

describe("applyTheme", () => {
    it("adds the dark class for dark themes", () => {
        applyTheme("dark");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("removes the dark class for light themes", () => {
        document.documentElement.classList.add("dark");
        applyTheme("light");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
});
