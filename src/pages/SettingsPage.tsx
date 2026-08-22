import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { HideRuleForm } from "../components/common/HideRuleForm";
import { HideRuleModal } from "../components/common/HideRuleModal";
import { PillTabBar } from "../components/common/PillTabBar";
import { ALL_CATEGORIES } from "../lib/categories";
import { useBookmarkSource } from "../lib/hooks/useBookmarkSource.tsx";
import { useCategoryVisibility } from "../lib/hooks/useCategoryVisibility.tsx";
import { useDetailTarget } from "../lib/hooks/useDetailTarget.tsx";
import { useHideRules } from "../lib/hooks/useHideRules.tsx";
import { useTheme } from "../lib/hooks/useTheme.tsx";
import type { HideRule } from "../lib/storage/hideRules";
import type { ThemeSetting } from "../lib/storage/theme";
import type { BookmarkSource } from "../types/bookmark";

const THEME_OPTIONS: { id: ThemeSetting; label: string }[] = [
    { id: "light", label: "ライト" },
    { id: "dark", label: "ダーク" },
    { id: "system", label: "システムに従う" },
];

/** The bookmark source and the detail target are stored separately, but the
 *  user picks between them on a single axis: two ways of building the in-app
 *  detail page, plus skipping it altogether. Keeping the sources stored apart
 *  means switching back from "official" restores the source last chosen. */
type DetailViewOption = BookmarkSource | "official";

const DETAIL_VIEW_OPTIONS: { id: DetailViewOption; label: string }[] = [
    { id: "json", label: "json" },
    { id: "jsonlite", label: "jsonlite" },
    { id: "official", label: "本家ページ" },
];

export function SettingsPage() {
    const { rules, removeRule } = useHideRules();
    const { theme, setTheme } = useTheme();
    const { bookmarkSource, setBookmarkSource } = useBookmarkSource();
    const { detailTarget, setDetailTarget } = useDetailTarget();
    const { visibleCategories, isCategoryVisible, setCategoryVisible } =
        useCategoryVisibility();
    const [editingRule, setEditingRule] = useState<HideRule | null>(null);

    const selectedDetailView: DetailViewOption =
        detailTarget === "official" ? "official" : bookmarkSource;

    const handleDetailViewSelect = (id: DetailViewOption) => {
        if (id === "official") {
            setDetailTarget("official");
            return;
        }
        setBookmarkSource(id);
        setDetailTarget("app");
    };

    return (
        <div className="mx-auto max-w-4xl p-4">
            <h1 className="font-semibold text-lg">表示設定</h1>
            <PillTabBar
                options={THEME_OPTIONS}
                selected={theme}
                onSelect={setTheme}
                ariaLabel="テーマ"
            />

            <h1 className="mt-8 font-semibold text-lg">
                エントリーを開いたときの表示
            </h1>
            <p className="mt-1 text-gray-500 text-sm">
                一覧からエントリーを開いたときの表示を選択します。json /
                jsonlite
                は、アプリ内の詳細画面のブックマーク件数・コメント一覧をはてなのどのAPIから取得するかの選択です。本家ページを選ぶと、詳細画面を経由せずはてなブックマークのエントリーページを直接開きます。
            </p>
            <div className="mt-4">
                <PillTabBar
                    options={DETAIL_VIEW_OPTIONS}
                    selected={selectedDetailView}
                    onSelect={handleDetailViewSelect}
                    ariaLabel="エントリーを開いたときの表示"
                />
            </div>

            <h1 className="mt-8 font-semibold text-lg">表示カテゴリ設定</h1>
            <p className="mt-1 text-gray-500 text-sm">
                エントリー一覧に表示するカテゴリを選択します。少なくとも1つは選択してください。
            </p>
            <ul className="mt-4">
                {ALL_CATEGORIES.map((category) => {
                    const checked = isCategoryVisible(category.id);
                    const disabled = checked && visibleCategories.length <= 1;
                    return (
                        <li
                            key={category.id}
                            className="flex items-center border-gray-200 border-b py-2 text-sm dark:border-gray-800"
                        >
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={(event) =>
                                        setCategoryVisible(
                                            category.id,
                                            event.target.checked,
                                        )
                                    }
                                    className="size-4 rounded border-gray-300 dark:border-gray-700"
                                />
                                {category.label}
                            </label>
                        </li>
                    );
                })}
            </ul>

            <h1 className="mt-8 font-semibold text-lg">非表示フィルタ設定</h1>
            <HideRuleForm
                descriptionClassName="mt-1 text-gray-500 text-sm"
                formClassName="mt-4 flex flex-col gap-2"
                labelClassName="flex flex-col gap-1 text-sm"
                inputClassName="rounded border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
                domainPlaceholder="shonenjumpplus.com"
                titleGlobPlaceholder="*ネタバレ*"
                showValidationError
                onSubmitted={() => {}}
                footer={
                    <button
                        type="submit"
                        className="mt-1 self-start rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                        ルールを追加
                    </button>
                }
            />

            <ul className="mt-6">
                {rules.length === 0 && (
                    <p className="text-gray-500 text-sm">
                        登録済みのルールはありません。
                    </p>
                )}
                {rules.map((rule) => (
                    <li
                        key={rule.id}
                        className="flex items-center justify-between border-gray-200 border-b py-2 text-sm dark:border-gray-800"
                    >
                        <span>
                            {rule.domain && (
                                <span className="mr-2">
                                    domain: {rule.domain}
                                </span>
                            )}
                            {rule.titleGlob && (
                                <span>title: {rule.titleGlob}</span>
                            )}
                        </span>
                        <span className="flex gap-3">
                            <button
                                type="button"
                                aria-label="ルールを編集"
                                onClick={() => setEditingRule(rule)}
                                className="text-gray-500 hover:text-blue-600"
                            >
                                <Pencil className="size-4" />
                            </button>
                            <button
                                type="button"
                                aria-label="ルールを削除"
                                onClick={() => removeRule(rule.id)}
                                className="text-gray-500 hover:text-red-600"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </span>
                    </li>
                ))}
            </ul>

            {editingRule && (
                <HideRuleModal
                    ruleId={editingRule.id}
                    initialDomain={editingRule.domain ?? ""}
                    initialTitle={editingRule.titleGlob ?? ""}
                    onClose={() => setEditingRule(null)}
                />
            )}
        </div>
    );
}
