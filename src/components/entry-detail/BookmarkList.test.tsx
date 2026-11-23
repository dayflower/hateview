import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HiddenUsersProvider } from "../../lib/hooks/useHiddenUsers.tsx";
import { listHiddenUsers } from "../../lib/storage/hiddenUsers";
import type { HatenaBookmark } from "../../types/bookmark";
import { BookmarkList } from "./BookmarkList";

function bookmark(user: string): HatenaBookmark {
    return {
        user,
        tags: [],
        timestamp: "2026/11/01 12:00",
        comment: `comment by ${user}`,
    };
}

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    cleanup();
});

describe("BookmarkList hide-user button", () => {
    it("hides a user only on the second click", async () => {
        const user = userEvent.setup();
        render(
            <HiddenUsersProvider>
                <BookmarkList
                    bookmarks={[bookmark("alice")]}
                    stars={{}}
                    sortOrder="new"
                />
            </HiddenUsersProvider>,
        );

        await user.click(
            screen.getByRole("button", { name: "このユーザーを非表示" }),
        );
        expect(listHiddenUsers()).toEqual([]);

        await user.click(
            screen.getByRole("button", {
                name: "もう一度クリックしてこのユーザーを非表示",
            }),
        );
        expect(listHiddenUsers().map((hidden) => hidden.user)).toEqual([
            "alice",
        ]);

        // The list itself doesn't filter; a revealed hidden user's row offers
        // to lift the hiding instead.
        await user.click(screen.getByRole("button", { name: "非表示を解除" }));
        expect(listHiddenUsers()).toEqual([]);
    });
});
