import { describe, expect, it } from "vitest";
import { entryPath, matchRoute } from "./routes";

describe("matchRoute", () => {
    it("matches the static routes", () => {
        expect(matchRoute("/")).toEqual({ name: "list" });
        expect(matchRoute("")).toEqual({ name: "list" });
        expect(matchRoute("/later")).toEqual({ name: "later" });
        expect(matchRoute("/settings")).toEqual({ name: "settings" });
    });

    it("returns null for an unknown path", () => {
        expect(matchRoute("/nope")).toBeNull();
    });

    it("decodes the entry url", () => {
        expect(matchRoute(entryPath("https://example.com/a?b=1"))).toEqual({
            name: "entry",
            url: "https://example.com/a?b=1",
        });
    });

    it("returns null for undecodable percent escapes", () => {
        expect(matchRoute("/entry/%E0%A4%A")).toBeNull();
    });

    it("returns null for an entry url that is not a web url", () => {
        expect(
            matchRoute(`/entry/${encodeURIComponent("javascript:alert(1)")}`),
        ).toBeNull();
        expect(
            matchRoute(
                `/entry/${encodeURIComponent("data:text/html,<script>alert(1)</script>")}`,
            ),
        ).toBeNull();
        expect(matchRoute("/entry/")).toBeNull();
        expect(matchRoute("/entry/not-a-url")).toBeNull();
    });
});
