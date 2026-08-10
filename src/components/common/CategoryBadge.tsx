import type { CategoryId } from "../../types/entry";

const LABELS: Record<CategoryId, string> = {
    it: "IT",
    general: "一般",
};

interface CategoryBadgeProps {
    category: CategoryId;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
    return (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {LABELS[category]}
        </span>
    );
}
