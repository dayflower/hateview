import { beforeEach, describe, expect, it } from "vitest";
import {
    addHiddenUser,
    isValidHatenaId,
    listHiddenUsers,
    removeHiddenUser,
} from "./hiddenUsers";

beforeEach(() => {
    localStorage.clear();
});

describe("hiddenUsers", () => {
    it("starts empty", () => {
        expect(listHiddenUsers()).toEqual([]);
    });

    it("adds a user, trimming surrounding whitespace", () => {
        addHiddenUser("  alice  ");
        expect(listHiddenUsers().map((hidden) => hidden.user)).toEqual([
            "alice",
        ]);
    });

    it("ignores a user already on the list", () => {
        addHiddenUser("alice");
        addHiddenUser("alice");
        expect(listHiddenUsers()).toHaveLength(1);
    });

    it("treats differently-cased ids as distinct users", () => {
        addHiddenUser("alice");
        addHiddenUser("Alice");
        expect(listHiddenUsers().map((hidden) => hidden.user)).toEqual([
            "alice",
            "Alice",
        ]);
    });

    it("ignores an empty user", () => {
        addHiddenUser("   ");
        expect(listHiddenUsers()).toEqual([]);
    });

    it("removes a user by exact id", () => {
        addHiddenUser("alice");
        addHiddenUser("bob");
        removeHiddenUser("Alice");
        expect(listHiddenUsers()).toHaveLength(2);
        removeHiddenUser("alice");
        expect(listHiddenUsers().map((hidden) => hidden.user)).toEqual(["bob"]);
    });
});

describe("isValidHatenaId", () => {
    it("accepts well-formed ids", () => {
        expect(isValidHatenaId("abc")).toBe(true);
        expect(isValidHatenaId("Foo_bar-123")).toBe(true);
        expect(isValidHatenaId(`a${"b".repeat(31)}`)).toBe(true);
    });

    it("rejects malformed ids", () => {
        expect(isValidHatenaId("")).toBe(false);
        expect(isValidHatenaId("ab")).toBe(false);
        expect(isValidHatenaId("1abc")).toBe(false);
        expect(isValidHatenaId("a b c")).toBe(false);
        expect(isValidHatenaId("abc.def")).toBe(false);
        expect(isValidHatenaId(`a${"b".repeat(32)}`)).toBe(false);
    });
});
