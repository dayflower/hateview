import type { CategoryId } from "../../types/entry";

export type CategoryFilter = "all" | CategoryId;

export const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: "総合" },
    { id: "general", label: "一般" },
    { id: "it", label: "IT" },
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
        <div
            role="tablist"
            className="inline-flex gap-1 rounded-full border border-gray-300 p-1 dark:border-gray-700"
        >
            {CATEGORY_FILTERS.map((category) => (
                <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={selected === category.id}
                    onClick={() => onSelect(category.id)}
                    className={`rounded-full px-3 py-1 text-sm ${
                        selected === category.id
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                >
                    {category.label}
                </button>
            ))}
        </div>
    );
}
