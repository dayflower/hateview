import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import { readHideRead, writeHideRead } from "../storage/hideRead";

interface HideReadContextValue {
    hideRead: boolean;
    toggleHideRead: () => void;
}

const HideReadContext = createContext<HideReadContextValue | null>(null);

/** Whether already-read entries are filtered out of the list. Kept in
 *  sessionStorage rather than localStorage: it should survive the app's own
 *  reload button (and an ordinary browser reload, which uses the same tab)
 *  so re-reading the feed doesn't silently unhide read entries, but it
 *  should still start off again in a new tab rather than keep hiding entries
 *  days later. */
export function HideReadProvider({ children }: { children: ReactNode }) {
    const [hideRead, setHideRead] = useState(readHideRead);

    const toggleHideRead = useCallback(() => {
        setHideRead((prev) => {
            const next = !prev;
            writeHideRead(next);
            return next;
        });
    }, []);

    const value = useMemo<HideReadContextValue>(
        () => ({ hideRead, toggleHideRead }),
        [hideRead, toggleHideRead],
    );

    return (
        <HideReadContext.Provider value={value}>
            {children}
        </HideReadContext.Provider>
    );
}

export function useHideRead(): HideReadContextValue {
    const ctx = useContext(HideReadContext);
    if (!ctx) {
        throw new Error("useHideRead must be used within HideReadProvider");
    }
    return ctx;
}
