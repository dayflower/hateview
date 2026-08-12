import {
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    ExternalLink,
    EyeOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CategoryBadge } from "../components/common/CategoryBadge";
import { HideRuleModal } from "../components/common/HideRuleModal";
import { Thumbnail } from "../components/common/Thumbnail";
import { BookmarkList } from "../components/entry-detail/BookmarkList";
import { findCachedEntry } from "../lib/hooks/useEntries";
import { useReadLater } from "../lib/hooks/useReadLater.tsx";
import { useReadTracking } from "../lib/hooks/useReadTracking.tsx";
import {
    bookmarkEntryPageUrl,
    fetchEntryJsonlite,
} from "../lib/jsonp/hatenaBookmarkApi";
import {
    readHideNoComment,
    writeHideNoComment,
} from "../lib/storage/hideNoComment";
import type { HatenaJsonliteResponse } from "../types/bookmark";

interface EntryDetailPageProps {
    url: string;
}

interface DetailState {
    data: HatenaJsonliteResponse | null;
    loading: boolean;
    error: string | null;
}

export function EntryDetailPage({ url }: EntryDetailPageProps) {
    const { markRead } = useReadTracking();
    const { isMarked, toggle } = useReadLater();
    const [state, setState] = useState<DetailState>({
        data: null,
        loading: true,
        error: null,
    });
    const [hideNoComment, setHideNoComment] = useState(readHideNoComment);
    const [hideModalOpen, setHideModalOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setState({ data: null, loading: true, error: null });

        fetchEntryJsonlite(url)
            .then((data) => {
                if (!cancelled) {
                    setState({ data, loading: false, error: null });
                    markRead(url);
                }
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setState({
                        data: null,
                        loading: false,
                        error: err instanceof Error ? err.message : String(err),
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [url, markRead]);

    if (state.loading) {
        return (
            <p className="p-4 text-gray-500 dark:text-gray-400">
                読み込み中...
            </p>
        );
    }
    if (state.error || !state.data) {
        return (
            <p className="p-4 text-red-600 dark:text-red-400">
                読み込みに失敗しました: {state.error}
            </p>
        );
    }

    const marked = isMarked(url);
    const domain = new URL(url).hostname;
    // Hatena's per-entry bookmark API doesn't return category/description/
    // image, so fall back to the list API's data for this URL, if it was
    // already fetched this session (e.g. via the entry list).
    const cachedEntry = findCachedEntry(url);
    const bookmarks = hideNoComment
        ? state.data.bookmarks.filter(
              (bookmark) => bookmark.comment.trim() !== "",
          )
        : state.data.bookmarks;

    return (
        <div className="mx-auto max-w-2xl p-4">
            <button
                type="button"
                onClick={() => window.history.back()}
                className="mb-2 inline-flex items-center gap-1 text-blue-700 text-sm hover:underline dark:text-blue-400"
            >
                <ArrowLeft className="size-4" />
                戻る
            </button>
            <div className="flex items-start justify-between gap-2">
                <h1 className="font-semibold text-gray-900 text-lg dark:text-gray-100">
                    {state.data.title}
                </h1>
                <button
                    type="button"
                    aria-label={
                        marked ? "あとで読むから外す" : "あとで読むに追加"
                    }
                    onClick={() =>
                        toggle({ url, title: state.data?.title ?? url })
                    }
                    className="flex shrink-0 items-center gap-1 rounded border border-gray-300 px-2 py-1 text-gray-700 text-sm transition-[background-color,border-color,color,transform] duration-150 ease-out hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-95 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
                >
                    {marked ? (
                        <BookmarkCheck className="size-4 animate-pop text-blue-600 dark:text-blue-400" />
                    ) : (
                        <Bookmark className="size-4 animate-pop" />
                    )}
                    あとで読む
                </button>
            </div>
            <p className="mt-1 font-bold text-rose-500 text-sm dark:text-rose-400">
                {state.data.count} users
            </p>
            {cachedEntry && (
                <div className="mt-3 flex gap-3">
                    <Thumbnail src={cachedEntry.imageUrl} />
                    <div className="min-w-0 flex-1">
                        {cachedEntry.description && (
                            <p className="text-gray-600 text-sm dark:text-gray-400">
                                {cachedEntry.description}
                            </p>
                        )}
                        {cachedEntry.category && (
                            <div className="mt-1.5">
                                <CategoryBadge
                                    category={cachedEntry.category}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline dark:text-blue-400"
                >
                    元記事を開く
                    <ExternalLink className="size-4" />
                </a>
                <a
                    href={bookmarkEntryPageUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline dark:text-blue-400"
                >
                    本家のブクマページを開く
                    <ExternalLink className="size-4" />
                </a>
                <button
                    type="button"
                    onClick={() => setHideModalOpen(true)}
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline dark:text-blue-400"
                >
                    <EyeOff className="size-4" />
                    非表示条件を登録
                </button>
            </div>
            <label className="mt-3 flex w-fit items-center gap-1.5 text-gray-700 text-sm dark:text-gray-300">
                <span className="-m-1 rounded p-1 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/60">
                    <input
                        type="checkbox"
                        checked={hideNoComment}
                        onChange={(event) => {
                            setHideNoComment(event.target.checked);
                            writeHideNoComment(event.target.checked);
                        }}
                        className="block size-4 cursor-pointer accent-blue-600 transition-transform duration-150 active:scale-90"
                    />
                </span>
                コメントのない人を隠す
            </label>
            <div className="mt-4">
                <BookmarkList bookmarks={bookmarks} />
            </div>
            {hideModalOpen && (
                <HideRuleModal
                    initialDomain={domain}
                    initialTitle={state.data.title}
                    onClose={() => setHideModalOpen(false)}
                />
            )}
        </div>
    );
}
