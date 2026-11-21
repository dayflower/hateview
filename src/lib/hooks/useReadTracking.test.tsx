import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import * as readTrackingStore from "../storage/readTracking";
import {
    ReadTrackingProvider,
    UNDO_HISTORY_LIMIT,
    useReadTracking,
} from "./useReadTracking.tsx";

function renderReadTracking() {
    return renderHook(() => useReadTracking(), {
        wrapper: ReadTrackingProvider,
    });
}

beforeEach(() => {
    localStorage.clear();
});

describe("undo read", () => {
    it("has nothing to undo initially", () => {
        const { result } = renderReadTracking();
        expect(result.current.nextUndo).toBeNull();
    });

    it("restores the most recently read entry first", () => {
        const { result } = renderReadTracking();
        act(() => result.current.markRead("https://a.example/", "A"));
        act(() => result.current.markRead("https://b.example/", "B"));
        expect(result.current.nextUndo).toEqual({
            url: "https://b.example/",
            title: "B",
        });

        act(() => result.current.undoLastRead());
        expect(result.current.isRead("https://b.example/")).toBe(false);
        expect(readTrackingStore.isRead("https://b.example/")).toBe(false);
        expect(result.current.isRead("https://a.example/")).toBe(true);
        expect(result.current.lastRestored?.url).toBe("https://b.example/");
        expect(result.current.nextUndo?.url).toBe("https://a.example/");

        act(() => result.current.undoLastRead());
        expect(result.current.isRead("https://a.example/")).toBe(false);
        expect(result.current.nextUndo).toBeNull();
    });

    it("does not record marking an already-read entry", () => {
        readTrackingStore.markRead("https://a.example/");
        const { result } = renderReadTracking();
        act(() => result.current.markRead("https://a.example/", "A"));
        expect(result.current.nextUndo).toBeNull();
    });

    it("forgets an entry that was manually marked unread", () => {
        const { result } = renderReadTracking();
        act(() => result.current.markRead("https://a.example/"));
        act(() => result.current.markRead("https://b.example/"));
        act(() => result.current.markUnread("https://b.example/"));
        expect(result.current.nextUndo?.url).toBe("https://a.example/");
    });

    it("bumps lastRestored on every undo, even of the same url", () => {
        const { result } = renderReadTracking();
        act(() => result.current.markRead("https://a.example/"));
        act(() => result.current.undoLastRead());
        const firstSeq = result.current.lastRestored?.seq;
        act(() => result.current.markRead("https://a.example/"));
        act(() => result.current.undoLastRead());
        expect(result.current.lastRestored?.seq).not.toBe(firstSeq);
    });

    it(`keeps only the latest ${UNDO_HISTORY_LIMIT} entries`, () => {
        const { result } = renderReadTracking();
        for (let i = 0; i <= UNDO_HISTORY_LIMIT; i++) {
            act(() => result.current.markRead(`https://e${i}.example/`));
        }
        for (let i = 0; i < UNDO_HISTORY_LIMIT; i++) {
            act(() => result.current.undoLastRead());
        }
        expect(result.current.nextUndo).toBeNull();
        expect(result.current.isRead("https://e0.example/")).toBe(true);
        expect(result.current.isRead("https://e1.example/")).toBe(false);
    });
});
