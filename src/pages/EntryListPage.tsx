import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CategoryFilterBar } from "../components/entry-list/CategoryFilterBar";
import { EntryRow } from "../components/entry-list/EntryRow";
import { useEntries } from "../lib/hooks/useEntries";
import { useHideRules } from "../lib/hooks/useHideRules.tsx";
import { useKeyboardNav } from "../lib/hooks/useKeyboardNav";
import { entryPath } from "../router/routes";
import { navigate } from "../router/useHashRoute";
import type { CategoryId } from "../types/entry";

export function EntryListPage() {
    const { entries, loading, error } = useEntries();
    const { isHidden } = useHideRules();
    const [selectedCategories, setSelectedCategories] = useState<
        Set<CategoryId>
    >(() => new Set());
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

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
        setFocusedIndex(-1);
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

    useEffect(() => {
        if (focusedIndex >= 0) {
            itemRefs.current[focusedIndex]?.scrollIntoView({
                block: "nearest",
            });
        }
    }, [focusedIndex]);

    const handleSelect = useCallback(
        (index: number) => {
            const entry = visibleEntries[index];
            if (entry) {
                navigate(entryPath(entry.url));
            }
        },
        [visibleEntries],
    );

    useKeyboardNav({
        itemCount: visibleEntries.length,
        focusedIndex,
        onMove: setFocusedIndex,
        onSelect: handleSelect,
    });

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
                {visibleEntries.map((entry, index) => (
                    <EntryRow
                        key={entry.url}
                        entry={entry}
                        focused={index === focusedIndex}
                        itemRef={(el) => {
                            itemRefs.current[index] = el;
                        }}
                    />
                ))}
            </ul>
        </div>
    );
}
