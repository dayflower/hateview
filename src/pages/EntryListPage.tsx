import { useEffect, useMemo, useRef, useState } from "react";
import { HideRuleModal } from "../components/common/HideRuleModal";
import type { CategoryFilter } from "../components/entry-list/CategoryFilterBar";
import { CategoryFilterBar } from "../components/entry-list/CategoryFilterBar";
import { EntryRow } from "../components/entry-list/EntryRow";
import { useEntries } from "../lib/hooks/useEntries";
import { useHideRules } from "../lib/hooks/useHideRules.tsx";
import { useKeyboardNav } from "../lib/hooks/useKeyboardNav";
import { useRemovedEntries } from "../lib/hooks/useRemovedEntries.tsx";
import { entryPath } from "../router/routes";
import { navigate } from "../router/useHashRoute";
import type { Entry } from "../types/entry";

export function EntryListPage() {
    const [selectedCategory, setSelectedCategory] =
        useState<CategoryFilter>("all");
    const { entries, newUrls, loading, error, markSeen } =
        useEntries(selectedCategory);
    const { isHidden } = useHideRules();
    const { isRemoved } = useRemovedEntries();
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [hideModalEntry, setHideModalEntry] = useState<Entry | null>(null);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

    const selectCategory = (category: CategoryFilter) => {
        setSelectedCategory(category);
        setFocusedIndex(-1);
    };

    // isHidden/isRemoved change identity whenever the underlying hide-rule or
    // removed-entry state changes, so this memo correctly recomputes exactly
    // when the visible set can change.
    const visibleEntries = useMemo(
        () =>
            entries
                .filter((entry) => !isHidden(entry))
                .filter((entry) => !isRemoved(entry.url)),
        [entries, isHidden, isRemoved],
    );

    useEffect(() => {
        if (focusedIndex >= 0) {
            itemRefs.current[focusedIndex]?.scrollIntoView({
                block: "nearest",
            });
        }
    }, [focusedIndex]);

    const handleSelect = (index: number) => {
        const entry = visibleEntries[index];
        if (entry) {
            navigate(entryPath(entry.url));
        }
    };

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
                selected={selectedCategory}
                onSelect={selectCategory}
            />
            <ul>
                {visibleEntries.map((entry, index) => (
                    <EntryRow
                        key={entry.url}
                        entry={entry}
                        focused={index === focusedIndex}
                        isNew={newUrls.has(entry.url)}
                        onSeen={markSeen}
                        onRequestHide={setHideModalEntry}
                        itemRef={(el) => {
                            itemRefs.current[index] = el;
                        }}
                    />
                ))}
            </ul>
            {hideModalEntry && (
                <HideRuleModal
                    initialDomain={new URL(hideModalEntry.url).hostname}
                    initialTitle={hideModalEntry.title}
                    onClose={() => setHideModalEntry(null)}
                />
            )}
        </div>
    );
}
