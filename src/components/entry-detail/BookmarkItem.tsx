import type { HatenaBookmark } from "../../types/bookmark";
import { LinkifiedText } from "../common/LinkifiedText";
import { RelativeTime } from "../common/RelativeTime";
import { UserAvatar } from "../common/UserAvatar";

interface BookmarkItemProps {
    bookmark: HatenaBookmark;
}

export function BookmarkItem({ bookmark }: BookmarkItemProps) {
    return (
        <li className="flex gap-2 border-gray-200 border-b py-3 dark:border-gray-800">
            <UserAvatar user={bookmark.user} />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        {bookmark.user}
                    </span>
                    <span className="text-gray-500 text-xs dark:text-gray-400">
                        <RelativeTime date={bookmark.timestamp} />
                    </span>
                </div>
                {bookmark.comment && (
                    <p className="mt-1 text-gray-900 text-sm dark:text-gray-100">
                        <LinkifiedText text={bookmark.comment} />
                    </p>
                )}
                {bookmark.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {bookmark.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded bg-gray-200 px-1.5 py-0.5 text-gray-700 text-xs dark:bg-gray-700 dark:text-gray-200"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </li>
    );
}
