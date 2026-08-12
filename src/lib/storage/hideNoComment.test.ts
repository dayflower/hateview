import { beforeEach, describe, expect, it } from "vitest";
import { readHideNoComment, writeHideNoComment } from "./hideNoComment";

beforeEach(() => {
    localStorage.clear();
});

describe("readHideNoComment / writeHideNoComment", () => {
    it("defaults to false", () => {
        expect(readHideNoComment()).toBe(false);
    });

    it("persists the written value", () => {
        writeHideNoComment(true);
        expect(readHideNoComment()).toBe(true);

        writeHideNoComment(false);
        expect(readHideNoComment()).toBe(false);
    });
});

describe("corrupt storage", () => {
    it("treats unparsable stored data as false instead of throwing", () => {
        localStorage.setItem("hateview:v1:hideNoComment", "{not json");
        expect(() => readHideNoComment()).not.toThrow();
        expect(readHideNoComment()).toBe(false);
    });
});
