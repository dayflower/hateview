import { useMemo, useState } from "react";
import { CategoryFilterBar } from "../components/entry-list/CategoryFilterBar";
import { EntryRow } from "../components/entry-list/EntryRow";
import { useEntries } from "../lib/hooks/useEntries";
import { useHideRules } from "../lib/hooks/useHideRules.tsx";
import type { CategoryId } from "../types/entry";

export function EntryListPage() {
    const { entries, loading, error } = useEntries();
    const { isHidden } = useHideRules();
    const [selectedCategories, setSelectedCategories] = useState<
        Set<CategoryId>
    >(() => new Set());

    const toggleCategory = (category: CategoryId) => {
        setSelectedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const visibleEntries = useMemo(() => {
        return entries
            .filter(
                (entry) =>
                    selectedCategories.size === 0 ||
                    entry.categories.some((category) =>
                        selectedCategories.has(category),
                    ),
            )
            .filter((entry) => !isHidden(entry));
    }, [entries, selectedCategories, isHidden]);

    if (loading) {
        return <p className="p-4 text-gray-500">読み込み中...</p>;
    }
    if (error) {
        return (
            <p className="p-4 text-red-600">読み込みに失敗しました: {error}</p>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p-4">
            <CategoryFilterBar
                selected={selectedCategories}
                onToggle={toggleCategory}
            />
            <ul>
                {visibleEntries.map((entry) => (
                    <EntryRow key={entry.url} entry={entry} />
                ))}
            </ul>
        </div>
    );
}
