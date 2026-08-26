import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

interface HideReadContextValue {
    hideRead: boolean;
    toggleHideRead: () => void;
}

const HideReadContext = createContext<HideReadContextValue | null>(null);

/** Whether already-read entries are filtered out of the list. Unlike the other
 *  client-side state, this is deliberately kept in memory only: it is a
 *  momentary view filter, so it should start off again on a fresh load rather
 *  than silently keep hiding entries days later. */
export function HideReadProvider({ children }: { children: ReactNode }) {
    const [hideRead, setHideRead] = useState(false);

    const toggleHideRead = useCallback(() => setHideRead((prev) => !prev), []);

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
