import { beforeEach, describe, expect, it } from "vitest";
import { HIDE_READ_STORAGE_KEY, readHideRead, writeHideRead } from "./hideRead";

beforeEach(() => {
    sessionStorage.clear();
});

describe("readHideRead / writeHideRead", () => {
    it("defaults to false when nothing is stored", () => {
        expect(readHideRead()).toBe(false);
    });

    it("round-trips a stored value", () => {
        writeHideRead(true);
        expect(readHideRead()).toBe(true);
    });

    it("falls back to false for a corrupted/invalid value", () => {
        sessionStorage.setItem(HIDE_READ_STORAGE_KEY, "not json");
        expect(readHideRead()).toBe(false);
    });
});
