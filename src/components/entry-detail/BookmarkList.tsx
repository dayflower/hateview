import { useMemo } from "react";
import type { HatenaBookmark } from "../../types/bookmark";
import { BookmarkItem } from "./BookmarkItem";

export type BookmarkSortOrder = "new" | "star";

interface BookmarkListProps {
    bookmarks: HatenaBookmark[];
    stars: Record<string, number>;
    sortOrder: BookmarkSortOrder;
}

export function BookmarkList({
    bookmarks,
    stars,
    sortOrder,
}: BookmarkListProps) {
    const sorted = useMemo(() => {
        const byTimestampDesc = (a: HatenaBookmark, b: HatenaBookmark) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

        if (sortOrder === "star") {
            return [...bookmarks].sort(
                (a, b) =>
                    (stars[b.user] ?? 0) - (stars[a.user] ?? 0) ||
                    byTimestampDesc(a, b),
            );
        }
        return [...bookmarks].sort(byTimestampDesc);
    }, [bookmarks, stars, sortOrder]);

    if (sorted.length === 0) {
        return (
            <p className="text-gray-500 dark:text-gray-400">
                まだブックマークがありません。
            </p>
        );
    }

    return (
        <ul>
            {sorted.map((bookmark) => (
                <BookmarkItem
                    key={bookmark.user}
                    bookmark={bookmark}
                    starCount={stars[bookmark.user]}
                />
            ))}
        </ul>
    );
}
