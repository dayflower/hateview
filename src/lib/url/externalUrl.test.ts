import { describe, expect, it } from "vitest";
import { isHttpUrl, safeExternalUrl } from "./externalUrl";

describe("safeExternalUrl", () => {
    it("passes through http and https urls unchanged", () => {
        expect(safeExternalUrl("https://example.com/a?b=1#c")).toBe(
            "https://example.com/a?b=1#c",
        );
        expect(safeExternalUrl("http://example.com/")).toBe(
            "http://example.com/",
        );
    });

    it("rejects script-bearing schemes", () => {
        expect(safeExternalUrl("javascript:alert(1)")).toBeUndefined();
        expect(safeExternalUrl("JavaScript:alert(1)")).toBeUndefined();
        expect(
            safeExternalUrl("data:text/html,<script>alert(1)</script>"),
        ).toBeUndefined();
        expect(safeExternalUrl("vbscript:msgbox(1)")).toBeUndefined();
    });

    it("rejects strings that are not urls at all", () => {
        expect(safeExternalUrl("")).toBeUndefined();
        expect(safeExternalUrl("not a url")).toBeUndefined();
        expect(safeExternalUrl("/relative/path")).toBeUndefined();
    });
});

describe("isHttpUrl", () => {
    it("reports whether a string is a usable web url", () => {
        expect(isHttpUrl("https://example.com")).toBe(true);
        expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    });
});
