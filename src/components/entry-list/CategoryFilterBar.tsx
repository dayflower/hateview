import { ALL_CATEGORIES } from "../../lib/categories";
import { useCategoryVisibility } from "../../lib/hooks/useCategoryVisibility.tsx";
import type { FeedId } from "../../types/entry";
import { PillTabBar } from "../common/PillTabBar";

export type CategoryFilter = FeedId;

interface CategoryFilterBarProps {
    selected: CategoryFilter;
    onSelect: (category: CategoryFilter) => void;
}

export function CategoryFilterBar({
    selected,
    onSelect,
}: CategoryFilterBarProps) {
    const { visibleCategories } = useCategoryVisibility();
    const visibleSet = new Set(visibleCategories);
    const options = ALL_CATEGORIES.filter((category) =>
        visibleSet.has(category.id),
    );

    return (
        <div className="flex justify-center">
            <PillTabBar
                options={options}
                selected={selected}
                onSelect={onSelect}
                ariaLabel="カテゴリ"
            />
        </div>
    );
}
