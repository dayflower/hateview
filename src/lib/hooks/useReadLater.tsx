import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
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

    // Derived from the already-in-memory `entries`, rather than re-reading
    // localStorage on every call.
    const markedUrls = useMemo(
        () => new Set(entries.map((entry) => entry.url)),
        [entries],
    );
    const isMarked = useCallback(
        (url: string) => markedUrls.has(url),
        [markedUrls],
    );

    const value = useMemo<ReadLaterContextValue>(
        () => ({ entries, isMarked, toggle, remove }),
        [entries, isMarked, toggle, remove],
    );

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
