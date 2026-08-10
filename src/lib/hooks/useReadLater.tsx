import { createContext, type ReactNode, useContext, useState } from "react";
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

    const toggle = (snapshot: ReadLaterSnapshot) => {
        readLaterStore.toggle(snapshot);
        setEntries(readLaterStore.list());
    };

    const remove = (url: string) => {
        readLaterStore.remove(url);
        setEntries(readLaterStore.list());
    };

    const isMarked = (url: string) =>
        entries.some((entry) => entry.url === url);

    return (
        <ReadLaterContext.Provider
            value={{ entries, isMarked, toggle, remove }}
        >
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
