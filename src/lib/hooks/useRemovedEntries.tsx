import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import * as removedEntriesStore from "../storage/removedEntries";

interface RemovedEntriesContextValue {
    isRemoved: (url: string) => boolean;
    removeEntry: (url: string) => void;
}

const RemovedEntriesContext = createContext<RemovedEntriesContextValue | null>(
    null,
);

export function RemovedEntriesProvider({ children }: { children: ReactNode }) {
    const [removedUrls, setRemovedUrls] = useState<ReadonlySet<string>>(() => {
        removedEntriesStore.pruneOldRemovedRecords();
        return removedEntriesStore.listRemovedUrls();
    });

    // removeEntry keeps a stable identity across renders (empty deps) — see
    // useReadTracking.tsx for why this matters.
    const removeEntry = useCallback((url: string) => {
        removedEntriesStore.removeEntry(url);
        setRemovedUrls((prev) =>
            prev.has(url) ? prev : new Set(prev).add(url),
        );
    }, []);

    const isRemoved = useCallback(
        (url: string) => removedUrls.has(url),
        [removedUrls],
    );

    const value = useMemo<RemovedEntriesContextValue>(
        () => ({ isRemoved, removeEntry }),
        [isRemoved, removeEntry],
    );

    return (
        <RemovedEntriesContext.Provider value={value}>
            {children}
        </RemovedEntriesContext.Provider>
    );
}

export function useRemovedEntries(): RemovedEntriesContextValue {
    const ctx = useContext(RemovedEntriesContext);
    if (!ctx) {
        throw new Error(
            "useRemovedEntries must be used within RemovedEntriesProvider",
        );
    }
    return ctx;
}
