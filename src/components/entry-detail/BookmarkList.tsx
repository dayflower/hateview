import { useMemo } from "react";
import type { HatenaBookmark } from "../../types/bookmark";
import { BookmarkItem } from "./BookmarkItem";

interface BookmarkListProps {
    bookmarks: HatenaBookmark[];
}

export function BookmarkList({ bookmarks }: BookmarkListProps) {
    const sorted = useMemo(
        () =>
            [...bookmarks].sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime(),
            ),
        [bookmarks],
    );

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
                <BookmarkItem key={bookmark.user} bookmark={bookmark} />
            ))}
        </ul>
    );
}
