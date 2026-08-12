import { describe, expect, it } from "vitest";
import { type HideRule, isHidden, matchesRule } from "./hideRules";

function rule(partial: Partial<HideRule>): HideRule {
    return { id: "test", createdAt: "2026-01-01T00:00:00.000Z", ...partial };
}

const entry = {
    url: "https://Example.com/manga/123",
    title: "サンプル漫画 第123話 ネタバレ注意",
};

describe("matchesRule", () => {
    it("matches on domain alone, case-insensitively", () => {
        expect(matchesRule(entry, rule({ domain: "example.com" }))).toBe(true);
        expect(matchesRule(entry, rule({ domain: "EXAMPLE.COM" }))).toBe(true);
        expect(matchesRule(entry, rule({ domain: "other.com" }))).toBe(false);
    });

    it("matches on a title glob pattern alone, case-insensitively", () => {
        expect(matchesRule(entry, rule({ titleGlob: "*ネタバレ*" }))).toBe(
            true,
        );
        expect(matchesRule(entry, rule({ titleGlob: "サンプル漫画*" }))).toBe(
            true,
        );
        expect(matchesRule(entry, rule({ titleGlob: "*第999話*" }))).toBe(
            false,
        );
    });

    it("supports the ? single-character glob wildcard", () => {
        expect(matchesRule(entry, rule({ titleGlob: "*第12?話*" }))).toBe(true);
        expect(matchesRule(entry, rule({ titleGlob: "*第1?話*" }))).toBe(false);
    });

    it("treats a glob of only wildcards as matching anything", () => {
        expect(matchesRule(entry, rule({ titleGlob: "*" }))).toBe(true);
        expect(matchesRule(entry, rule({ titleGlob: "***" }))).toBe(true);
        expect(
            matchesRule({ ...entry, title: "" }, rule({ titleGlob: "*" })),
        ).toBe(true);
    });

    it("anchors the glob to the whole title", () => {
        expect(matchesRule(entry, rule({ titleGlob: "ネタバレ" }))).toBe(false);
        expect(
            matchesRule(
                entry,
                rule({ titleGlob: "サンプル漫画 第123話 ネタバレ注意" }),
            ),
        ).toBe(true);
    });

    it("treats regexp metacharacters in a glob as literals", () => {
        expect(
            matchesRule({ ...entry, title: "a.c" }, rule({ titleGlob: "a.c" })),
        ).toBe(true);
        expect(
            matchesRule({ ...entry, title: "abc" }, rule({ titleGlob: "a.c" })),
        ).toBe(false);
        expect(
            matchesRule(
                { ...entry, title: "price (tax)" },
                rule({ titleGlob: "*(tax)" }),
            ),
        ).toBe(true);
    });

    it("rejects a pathological glob without catastrophic backtracking", () => {
        const titleGlob = `${"*a".repeat(30)}*b`;
        const title = "a".repeat(400);

        const startedAt = performance.now();
        expect(matchesRule({ ...entry, title }, rule({ titleGlob }))).toBe(
            false,
        );
        expect(performance.now() - startedAt).toBeLessThan(100);
    });

    it("requires both domain and titleGlob to match when both are set (AND)", () => {
        expect(
            matchesRule(
                entry,
                rule({ domain: "example.com", titleGlob: "*ネタバレ*" }),
            ),
        ).toBe(true);
        expect(
            matchesRule(
                entry,
                rule({ domain: "other.com", titleGlob: "*ネタバレ*" }),
            ),
        ).toBe(false);
        expect(
            matchesRule(
                entry,
                rule({ domain: "example.com", titleGlob: "*第999話*" }),
            ),
        ).toBe(false);
    });

    it("never matches a rule with neither domain nor titleGlob set", () => {
        expect(matchesRule(entry, rule({}))).toBe(false);
    });
});

describe("isHidden", () => {
    it("hides an entry if any rule matches (OR across rules)", () => {
        const rules = [
            rule({ domain: "other.com" }),
            rule({ titleGlob: "*ネタバレ*" }),
        ];
        expect(isHidden(entry, rules)).toBe(true);
    });

    it("does not hide an entry that no rule matches", () => {
        const rules = [
            rule({ domain: "other.com" }),
            rule({ titleGlob: "*第999話*" }),
        ];
        expect(isHidden(entry, rules)).toBe(false);
    });

    it("does not hide anything when there are no rules", () => {
        expect(isHidden(entry, [])).toBe(false);
    });
});
