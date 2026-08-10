import { Bookmark, BookmarkCheck, ExternalLink, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { HideRuleModal } from "../components/common/HideRuleModal";
import { BookmarkList } from "../components/entry-detail/BookmarkList";
import { useReadLater } from "../lib/hooks/useReadLater.tsx";
import { useReadTracking } from "../lib/hooks/useReadTracking.tsx";
import {
    bookmarkEntryPageUrl,
    fetchEntryJsonlite,
} from "../lib/jsonp/hatenaBookmarkApi";
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
    const [hideNoComment, setHideNoComment] = useState(false);
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
        return <p className="p-4 text-gray-500">読み込み中...</p>;
    }
    if (state.error || !state.data) {
        return (
            <p className="p-4 text-red-600">
                読み込みに失敗しました: {state.error}
            </p>
        );
    }

    const marked = isMarked(url);
    const domain = new URL(url).hostname;
    const bookmarks = hideNoComment
        ? state.data.bookmarks.filter(
              (bookmark) => bookmark.comment.trim() !== "",
          )
        : state.data.bookmarks;

    return (
        <div className="mx-auto max-w-2xl p-4">
            <div className="flex items-start justify-between gap-2">
                <h1 className="font-semibold text-lg">{state.data.title}</h1>
                <button
                    type="button"
                    aria-label={
                        marked ? "あとで読むから外す" : "あとで読むに追加"
                    }
                    onClick={() =>
                        toggle({ url, title: state.data?.title ?? url })
                    }
                    className="flex shrink-0 items-center gap-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700"
                >
                    {marked ? (
                        <BookmarkCheck className="size-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                        <Bookmark className="size-4" />
                    )}
                    あとで読む
                </button>
            </div>
            <p className="mt-1 font-bold text-rose-500 text-sm dark:text-rose-400">
                {state.data.count} users
            </p>
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
            <label className="mt-3 flex items-center gap-1.5 text-sm">
                <input
                    type="checkbox"
                    checked={hideNoComment}
                    onChange={(event) => setHideNoComment(event.target.checked)}
                    className="size-4"
                />
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
