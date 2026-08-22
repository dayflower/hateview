import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/** Each case needs the module's launch-time behaviour (and its "did the app
 *  push anything?" state) evaluated against a fresh url, so the module is
 *  re-imported per test rather than shared. */
async function loadRouter(href: string) {
    window.history.replaceState(null, "", href);
    vi.resetModules();
    return await import("./useHashRoute");
}

describe("canonicalizeLaunchEntry", () => {
    it("rewrites a hash-less launch url to the canonical route hash", async () => {
        await loadRouter("/");

        expect(window.location.hash).toBe("#/");
    });

    it("replaces rather than pushes, so the launch entry stays the only one", async () => {
        window.history.replaceState(null, "", "/");
        const before = window.history.length;

        vi.resetModules();
        await import("./useHashRoute");

        expect(window.history.length).toBe(before);
    });

    it("leaves an existing route hash alone", async () => {
        await loadRouter("/#/later");

        expect(window.location.hash).toBe("#/later");
    });
});

describe("navigate", () => {
    it("moves to another route", async () => {
        const { navigate } = await loadRouter("/");

        navigate("/later");

        expect(window.location.hash).toBe("#/later");
    });

    it("does not stack a second entry for the route already shown", async () => {
        const { navigate } = await loadRouter("/#/later");
        const before = window.history.length;

        navigate("/later");

        expect(window.location.hash).toBe("#/later");
        expect(window.history.length).toBe(before);
    });
});

describe("goBack", () => {
    it("steps back through the history the app pushed", async () => {
        const { navigate, goBack } = await loadRouter("/");
        navigate("/settings");
        const back = vi
            .spyOn(window.history, "back")
            .mockImplementation(() => {});

        goBack();

        expect(back).toHaveBeenCalled();
        back.mockRestore();
    });

    it("falls back to the list when the app was opened on this screen", async () => {
        const { goBack } = await loadRouter(
            `/#/entry/${encodeURIComponent("https://example.com/a")}`,
        );
        const back = vi
            .spyOn(window.history, "back")
            .mockImplementation(() => {});
        const before = window.history.length;

        goBack();

        // Leaving the app is exactly what a bare `history.back()` would do here.
        expect(back).not.toHaveBeenCalled();
        expect(window.location.hash).toBe("#/");
        expect(window.history.length).toBe(before);
        back.mockRestore();
    });
});

describe("useHashPath", () => {
    it("follows back/forward navigation that only fires popstate", async () => {
        const { useHashPath } = await loadRouter("/#/later");
        const { result } = renderHook(() => useHashPath());
        expect(result.current).toBe("/later");

        act(() => {
            window.history.replaceState(null, "", "/#/settings");
            window.dispatchEvent(new PopStateEvent("popstate"));
        });

        expect(result.current).toBe("/settings");
    });
});
