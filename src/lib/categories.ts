import type { FeedId } from "../types/entry";

export interface CategoryOption {
    id: FeedId;
    label: string;
}

/** All of Hatena's hot-entry category feeds, in the order Hatena itself
 *  displays them (b.hatena.ne.jp/hotentry), with "all" pinned first. */
export const ALL_CATEGORIES: CategoryOption[] = [
    { id: "all", label: "総合" },
    { id: "general", label: "一般" },
    { id: "social", label: "世の中" },
    { id: "economics", label: "政治と経済" },
    { id: "life", label: "暮らし" },
    { id: "knowledge", label: "学び" },
    { id: "it", label: "テクノロジー" },
    { id: "fun", label: "おもしろ" },
    { id: "entertainment", label: "エンタメ" },
    { id: "game", label: "アニメとゲーム" },
];

export const ALL_CATEGORY_IDS: FeedId[] = ALL_CATEGORIES.map(
    (category) => category.id,
);
