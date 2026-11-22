import { beforeEach, describe, expect, it } from "vitest";
import { ALL_CATEGORY_IDS } from "../categories";
import {
    isCategoryVisible,
    listHiddenCategories,
    listOrderedCategories,
    listVisibleCategories,
    resetCategoryOrder,
    setCategoryOrder,
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

describe("category order", () => {
    it("defaults to the built-in order when nothing is stored", () => {
        expect(listOrderedCategories()).toEqual(ALL_CATEGORY_IDS);
    });

    it("round-trips a custom order, including moving 'all'", () => {
        const order = [...ALL_CATEGORY_IDS].reverse();
        setCategoryOrder(order);
        expect(listOrderedCategories()).toEqual(order);
    });

    it("applies the order to visible categories and skips hidden ones", () => {
        setCategoryOrder(["it", "game", ...ALL_CATEGORY_IDS]);
        setCategoryVisible("game", false);
        const visible = listVisibleCategories();
        expect(visible[0]).toBe("it");
        expect(visible[1]).toBe("all");
        expect(visible).not.toContain("game");
        // A hidden category keeps its slot in the full order.
        expect(listOrderedCategories()[1]).toBe("game");
    });

    it("normalizes unknown, duplicate and missing ids", () => {
        localStorage.setItem(
            "hateview:v1:categoryOrder",
            JSON.stringify(["game", "bogus", "game", 7, "it"]),
        );
        const order = listOrderedCategories();
        expect(order.slice(0, 2)).toEqual(["game", "it"]);
        expect([...order].sort()).toEqual([...ALL_CATEGORY_IDS].sort());
        expect(order.slice(2)).toEqual(
            ALL_CATEGORY_IDS.filter((id) => id !== "game" && id !== "it"),
        );
    });

    it("falls back to the default order for a non-array stored value", () => {
        localStorage.setItem(
            "hateview:v1:categoryOrder",
            JSON.stringify({ not: "an array" }),
        );
        expect(listOrderedCategories()).toEqual(ALL_CATEGORY_IDS);
    });

    it("resets the order without touching visibility", () => {
        setCategoryOrder([...ALL_CATEGORY_IDS].reverse());
        setCategoryVisible("game", false);
        resetCategoryOrder();
        expect(listOrderedCategories()).toEqual(ALL_CATEGORY_IDS);
        expect(isCategoryVisible("game")).toBe(false);
    });
});
