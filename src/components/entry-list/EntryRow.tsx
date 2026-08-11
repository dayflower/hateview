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
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
    onRequestHide: (entry: Entry) => void;
    itemRef?: (el: HTMLLIElement | null) => void;
}

export function EntryRow({
    entry,
    focused = false,
    isNew = false,
    onRequestHide,
    itemRef,
}: EntryRowProps) {
    const { isRead, markRead, markUnread } = useReadTracking();
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

    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{
        top: number;
        right: number;
    } | null>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const menuContentRef = useRef<HTMLDivElement>(null);

    const openMenu = () => {
        const rect = menuButtonRef.current?.getBoundingClientRect();
        if (rect) {
            setMenuPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right,
            });
        }
        setMenuOpen(true);
    };

    // The row's <li> clips overflow for the swipe-to-delete animation, so the
    // dropdown is portaled to <body> and fixed-positioned instead of nested inside it.
    useEffect(() => {
        if (!menuOpen) {
            return;
        }
        const closeMenu = (event: Event) => {
            const target = event.target as Node;
            if (menuButtonRef.current?.contains(target)) {
                return;
            }
            if (menuContentRef.current?.contains(target)) {
                return;
            }
            setMenuOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", closeMenu);
        document.addEventListener("keydown", closeOnEscape);
        window.addEventListener("scroll", closeMenu, true);
        return () => {
            document.removeEventListener("mousedown", closeMenu);
            document.removeEventListener("keydown", closeOnEscape);
            window.removeEventListener("scroll", closeMenu, true);
        };
    }, [menuOpen]);

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

    const toggleRead = () =>
        read ? markUnread(entry.url) : markRead(entry.url);

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
                        {entry.category && (
                            <CategoryBadge category={entry.category} />
                        )}
                        <RelativeTime date={entry.date} />
                        {isNew && <NewBadge />}
                    </div>
                </div>
                <div className="flex w-full justify-end gap-1 sm:w-auto sm:flex-col">
                    <IconButton
                        aria-label={
                            marked ? "あとで読むから外す" : "あとで読むに追加"
                        }
                        className="sm:size-9"
                        onClick={(event) => {
                            stop(event);
                            toggle({
                                url: entry.url,
                                title: entry.title,
                                description: entry.description,
                                imageUrl: entry.imageUrl,
                                bookmarkCount: entry.bookmarkCount,
                                category: entry.category,
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
                        className={`${iconButtonClass} sm:size-9`}
                        onClick={stop}
                    >
                        <ExternalLink className="size-5" />
                    </a>
                    <IconButton
                        aria-label={read ? "未読に戻す" : "既読にする"}
                        className="sm:hidden"
                        onClick={(event) => {
                            stop(event);
                            toggleRead();
                        }}
                    >
                        {read ? (
                            <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                            <Circle className="size-5" />
                        )}
                    </IconButton>
                    <IconButton
                        aria-label="非表示条件を登録"
                        className="sm:hidden"
                        onClick={(event) => {
                            stop(event);
                            onRequestHide(entry);
                        }}
                    >
                        <EyeOff className="size-5" />
                    </IconButton>
                    <IconButton
                        aria-label={
                            confirmingDelete
                                ? "もう一度クリックして削除を確定"
                                : "このエントリーを削除"
                        }
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
                        aria-expanded={menuOpen}
                        onClick={(event) => {
                            stop(event);
                            if (menuOpen) {
                                setMenuOpen(false);
                            } else {
                                openMenu();
                            }
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
                                        setMenuOpen(false);
                                        toggleRead();
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    {read ? (
                                        <CheckCircle2 className="size-4" />
                                    ) : (
                                        <Circle className="size-4" />
                                    )}
                                    {read ? "未読に戻す" : "既読にする"}
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={(event) => {
                                        stop(event);
                                        setMenuOpen(false);
                                        onRequestHide(entry);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <EyeOff className="size-4" />
                                    非表示条件を登録
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={(event) => {
                                        const wasConfirming = confirmingDelete;
                                        handleTrashClick(event);
                                        if (wasConfirming) {
                                            setMenuOpen(false);
                                        }
                                    }}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                        confirmingDelete
                                            ? "text-red-600 dark:text-red-400"
                                            : ""
                                    }`}
                                >
                                    <Trash2 className="size-4" />
                                    {confirmingDelete
                                        ? "もう一度クリックして削除を確定"
                                        : "このエントリーを削除"}
                                </button>
                            </div>,
                            document.body,
                        )}
                </div>
            </div>
        </li>
    );
}
