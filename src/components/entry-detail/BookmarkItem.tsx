import { Eye, EyeOff, Star } from "lucide-react";
import { useConfirmAction } from "../../lib/hooks/useConfirmAction";
import { useHiddenUsers } from "../../lib/hooks/useHiddenUsers.tsx";
import type { HatenaBookmark } from "../../types/bookmark";
import { LinkifiedText } from "../common/LinkifiedText";
import { RelativeTime } from "../common/RelativeTime";
import { UserAvatar } from "../common/UserAvatar";

const CONFIRM_TIMEOUT_MS = 3000;

interface BookmarkItemProps {
    bookmark: HatenaBookmark;
    starCount?: number;
}

export function BookmarkItem({ bookmark, starCount }: BookmarkItemProps) {
    const { isUserHidden, addHiddenUser, removeHiddenUser } = useHiddenUsers();
    const hidden = isUserHidden(bookmark.user);
    const { confirming, trigger } = useConfirmAction(
        () => addHiddenUser(bookmark.user),
        CONFIRM_TIMEOUT_MS,
    );

    return (
        <li
            className={`flex gap-2 border-gray-200 border-b py-3 dark:border-gray-800 ${
                hidden ? "opacity-50" : ""
            }`}
        >
            <UserAvatar user={bookmark.user} />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        {bookmark.user}
                    </span>
                    <span className="text-gray-500 text-xs dark:text-gray-400">
                        <RelativeTime date={bookmark.timestamp} />
                    </span>
                    {!!starCount && (
                        <span className="inline-flex items-center gap-0.5 text-amber-600 text-xs dark:text-amber-400">
                            <Star className="size-3 fill-current" />
                            {starCount}
                        </span>
                    )}
                    {hidden ? (
                        <button
                            type="button"
                            onClick={() => removeHiddenUser(bookmark.user)}
                            className="ml-auto inline-flex items-center gap-0.5 self-center text-gray-500 text-xs hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        >
                            <Eye className="size-3.5" />
                            非表示を解除
                        </button>
                    ) : (
                        <button
                            type="button"
                            aria-label={
                                confirming
                                    ? "もう一度クリックしてこのユーザーを非表示"
                                    : "このユーザーを非表示"
                            }
                            onClick={trigger}
                            className={`ml-auto inline-flex items-center gap-0.5 self-center text-xs ${
                                confirming
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            }`}
                        >
                            <EyeOff className="size-3.5" />
                            {confirming && "もう一度押すと非表示"}
                        </button>
                    )}
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
