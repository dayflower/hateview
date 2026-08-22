import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import type { BookmarkSource } from "../../types/bookmark";
import {
    readBookmarkSource,
    writeBookmarkSource,
} from "../storage/bookmarkSource";

interface BookmarkSourceContextValue {
    bookmarkSource: BookmarkSource;
    setBookmarkSource: (source: BookmarkSource) => void;
}

const BookmarkSourceContext = createContext<BookmarkSourceContextValue | null>(
    null,
);

export function BookmarkSourceProvider({ children }: { children: ReactNode }) {
    const [bookmarkSource, setBookmarkSourceState] = useState<BookmarkSource>(
        () => readBookmarkSource(),
    );

    const setBookmarkSource = useCallback((next: BookmarkSource) => {
        writeBookmarkSource(next);
        setBookmarkSourceState(next);
    }, []);

    const value = useMemo<BookmarkSourceContextValue>(
        () => ({ bookmarkSource, setBookmarkSource }),
        [bookmarkSource, setBookmarkSource],
    );

    return (
        <BookmarkSourceContext.Provider value={value}>
            {children}
        </BookmarkSourceContext.Provider>
    );
}

export function useBookmarkSource(): BookmarkSourceContextValue {
    const ctx = useContext(BookmarkSourceContext);
    if (!ctx) {
        throw new Error(
            "useBookmarkSource must be used within BookmarkSourceProvider",
        );
    }
    return ctx;
}
