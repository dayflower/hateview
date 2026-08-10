import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useReducer,
} from "react";
import * as readTrackingStore from "../storage/readTracking";

interface ReadTrackingContextValue {
    isRead: (url: string) => boolean;
    markRead: (url: string) => void;
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

    const value: ReadTrackingContextValue = {
        isRead: (url) => readTrackingStore.isRead(url),
        markRead: (url) => {
            readTrackingStore.markRead(url);
            forceUpdate();
        },
    };

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
