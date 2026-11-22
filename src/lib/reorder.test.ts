import { describe, expect, it } from "vitest";
import { dropIndex, moveItem, rowShift } from "./reorder";

const rects = [0, 40, 80, 120].map((top) => ({ top, height: 40 }));

describe("moveItem", () => {
    it("moves an item forward and backward", () => {
        expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual([
            "b",
            "c",
            "a",
            "d",
        ]);
        expect(moveItem(["a", "b", "c", "d"], 3, 0)).toEqual([
            "d",
            "a",
            "b",
            "c",
        ]);
    });

    it("clamps the destination and ignores an out-of-range source", () => {
        expect(moveItem(["a", "b"], 0, 9)).toEqual(["b", "a"]);
        expect(moveItem(["a", "b"], 5, 0)).toEqual(["a", "b"]);
    });

    it("does not mutate its input", () => {
        const items = ["a", "b"];
        moveItem(items, 0, 1);
        expect(items).toEqual(["a", "b"]);
    });
});

describe("dropIndex", () => {
    it("stays put until the dragged center passes a neighbor's center", () => {
        expect(dropIndex(rects, 1, 0)).toBe(1);
        expect(dropIndex(rects, 1, 19)).toBe(1);
        expect(dropIndex(rects, 1, 41)).toBe(2);
        expect(dropIndex(rects, 1, -41)).toBe(0);
    });

    it("clamps to the ends of the list", () => {
        expect(dropIndex(rects, 0, 1000)).toBe(3);
        expect(dropIndex(rects, 3, -1000)).toBe(0);
    });
});

describe("rowShift", () => {
    it("shifts rows between source and target to open a gap", () => {
        // Dragging row 0 down to slot 2: rows 1 and 2 move up.
        expect([0, 1, 2, 3].map((i) => rowShift(i, 0, 2, 40))).toEqual([
            0, -40, -40, 0,
        ]);
        // Dragging row 3 up to slot 1: rows 1 and 2 move down.
        expect([0, 1, 2, 3].map((i) => rowShift(i, 3, 1, 40))).toEqual([
            0, 40, 40, 0,
        ]);
    });
});
