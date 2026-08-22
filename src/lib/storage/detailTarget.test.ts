import { beforeEach, describe, expect, it } from "vitest";
import {
    DETAIL_TARGET_STORAGE_KEY,
    readDetailTarget,
    writeDetailTarget,
} from "./detailTarget";

beforeEach(() => {
    localStorage.clear();
});

describe("readDetailTarget / writeDetailTarget", () => {
    it("defaults to the in-app detail page when nothing is stored", () => {
        expect(readDetailTarget()).toBe("app");
    });

    it("round-trips a stored target", () => {
        writeDetailTarget("official");
        expect(readDetailTarget()).toBe("official");
    });

    it("falls back to app for a corrupted/invalid value", () => {
        localStorage.setItem(
            DETAIL_TARGET_STORAGE_KEY,
            JSON.stringify("hatena"),
        );
        expect(readDetailTarget()).toBe("app");
    });
});
