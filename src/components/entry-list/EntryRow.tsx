import { Bookmark, BookmarkCheck, ExternalLink, Trash2 } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useReadLater } from "../../lib/hooks/useReadLater.tsx";
import { useReadTracking } from "../../lib/hooks/useReadTracking.tsx";
import { useRemovedEntries } from "../../lib/hooks/useRemovedEntries.tsx";
import { useRowRemoval } from "../../lib/hooks/useRowRemoval";
import { entryPath } from "../../router/routes";
import { navigate } from "../../router/useHashRoute";
import type { Entry } from "../../types/entry";
import { CategoryBadge } from "../common/CategoryBadge";
import { FaviconImg } from "../common/FaviconImg";
import { IconButton, iconButtonClass } from "../common/IconButton";
import { NewBadge } from "../common/NewBadge";
import { RelativeTime } from "../common/RelativeTime";
import { Thumbnail } from "../common/Thumbnail";

const CONFIRM_TIMEOUT_MS = 3000;

interface EntryRowProps {
    entry: Entry;
    focused?: boolean;
    isNew?: boolean;
    itemRef?: (el: HTMLLIElement | null) => void;
}

export function EntryRow({
    entry,
    focused = false,
    isNew = false,
    itemRef,
}: EntryRowProps) {
    const { isRead } = useReadTracking();
    const { isMarked, toggle } = useReadLater();
    const { removeEntry } = useRemovedEntries();
    const domain = new URL(entry.url).hostname;
    const read = isRead(entry.url);
    const marked = isMarked(entry.url);

    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    useEffect(() => () => clearTimeout(confirmTimeoutRef.current), []);

    const {
        liRef,
        liStyle,
        dragX,
        dragging,
        removing,
        wasDragged,
        dragHandlers,
        triggerRemoval,
    } = useRowRemoval({
        onRemove: () => removeEntry(entry.url),
    });

    const handleCardClick = () => {
        if (wasDragged()) {
            return;
        }
        navigate(entryPath(entry.url));
    };

    const stop = (event: MouseEvent) => event.stopPropagation();

    const handleTrashClick = (event: MouseEvent) => {
        stop(event);
        if (confirmingDelete) {
            clearTimeout(confirmTimeoutRef.current);
            triggerRemoval();
            return;
        }
        setConfirmingDelete(true);
        confirmTimeoutRef.current = setTimeout(
            () => setConfirmingDelete(false),
            CONFIRM_TIMEOUT_MS,
        );
    };

    const setLiRef = (el: HTMLLIElement | null) => {
        liRef(el);
        itemRef?.(el);
    };

    return (
        <li
            ref={setLiRef}
            style={liStyle}
            className="relative overflow-hidden border-gray-200 border-b dark:border-gray-800"
        >
            <div
                className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500"
                style={{ width: Math.abs(dragX) }}
            >
                <Trash2 className="size-6 text-white" />
            </div>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: the title button above provides an equivalent keyboard/screen-reader accessible action; this is a mouse/touch convenience layer */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: same as above */}
            <div
                {...dragHandlers}
                onClick={handleCardClick}
                style={{
                    transform: `translateX(${dragX}px)`,
                    transition: dragging ? "none" : "transform 0.2s ease-out",
                }}
                className={`flex w-full flex-wrap items-start gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 ${
                    removing ? "" : "cursor-pointer"
                } ${read ? "opacity-50" : ""} ${
                    focused ? "ring-2 ring-blue-500 ring-inset" : ""
                }`}
            >
                <Thumbnail src={entry.imageUrl} />
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={() => navigate(entryPath(entry.url))}
                        className="block text-left font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                        {entry.title}
                    </button>
                    {entry.description && (
                        <p className="mt-1 line-clamp-2 text-gray-500 text-sm dark:text-gray-400">
                            {entry.description}
                        </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
                        <span>{entry.bookmarkCount} users</span>
                        <FaviconImg domain={domain} />
                        <span>{domain}</span>
                        {entry.categories.map((category) => (
                            <CategoryBadge key={category} category={category} />
                        ))}
                        <RelativeTime date={entry.date} />
                        {isNew && <NewBadge />}
                    </div>
                </div>
                <div className="flex w-full justify-end gap-1 sm:w-auto">
                    <IconButton
                        aria-label={
                            marked ? "あとで読むから外す" : "あとで読むに追加"
                        }
                        onClick={(event) => {
                            stop(event);
                            toggle({
                                url: entry.url,
                                title: entry.title,
                                description: entry.description,
                                imageUrl: entry.imageUrl,
                                bookmarkCount: entry.bookmarkCount,
                                categories: entry.categories,
                                tags: entry.tags,
                            });
                        }}
                    >
                        {marked ? (
                            <BookmarkCheck className="size-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                            <Bookmark className="size-5" />
                        )}
                    </IconButton>
                    <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="元記事を開く"
                        className={iconButtonClass}
                        onClick={stop}
                    >
                        <ExternalLink className="size-5" />
                    </a>
                    <IconButton
                        aria-label={
                            confirmingDelete
                                ? "もう一度クリックして削除を確定"
                                : "このエントリーを削除"
                        }
                        onClick={handleTrashClick}
                        className={
                            confirmingDelete
                                ? "!bg-red-500 !text-white hover:!bg-red-600"
                                : ""
                        }
                    >
                        <Trash2 className="size-5" />
                    </IconButton>
                </div>
            </div>
        </li>
    );
}
