import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import * as readTrackingStore from "../storage/readTracking";

interface ReadTrackingContextValue {
    isRead: (url: string) => boolean;
    markRead: (url: string) => void;
    markUnread: (url: string) => void;
}

const ReadTrackingContext = createContext<ReadTrackingContextValue | null>(
    null,
);

export function ReadTrackingProvider({ children }: { children: ReactNode }) {
    const [readUrls, setReadUrls] = useState<ReadonlySet<string>>(() => {
        readTrackingStore.pruneOldReadRecords();
        return readTrackingStore.listReadUrls();
    });

    // A visible tab may be stale relative to changes another tab made to the
    // same localStorage keys, so re-sync the in-memory mirror on return.
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                readTrackingStore.pruneOldReadRecords();
                setReadUrls(readTrackingStore.listReadUrls());
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () =>
            document.removeEventListener(
                "visibilitychange",
                onVisibilityChange,
            );
    }, []);

    // markRead/markUnread keep a stable identity across renders (empty deps) so
    // effects that depend on them (e.g. EntryDetailPage's fetch effect) don't
    // re-fire on every provider re-render.
    const markRead = useCallback((url: string) => {
        readTrackingStore.markRead(url);
        setReadUrls((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));
    }, []);
    const markUnread = useCallback((url: string) => {
        readTrackingStore.markUnread(url);
        setReadUrls((prev) => {
            if (!prev.has(url)) {
                return prev;
            }
            const next = new Set(prev);
            next.delete(url);
            return next;
        });
    }, []);

    const isRead = useCallback((url: string) => readUrls.has(url), [readUrls]);

    const value = useMemo<ReadTrackingContextValue>(
        () => ({ isRead, markRead, markUnread }),
        [isRead, markRead, markUnread],
    );

    return (
        <ReadTrackingContext.Provider value={value}>
            {children}
        </ReadTrackingContext.Provider>
    );
}

export function useReadTracking(): ReadTrackingContextValue {
    const ctx = useContext(ReadTrackingContext);
    if (!ctx) {
        throw new Error(
            "useReadTracking must be used within ReadTrackingProvider",
        );
    }
    return ctx;
}
