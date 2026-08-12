import { describe, expect, it } from "vitest";
import { splitTextWithLinks } from "./linkify";

describe("splitTextWithLinks", () => {
    it("returns a single plain segment when there is no URL", () => {
        expect(splitTextWithLinks("hello world")).toEqual([
            { text: "hello world" },
        ]);
    });

    it("splits text around a URL", () => {
        expect(
            splitTextWithLinks("see https://example.com/path for more"),
        ).toEqual([
            { text: "see " },
            {
                text: "https://example.com/path",
                url: "https://example.com/path",
            },
            { text: " for more" },
        ]);
    });

    it("handles a URL at the very start or end", () => {
        expect(splitTextWithLinks("https://example.com")).toEqual([
            { text: "https://example.com", url: "https://example.com" },
        ]);
    });

    it("handles multiple URLs", () => {
        expect(
            splitTextWithLinks("https://a.example http://b.example"),
        ).toEqual([
            { text: "https://a.example", url: "https://a.example" },
            { text: " " },
            { text: "http://b.example", url: "http://b.example" },
        ]);
    });

    it("strips trailing punctuation that isn't part of the URL", () => {
        expect(splitTextWithLinks("これ良い(https://example.com)ね")).toEqual([
            { text: "これ良い(" },
            { text: "https://example.com", url: "https://example.com" },
            { text: ")ね" },
        ]);
        expect(splitTextWithLinks("参照: https://example.com/path。")).toEqual([
            { text: "参照: " },
            {
                text: "https://example.com/path",
                url: "https://example.com/path",
            },
            { text: "。" },
        ]);
    });

    it("returns an empty array for an empty string", () => {
        expect(splitTextWithLinks("")).toEqual([]);
    });
});
