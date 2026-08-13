import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Entry } from "../../types/entry";
import { apiGet } from "../api/apiClient";
import { useEntries } from "./useEntries";

vi.mock("../api/apiClient", () => ({
    apiGet: vi.fn(),
}));

const ENTRY_A: Entry = {
    url: "https://example.com/a",
    title: "A",
    description: "",
    imageUrl: "",
    bookmarkCount: 1,
    date: "2026-08-01T00:00:00Z",
    tags: [],
    category: "テクノロジー",
};

beforeEach(() => {
    localStorage.clear();
    vi.mocked(apiGet).mockReset();
});

describe("markSeen", () => {
    it("persists to storage but does not remove the url from the currently displayed newUrls", async () => {
        vi.mocked(apiGet).mockResolvedValue({ entries: [ENTRY_A] });

        const { result } = renderHook(() => useEntries("all"));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.newUrls).toEqual(new Set([ENTRY_A.url]));

        act(() => {
            result.current.markSeen(ENTRY_A.url);
        });

        // Scrolling the row into view (which triggers markSeen) must not
        // clear the "new" badge for the list that's already on screen.
        expect(result.current.newUrls).toEqual(new Set([ENTRY_A.url]));

        // It must, however, be durably recorded for the next time this feed
        // is fetched (e.g. after a page reload).
        const stored = JSON.parse(
            localStorage.getItem("hateview:v1:seen") ?? "{}",
        );
        expect(stored).toHaveProperty(ENTRY_A.url);
    });
});
