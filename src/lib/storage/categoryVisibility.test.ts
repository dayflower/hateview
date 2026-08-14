import { beforeEach, describe, expect, it } from "vitest";
import { ALL_CATEGORY_IDS } from "../categories";
import {
    isCategoryVisible,
    listHiddenCategories,
    listVisibleCategories,
    setCategoryVisible,
} from "./categoryVisibility";

beforeEach(() => {
    localStorage.clear();
});

describe("listVisibleCategories / listHiddenCategories", () => {
    it("defaults to every category visible when nothing is stored", () => {
        expect(listHiddenCategories()).toEqual([]);
        expect(listVisibleCategories()).toEqual(ALL_CATEGORY_IDS);
    });

    it("round-trips hiding and re-showing a category", () => {
        setCategoryVisible("game", false);
        expect(isCategoryVisible("game")).toBe(false);
        expect(listVisibleCategories()).not.toContain("game");

        setCategoryVisible("game", true);
        expect(isCategoryVisible("game")).toBe(true);
    });

    it("refuses to hide the last visible category", () => {
        for (const id of ALL_CATEGORY_IDS) {
            if (id !== "all") {
                setCategoryVisible(id, false);
            }
        }
        expect(listVisibleCategories()).toEqual(["all"]);

        setCategoryVisible("all", false);
        expect(listVisibleCategories()).toEqual(["all"]);
    });

    it("ignores unknown/corrupted stored category ids", () => {
        localStorage.setItem(
            "hateview:v1:hiddenCategories",
            JSON.stringify(["game", "not-a-real-category", 42]),
        );
        expect(listHiddenCategories()).toEqual(["game"]);
    });
});
