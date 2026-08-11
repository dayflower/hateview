import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useReducer,
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
    const [, forceUpdate] = useReducer((count: number) => count + 1, 0);

    useEffect(() => {
        readTrackingStore.pruneOldReadRecords();
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                readTrackingStore.pruneOldReadRecords();
                forceUpdate();
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () =>
            document.removeEventListener(
                "visibilitychange",
                onVisibilityChange,
            );
    }, []);

    // isRead/markRead keep a stable identity across renders (empty deps) so effects
    // that depend on them (e.g. EntryDetailPage's fetch effect) don't re-fire on every
    // provider re-render — only forceUpdate() should trigger consumers to re-read state.
    const isRead = useCallback(
        (url: string) => readTrackingStore.isRead(url),
        [],
    );
    const markRead = useCallback((url: string) => {
        if (readTrackingStore.isRead(url)) {
            return;
        }
        readTrackingStore.markRead(url);
        forceUpdate();
    }, []);
    const markUnread = useCallback((url: string) => {
        if (!readTrackingStore.isRead(url)) {
            return;
        }
        readTrackingStore.markUnread(url);
        forceUpdate();
    }, []);

    const value: ReadTrackingContextValue = { isRead, markRead, markUnread };

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
