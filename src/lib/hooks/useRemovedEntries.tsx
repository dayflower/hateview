import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useReducer,
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
    const [, forceUpdate] = useReducer((count: number) => count + 1, 0);

    useEffect(() => {
        removedEntriesStore.pruneOldRemovedRecords();
    }, []);

    // Stable identities (empty deps) so effects/memos elsewhere don't re-run on every
    // provider re-render — see useReadTracking.tsx for why this matters.
    const isRemoved = useCallback(
        (url: string) => removedEntriesStore.isRemoved(url),
        [],
    );
    const removeEntry = useCallback((url: string) => {
        removedEntriesStore.removeEntry(url);
        forceUpdate();
    }, []);

    const value: RemovedEntriesContextValue = { isRemoved, removeEntry };

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
