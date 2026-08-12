import type { FeedId } from "../../types/entry";
import { PillTabBar } from "../common/PillTabBar";

export type CategoryFilter = FeedId;

export const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: "総合" },
    { id: "general", label: "一般" },
    { id: "it", label: "テクノロジー" },
];

interface CategoryFilterBarProps {
    selected: CategoryFilter;
    onSelect: (category: CategoryFilter) => void;
}

export function CategoryFilterBar({
    selected,
    onSelect,
}: CategoryFilterBarProps) {
    return (
        <PillTabBar
            options={CATEGORY_FILTERS}
            selected={selected}
            onSelect={onSelect}
            ariaLabel="カテゴリ"
        />
    );
}
