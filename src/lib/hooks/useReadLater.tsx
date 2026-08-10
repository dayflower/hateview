import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useState,
} from "react";
import type { ReadLaterEntry, ReadLaterSnapshot } from "../storage/readLater";
import * as readLaterStore from "../storage/readLater";

interface ReadLaterContextValue {
    entries: ReadLaterEntry[];
    isMarked: (url: string) => boolean;
    toggle: (snapshot: ReadLaterSnapshot) => void;
    remove: (url: string) => void;
}

const ReadLaterContext = createContext<ReadLaterContextValue | null>(null);

export function ReadLaterProvider({ children }: { children: ReactNode }) {
    const [entries, setEntries] = useState<ReadLaterEntry[]>(() =>
        readLaterStore.list(),
    );

    // Stable identities (empty deps) so effects/memos that depend on these functions
    // don't re-run on every provider re-render.
    const toggle = useCallback((snapshot: ReadLaterSnapshot) => {
        readLaterStore.toggle(snapshot);
        setEntries(readLaterStore.list());
    }, []);

    const remove = useCallback((url: string) => {
        readLaterStore.remove(url);
        setEntries(readLaterStore.list());
    }, []);

    // `entries` changing already gives the provider's context `value` object a new
    // identity each mutation, which is what causes consumers to re-render; `isMarked`
    // itself can stay referentially stable and just read fresh state when called.
    const isMarked = useCallback(
        (url: string) => readLaterStore.isMarked(url),
        [],
    );

    const value: ReadLaterContextValue = { entries, isMarked, toggle, remove };

    return (
        <ReadLaterContext.Provider value={value}>
            {children}
        </ReadLaterContext.Provider>
    );
}

export function useReadLater(): ReadLaterContextValue {
    const ctx = useContext(ReadLaterContext);
    if (!ctx) {
        throw new Error("useReadLater must be used within ReadLaterProvider");
    }
    return ctx;
}
