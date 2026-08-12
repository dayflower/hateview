import {
    Bookmark,
    BookmarkCheck,
    CheckCircle2,
    Circle,
    ExternalLink,
    EyeOff,
    MoreVertical,
    Trash2,
} from "lucide-react";
import { type MouseEvent, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toReadLaterSnapshot } from "../../lib/entry/readLaterSnapshot";
import { useConfirmAction } from "../../lib/hooks/useConfirmAction";
import { useDropdownMenu } from "../../lib/hooks/useDropdownMenu";
import { useReadLater } from "../../lib/hooks/useReadLater.tsx";
import { useReadTracking } from "../../lib/hooks/useReadTracking.tsx";
import { useRemovedEntries } from "../../lib/hooks/useRemovedEntries.tsx";
import { useRowRemoval } from "../../lib/hooks/useRowRemoval";
import { safeExternalUrl } from "../../lib/url/externalUrl";
import { entryPath } from "../../router/routes";
import { navigate } from "../../router/useHashRoute";
import type { Entry } from "../../types/entry";
import { CategoryBadge } from "../common/CategoryBadge";
import { EntrySummary } from "../common/EntrySummary";
import { FaviconImg } from "../common/FaviconImg";
import { IconButton, iconButtonClass } from "../common/IconButton";
import { NewBadge } from "../common/NewBadge";
import { RelativeTime } from "../common/RelativeTime";

const CONFIRM_TIMEOUT_MS = 3000;
const SEEN_VISIBILITY_THRESHOLD = 0.5;
const SEEN_DWELL_MS = 600;

interface EntryRowProps {
    entry: Entry;
    focused?: boolean;
    isNew?: boolean;
    onSeen?: (url: string) => void;
    onRequestHide: (entry: Entry) => void;
    itemRef?: (el: HTMLLIElement | null) => void;
}

