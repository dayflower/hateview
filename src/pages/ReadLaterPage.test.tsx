import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DetailTargetProvider } from "../lib/hooks/useDetailTarget.tsx";
import { ReadLaterProvider } from "../lib/hooks/useReadLater.tsx";
import { ReadTrackingProvider } from "../lib/hooks/useReadTracking.tsx";
import * as readLaterStore from "../lib/storage/readLater";
import { ReadLaterPage } from "./ReadLaterPage";

const SAMPLE_SNAPSHOT = {
    url: "https://example.com/article",
    title: "Sample article",
    description: "Sample description",
};

function renderPage() {
    render(
        <DetailTargetProvider>
            <ReadTrackingProvider>
                <ReadLaterProvider>
                    <ReadLaterPage />
                </ReadLaterProvider>
            </ReadTrackingProvider>
        </DetailTargetProvider>,
    );
}

beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
    readLaterStore.toggle(SAMPLE_SNAPSHOT);
});

afterEach(() => {
    cleanup();
});

describe("delete confirmation", () => {
    it("requires a second click within the confirm window before removing", async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(
            screen.getByRole("button", { name: "あとで読むから外す" }),
        );
        expect(
            screen.getByRole("button", {
                name: "もう一度クリックして「あとで読むから外す」を確定",
            }),
        ).toBeTruthy();
        // Not yet removed after only one click.
        expect(readLaterStore.isMarked(SAMPLE_SNAPSHOT.url)).toBe(true);

        await user.click(
            screen.getByRole("button", {
                name: "もう一度クリックして「あとで読むから外す」を確定",
            }),
        );

        await waitFor(() => {
            expect(readLaterStore.isMarked(SAMPLE_SNAPSHOT.url)).toBe(false);
        });
        expect(
            screen.getByText(
                "あとで読む に追加したエントリーはまだありません。",
            ),
        ).toBeTruthy();
    });
});
