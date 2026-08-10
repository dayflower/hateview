import type { CategoryId } from "../../types/entry";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
    { id: "it", label: "IT" },
    { id: "general", label: "一般" },
];

interface CategoryFilterBarProps {
    selected: Set<CategoryId>;
    onToggle: (category: CategoryId) => void;
}

export function CategoryFilterBar({
    selected,
    onToggle,
}: CategoryFilterBarProps) {
    return (
        <div className="flex flex-wrap gap-4 py-2">
            {CATEGORIES.map((category) => (
                <label
                    key={category.id}
                    className="flex items-center gap-1.5 text-sm"
                >
                    <input
                        type="checkbox"
                        checked={selected.has(category.id)}
                        onChange={() => onToggle(category.id)}
                        className="size-4"
                    />
                    {category.label}
                </label>
            ))}
        </div>
    );
}
