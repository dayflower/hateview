import { useMemo, useState } from "react";
import { CategoryFilterBar } from "../components/entry-list/CategoryFilterBar";
import { EntryRow } from "../components/entry-list/EntryRow";
import { useEntries } from "../lib/hooks/useEntries";
import type { CategoryId } from "../types/entry";

export function EntryListPage() {
    const { entries, loading, error } = useEntries();
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
        if (selectedCategories.size === 0) {
            return entries;
        }
        return entries.filter((entry) =>
            entry.categories.some((category) =>
                selectedCategories.has(category),
            ),
        );
    }, [entries, selectedCategories]);

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
