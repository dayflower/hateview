import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ALL_CATEGORY_IDS } from "../../lib/categories";
import { CategoryVisibilityProvider } from "../../lib/hooks/useCategoryVisibility.tsx";
import { listOrderedCategories } from "../../lib/storage/categoryVisibility";
import { CategorySettingsList } from "./CategorySettingsList";

function renderList() {
    render(
        <CategoryVisibilityProvider>
            <CategorySettingsList />
        </CategoryVisibilityProvider>,
    );
}

function rowLabels(): string[] {
    return screen
        .getAllByRole("checkbox")
        .map((checkbox) => checkbox.parentElement?.textContent ?? "");
}

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    cleanup();
});

describe("CategorySettingsList", () => {
    it("moves a row with the arrow keys and keeps focus on its handle", async () => {
        const user = userEvent.setup();
        renderList();
        const handle = screen.getByRole("button", {
            name: "総合の並び順を変更",
        });
        handle.focus();

        await user.keyboard("{ArrowDown}{ArrowDown}");

        expect(rowLabels().slice(0, 3)).toEqual(["一般", "世の中", "総合"]);
        expect(listOrderedCategories().slice(0, 3)).toEqual([
            "general",
            "social",
            "all",
        ]);
        expect(document.activeElement).toBe(handle);

        await user.keyboard("{ArrowUp}");
        expect(listOrderedCategories()[1]).toBe("all");
    });

    it("ignores moves past either end", async () => {
        const user = userEvent.setup();
        renderList();
        screen.getByRole("button", { name: "総合の並び順を変更" }).focus();

        await user.keyboard("{ArrowUp}");

        expect(listOrderedCategories()).toEqual(ALL_CATEGORY_IDS);
    });

    it("restores the default order on reset", async () => {
        const user = userEvent.setup();
        renderList();
        screen.getByRole("button", { name: "総合の並び順を変更" }).focus();
        await user.keyboard("{ArrowDown}");

        await user.click(
            screen.getByRole("button", { name: "初期の並び順に戻す" }),
        );

        expect(listOrderedCategories()).toEqual(ALL_CATEGORY_IDS);
        expect(rowLabels()[0]).toBe("総合");
    });
});
