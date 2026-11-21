import { describe, expect, it } from "vitest";
import { isUndoReadKey } from "./useUndoReadShortcut";

function key(init: KeyboardEventInit): KeyboardEvent {
    return new KeyboardEvent("keydown", init);
}

describe("isUndoReadKey", () => {
    it("accepts z alone and Ctrl/Cmd+Z", () => {
        expect(isUndoReadKey(key({ key: "z" }))).toBe(true);
        expect(isUndoReadKey(key({ key: "z", ctrlKey: true }))).toBe(true);
        expect(isUndoReadKey(key({ key: "z", metaKey: true }))).toBe(true);
    });

    it("rejects redo and other modifier combinations", () => {
        expect(
            isUndoReadKey(key({ key: "Z", shiftKey: true, ctrlKey: true })),
        ).toBe(false);
        expect(isUndoReadKey(key({ key: "Z", shiftKey: true }))).toBe(false);
        expect(isUndoReadKey(key({ key: "z", altKey: true }))).toBe(false);
        expect(
            isUndoReadKey(key({ key: "z", ctrlKey: true, metaKey: true })),
        ).toBe(false);
    });

    it("rejects other keys", () => {
        expect(isUndoReadKey(key({ key: "x" }))).toBe(false);
    });
});
