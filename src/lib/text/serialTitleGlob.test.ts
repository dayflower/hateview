import { describe, expect, it } from "vitest";
import { matchesRule } from "../storage/hideRules";
import { toSerialTitleGlob } from "./serialTitleGlob";

/** Titles taken verbatim from `b.hatena.ne.jp/hotentry/game`. */
const CASES: [title: string, glob: string][] = [
    [
        "秘密法人デスメイカー・第39話 | ヤンチャWeb（ヤングチャンピオン）",
        "秘密法人デスメイカー・* | ヤンチャWeb（ヤングチャンピオン）",
    ],
    [
        "[第62話]大人大戦 - かっぴー/都筑真佐秋 | 少年ジャンプ＋",
        "[*]大人大戦 - かっぴー/都筑真佐秋 | 少年ジャンプ＋",
    ],
    [
        "[第6話] つづら先輩は元カノだから - すずの志矢 | となりのヤングジャンプ",
        "[*] つづら先輩は元カノだから - すずの志矢 | となりのヤングジャンプ",
    ],
    [
        "[第11歩目]あっ、悪魔ちゃん - 深津ザオウ | 少年ジャンプ＋",
        "[*]あっ、悪魔ちゃん - 深津ザオウ | 少年ジャンプ＋",
    ],
    [
        "[番外編]ハーレム勇者伝説 - 津夏なつな | 少年ジャンプ＋",
        "[*]ハーレム勇者伝説 - 津夏なつな | 少年ジャンプ＋",
    ],
    [
        "[最終回]おわる漫画 - 誰か | 少年ジャンプ＋",
        "[*]おわる漫画 - 誰か | 少年ジャンプ＋",
    ],
    [
        "[11話]SATANICA - くろは | 少年ジャンプ＋",
        "[*]SATANICA - くろは | 少年ジャンプ＋",
    ],
    [
        "第203話 革命は下から / レッドブルー - 波切昂 | サンデーうぇぶり",
        "* / レッドブルー - 波切昂 | サンデーうぇぶり",
    ],
    [
        "理解のない夫くん - カレー沢薫 / 第7話　何か始まった | くらげバンチ",
        "理解のない夫くん - カレー沢薫 / * | くらげバンチ",
    ],
    [
        "草と花の部屋 2話 - ジャンプルーキー！",
        "草と花の部屋 * - ジャンプルーキー！",
    ],
];

const NON_SERIAL = [
    // A game article: the digit sits in a full-width bracket, not an episode slot.
    "【最大6人マルチ】理想のラーメン店を目指す経営シミュレーションゲーム『Japanese Ramen Simulator』発表",
    // Manga, but the instalment is not numbered at all.
    "追放されたチート付与魔術師 - 業務用飯/鋼志麻あさ/kisui / 夏休み特別休載漫画 | 月マガ基地",
    // A one-shot in a leading bracket carries no series to generalize over.
    "[読切]よみきり漫画 - 誰か | 少年ジャンプ＋",
];

describe("toSerialTitleGlob", () => {
    it.each(CASES)("wildcards the episode marker of %s", (title, glob) => {
        expect(toSerialTitleGlob(title)).toBe(glob);
    });

    it.each(NON_SERIAL)("returns null for %s", (title) => {
        expect(toSerialTitleGlob(title)).toBeNull();
    });

    it("returns null for a title with no digits or brackets at all", () => {
        expect(toSerialTitleGlob("ただのニュース記事")).toBeNull();
    });

    it("collapses a marker that spans the whole title into a single star", () => {
        expect(toSerialTitleGlob("[第1話]")).toBe("[*]");
    });

    it.each(CASES)("produces a glob that still matches %s", (title) => {
        const titleGlob = toSerialTitleGlob(title);
        expect(titleGlob).not.toBeNull();
        expect(
            matchesRule(
                { url: "https://example.com/a", title },
                {
                    id: "test",
                    createdAt: "2026-01-01T00:00:00.000Z",
                    titleGlob: titleGlob ?? "",
                },
            ),
        ).toBe(true);
    });

    it("matches the other instalments of the same series", () => {
        const titleGlob = toSerialTitleGlob(
            "[第62話]大人大戦 - かっぴー/都筑真佐秋 | 少年ジャンプ＋",
        );
        const rule = {
            id: "test",
            createdAt: "2026-01-01T00:00:00.000Z",
            titleGlob: titleGlob ?? "",
        };
        for (const title of [
            "[第63話]大人大戦 - かっぴー/都筑真佐秋 | 少年ジャンプ＋",
            "[番外編]大人大戦 - かっぴー/都筑真佐秋 | 少年ジャンプ＋",
        ]) {
            expect(
                matchesRule({ url: "https://example.com/a", title }, rule),
            ).toBe(true);
        }
    });

    it("does not match a different series on the same site", () => {
        const titleGlob = toSerialTitleGlob(
            "[第62話]大人大戦 - かっぴー/都筑真佐秋 | 少年ジャンプ＋",
        );
        expect(
            matchesRule(
                {
                    url: "https://example.com/a",
                    title: "[第39話]生活マン - 南田 冬/あやき | 少年ジャンプ＋",
                },
                {
                    id: "test",
                    createdAt: "2026-01-01T00:00:00.000Z",
                    titleGlob: titleGlob ?? "",
                },
            ),
        ).toBe(false);
    });
});