export function EntryRow({
    entry,
    focused = false,
    isNew = false,
    onSeen,
    onRequestHide,
    itemRef,
}: EntryRowProps) {
    const { isRead, markRead, markUnread } = useReadTracking();
    const { isMarked, toggle } = useReadLater();
    const { removeEntry } = useRemovedEntries();
    const domain = new URL(entry.url).hostname;
    const read = isRead(entry.url);
    const marked = isMarked(entry.url);

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

    const { confirming: confirmingDelete, trigger: triggerDeleteConfirm } =
        useConfirmAction(triggerRemoval, CONFIRM_TIMEOUT_MS);

    const {
        open: menuOpen,
        position: menuPosition,
        buttonRef: menuButtonRef,
        contentRef: menuContentRef,
        toggle: toggleMenu,
        close: closeMenu,
    } = useDropdownMenu();

    const handleCardClick = () => {
        if (wasDragged()) {
            return;
        }
        navigate(entryPath(entry.url));
    };

    const stop = (event: MouseEvent) => event.stopPropagation();

    const toggleRead = () =>
        read ? markUnread(entry.url) : markRead(entry.url);

    const handleTrashClick = (event: MouseEvent) => {
        stop(event);
        triggerDeleteConfirm();
    };

    const handleMenuTrashClick = (event: MouseEvent) => {
        stop(event);
        if (triggerDeleteConfirm()) {
            closeMenu();
        }
    };

    // Shared between the icon column (small screens) and the overflow menu
    // (sm+): both trigger the same three actions, so the label and the
    // handler are defined once here rather than duplicated per layout.
    const readLaterLabel = marked ? "あとで読むから外す" : "あとで読むに追加";
    const handleReadLater = () => toggle(toReadLaterSnapshot(entry));
    const handleHide = () => onRequestHide(entry);
    const deleteLabel = confirmingDelete
        ? "もう一度クリックして削除を確定"
        : "このエントリーを削除";

    const rowElRef = useRef<HTMLLIElement | null>(null);
    const setLiRef = (el: HTMLLIElement | null) => {
        liRef(el);
        itemRef?.(el);
        rowElRef.current = el;
    };

    // Only the "new" badge should ever cause a URL to be marked seen, and
    // only once it's actually been shown on screen for a moment — not merely
    // fetched. Rows outside the viewport (e.g. further down an unscrolled
    // list) stay "new" until the user actually scrolls to them.
    useEffect(() => {
        if (!isNew || !onSeen || typeof IntersectionObserver === "undefined") {
            return;
        }
        const el = rowElRef.current;
        if (!el) {
            return;
        }
        let dwellTimeoutId: ReturnType<typeof setTimeout> | undefined;
        const observer = new IntersectionObserver(
            ([observerEntry]) => {
                if (observerEntry.isIntersecting) {
                    dwellTimeoutId = setTimeout(() => {
                        onSeen(entry.url);
                    }, SEEN_DWELL_MS);
                } else if (dwellTimeoutId) {
                    clearTimeout(dwellTimeoutId);
                    dwellTimeoutId = undefined;
                }
            },
            { threshold: SEEN_VISIBILITY_THRESHOLD },
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            clearTimeout(dwellTimeoutId);
        };
    }, [isNew, onSeen, entry.url]);

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
                className={`flex w-full flex-wrap items-start gap-3 py-3 transition-opacity duration-300 hover:bg-gray-50 dark:hover:bg-gray-900 ${
                    removing ? "" : "cursor-pointer"
                } ${read ? "opacity-60" : ""} ${
                    focused ? "ring-2 ring-blue-500 ring-inset" : ""
                }`}
            >
                <EntrySummary
                    title={entry.title}
                    description={entry.description}
                    imageUrl={entry.imageUrl}
                    onTitleClick={() => navigate(entryPath(entry.url))}
                    metaRow={
                        <>
                            <span>{entry.bookmarkCount} users</span>
                            <FaviconImg domain={domain} />
                            <span>{domain}</span>
                            {entry.category && (
                                <CategoryBadge category={entry.category} />
                            )}
                            <RelativeTime date={entry.date} />
                            {isNew && <NewBadge />}
                        </>
                    }
                />
                <div className="flex w-full justify-end gap-1 sm:w-auto sm:flex-col">
                    <a
                        href={safeExternalUrl(entry.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="元記事を開く"
                        title="元記事を開く"
                        className={`${iconButtonClass} sm:size-9`}
                        onClick={stop}
                    >
                        <ExternalLink className="size-5" />
                    </a>
                    <IconButton
                        aria-label={read ? "未読に戻す" : "既読にする"}
                        title={read ? "未読に戻す" : "既読にする"}
                        className="sm:size-9"
                        onClick={(event) => {
                            stop(event);
                            toggleRead();
                        }}
                    >
                        {read ? (
                            <CheckCircle2 className="size-5 animate-pop text-blue-600 dark:text-blue-400" />
                        ) : (
                            <Circle className="size-5 animate-pop" />
                        )}
                    </IconButton>
                    <IconButton
                        aria-label={readLaterLabel}
                        title={readLaterLabel}
                        className="sm:hidden"
                        onClick={(event) => {
                            stop(event);
                            handleReadLater();
                        }}
                    >
                        {marked ? (
                            <BookmarkCheck className="size-5 animate-pop text-blue-600 dark:text-blue-400" />
                        ) : (
                            <Bookmark className="size-5 animate-pop" />
                        )}
                    </IconButton>
                    <IconButton
                        aria-label="非表示条件を登録"
                        title="非表示条件を登録"
                        className="sm:hidden"
                        onClick={(event) => {
                            stop(event);
                            handleHide();
                        }}
                    >
                        <EyeOff className="size-5" />
                    </IconButton>
                    <IconButton
                        aria-label={deleteLabel}
                        title={deleteLabel}
                        onClick={handleTrashClick}
                        className={`sm:hidden ${
                            confirmingDelete
                                ? "!bg-red-500 !text-white hover:!bg-red-600"
                                : ""
                        }`}
                    >
                        <Trash2 className="size-5" />
                    </IconButton>
                    <button
                        ref={menuButtonRef}
                        type="button"
                        aria-label="その他の操作"
                        title="その他の操作"
                        aria-expanded={menuOpen}
                        onClick={(event) => {
                            stop(event);
                            toggleMenu();
                        }}
                        className={`hidden sm:flex ${iconButtonClass} sm:size-9`}
                    >
                        <MoreVertical className="size-5" />
                    </button>
                    {menuOpen &&
                        menuPosition &&
                        createPortal(
                            <div
                                ref={menuContentRef}
                                role="menu"
                                style={{
                                    top: menuPosition.top,
                                    right: menuPosition.right,
                                }}
                                className="fixed z-20 w-48 rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-800 dark:bg-gray-900"
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={(event) => {
                                        stop(event);
                                        closeMenu();
                                        handleReadLater();
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    {marked ? (
                                        <BookmarkCheck className="size-4 text-blue-600 dark:text-blue-400" />
                                    ) : (
                                        <Bookmark className="size-4" />
                                    )}
                                    {readLaterLabel}
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={(event) => {
                                        stop(event);
                                        closeMenu();
                                        handleHide();
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <EyeOff className="size-4" />
                                    非表示条件を登録
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleMenuTrashClick}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                        confirmingDelete
                                            ? "text-red-600 dark:text-red-400"
                                            : ""
                                    }`}
                                >
                                    <Trash2 className="size-4" />
                                    {deleteLabel}
                                </button>
                            </div>,
                            document.body,
                        )}
                </div>
            </div>
        </li>
    );
}
