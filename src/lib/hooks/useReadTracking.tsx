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

/** How many unread→read transitions the undo button can walk back. */
export const UNDO_HISTORY_LIMIT = 20;

export interface ReadUndoItem {
    url: string;
    title?: string;
}

/** Identifies one completed undo, so a listener can react to each undo
 *  exactly once even when the same url is restored twice in a row. */
export interface RestoredRead {
    url: string;
    seq: number;
}

interface ReadTrackingContextValue {
    isRead: (url: string) => boolean;
    /** `title` is only used to label the undo button. */
    markRead: (url: string, title?: string) => void;
    markUnread: (url: string) => void;
    /** The entry the next `undoLastRead` would restore, if any. */
    nextUndo: ReadUndoItem | null;
    /** Reverts the most recent unread→read transition still in effect. */
    undoLastRead: () => void;
    lastRestored: RestoredRead | null;
}

const ReadTrackingContext = createContext<ReadTrackingContextValue | null>(
    null,
);

export function ReadTrackingProvider({ children }: { children: ReactNode }) {
    const [readUrls, setReadUrls] = useState<ReadonlySet<string>>(() => {
        readTrackingStore.pruneOldReadRecords();
        return readTrackingStore.listReadUrls();
    });
    // In-memory only: undo is a "take back what I just did" affordance, not
    // durable data, so it intentionally resets on reload.
    const [undoHistory, setUndoHistory] = useState<readonly ReadUndoItem[]>([]);
    const [lastRestored, setLastRestored] = useState<RestoredRead | null>(null);

    // A visible tab may be stale relative to changes another tab made to the
    // same localStorage keys, so re-sync the in-memory mirror on return.
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                readTrackingStore.pruneOldReadRecords();
                const urls = readTrackingStore.listReadUrls();
                setReadUrls(urls);
                // Drop undo targets another tab already made unread, so the
                // button never offers an undo that would visibly do nothing.
                setUndoHistory((prev) => {
                    const next = prev.filter((item) => urls.has(item.url));
                    return next.length === prev.length ? prev : next;
                });
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
    const markRead = useCallback((url: string, title?: string) => {
        // Checked against storage rather than the React state so that this
        // stays dependency-free; only a real unread→read transition is
        // worth undoing.
        const wasRead = readTrackingStore.isRead(url);
        readTrackingStore.markRead(url);
        setReadUrls((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));
        if (!wasRead) {
            setUndoHistory((prev) =>
                [...prev, { url, title }].slice(-UNDO_HISTORY_LIMIT),
            );
        }
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
        setUndoHistory((prev) => {
            const next = prev.filter((item) => item.url !== url);
            return next.length === prev.length ? prev : next;
        });
    }, []);

    const nextUndo = undoHistory.at(-1) ?? null;

    const undoLastRead = useCallback(() => {
        if (!nextUndo) {
            return;
        }
        markUnread(nextUndo.url);
        setLastRestored((prev) => ({
            url: nextUndo.url,
            seq: (prev?.seq ?? 0) + 1,
        }));
    }, [nextUndo, markUnread]);

    const isRead = useCallback((url: string) => readUrls.has(url), [readUrls]);

    const value = useMemo<ReadTrackingContextValue>(
        () => ({
            isRead,
            markRead,
            markUnread,
            nextUndo,
            undoLastRead,
            lastRestored,
        }),
        [isRead, markRead, markUnread, nextUndo, undoLastRead, lastRestored],
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
