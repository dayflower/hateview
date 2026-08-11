import { useLayoutEffect, useRef, useState } from "react";
import type { FeedId } from "../../types/entry";

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
    const buttonRefs = useRef(new Map<CategoryFilter, HTMLButtonElement>());
    const [pillRect, setPillRect] = useState<{ left: number; width: number }>();

    useLayoutEffect(() => {
        const button = buttonRefs.current.get(selected);
        if (button) {
            setPillRect({ left: button.offsetLeft, width: button.offsetWidth });
        }
    }, [selected]);

    return (
        <div
            role="tablist"
            className="relative inline-flex gap-1 rounded-full border border-gray-300 p-1 dark:border-gray-700"
        >
            {pillRect && (
                <div
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 rounded-full bg-blue-600 transition-[left,width] duration-200 ease-out"
                    style={{ left: pillRect.left, width: pillRect.width }}
                />
            )}
            {CATEGORY_FILTERS.map((category) => (
                <button
                    key={category.id}
                    ref={(el) => {
                        if (el) {
                            buttonRefs.current.set(category.id, el);
                        } else {
                            buttonRefs.current.delete(category.id);
                        }
                    }}
                    type="button"
                    role="tab"
                    aria-selected={selected === category.id}
                    onClick={() => onSelect(category.id)}
                    className={`relative z-10 rounded-full px-3 py-1 text-sm transition-colors ${
                        selected === category.id
                            ? "text-white"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                >
                    {category.label}
                </button>
            ))}
        </div>
    );
}
