import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReadLaterProvider } from "../../lib/hooks/useReadLater.tsx";
import { ReadTrackingProvider } from "../../lib/hooks/useReadTracking.tsx";
import { RemovedEntriesProvider } from "../../lib/hooks/useRemovedEntries.tsx";
import type { Entry } from "../../types/entry";
import { EntryRow } from "./EntryRow";

const SAMPLE_ENTRY: Entry = {
    url: "https://example.com/article",
    title: "Sample article",
    description: "Sample description",
    imageUrl: "",
    bookmarkCount: 12,
    date: "2026-08-01T00:00:00Z",
    tags: ["tag1"],
    category: "テクノロジー",
};

function renderEntryRow() {
    const onRequestHide = vi.fn();
    render(
        <ReadTrackingProvider>
            <ReadLaterProvider>
                <RemovedEntriesProvider>
                    <EntryRow
                        entry={SAMPLE_ENTRY}
                        onRequestHide={onRequestHide}
                    />
                </RemovedEntriesProvider>
            </ReadLaterProvider>
        </ReadTrackingProvider>,
    );
    return { onRequestHide };
}

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    cleanup();
});

describe("read toggle", () => {
    it("marks the entry read, then unread again", async () => {
        const user = userEvent.setup();
        renderEntryRow();

        await user.click(screen.getByRole("button", { name: "既読にする" }));
        expect(screen.getByRole("button", { name: "未読に戻す" })).toBeTruthy();

        await user.click(screen.getByRole("button", { name: "未読に戻す" }));
        expect(screen.getByRole("button", { name: "既読にする" })).toBeTruthy();
    });
});

describe("read-later toggle", () => {
    it("adds the entry, then removes it again", async () => {
        const user = userEvent.setup();
        renderEntryRow();

        await user.click(
            screen.getByRole("button", { name: "あとで読むに追加" }),
        );
        expect(
            screen.getByRole("button", { name: "あとで読むから外す" }),
        ).toBeTruthy();

        await user.click(
            screen.getByRole("button", { name: "あとで読むから外す" }),
        );
        expect(
            screen.getByRole("button", { name: "あとで読むに追加" }),
        ).toBeTruthy();
    });
});

describe("delete confirmation", () => {
    it("requires a second click within the confirm window before removing", async () => {
        const user = userEvent.setup();
        renderEntryRow();

        await user.click(
            screen.getByRole("button", { name: "このエントリーを削除" }),
        );
        expect(
            screen.getByRole("button", {
                name: "もう一度クリックして削除を確定",
            }),
        ).toBeTruthy();
        // Not yet removed after only one click.
        expect(localStorage.getItem("hateview:v1:removed")).toBeNull();

        await user.click(
            screen.getByRole("button", {
                name: "もう一度クリックして削除を確定",
            }),
        );

        await waitFor(() => {
            const stored = JSON.parse(
                localStorage.getItem("hateview:v1:removed") ?? "{}",
            );
            expect(stored).toHaveProperty(SAMPLE_ENTRY.url);
        });
    });
});

describe("overflow menu", () => {
    it("opens with all three actions, and closes on outside click", async () => {
        const user = userEvent.setup();
        renderEntryRow();

        await user.click(screen.getByRole("button", { name: "その他の操作" }));
        expect(screen.getByRole("menu")).toBeTruthy();
        expect(
            screen.getByRole("menuitem", { name: "あとで読むに追加" }),
        ).toBeTruthy();
        expect(
            screen.getByRole("menuitem", { name: "非表示条件を登録" }),
        ).toBeTruthy();
        expect(
            screen.getByRole("menuitem", { name: "このエントリーを削除" }),
        ).toBeTruthy();

        await user.click(document.body);
        await waitFor(() => {
            expect(screen.queryByRole("menu")).toBeNull();
        });
    });

    it("closes on Escape", async () => {
        const user = userEvent.setup();
        renderEntryRow();

        await user.click(screen.getByRole("button", { name: "その他の操作" }));
        expect(screen.getByRole("menu")).toBeTruthy();

        await user.keyboard("{Escape}");
        await waitFor(() => {
            expect(screen.queryByRole("menu")).toBeNull();
        });
    });

    it("calls onRequestHide with the entry when 非表示条件を登録 is chosen", async () => {
        const user = userEvent.setup();
        const { onRequestHide } = renderEntryRow();

        await user.click(screen.getByRole("button", { name: "その他の操作" }));
        await user.click(
            screen.getByRole("menuitem", { name: "非表示条件を登録" }),
        );

        expect(onRequestHide).toHaveBeenCalledWith(SAMPLE_ENTRY);
        expect(screen.queryByRole("menu")).toBeNull();
    });
});
