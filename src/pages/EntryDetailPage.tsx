import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { BookmarkList } from "../components/entry-detail/BookmarkList";
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
    const [state, setState] = useState<DetailState>({
        data: null,
        loading: true,
        error: null,
    });

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

    return (
        <div className="mx-auto max-w-2xl p-4">
            <h1 className="font-semibold text-lg">{state.data.title}</h1>
            <p className="mt-1 text-gray-500 text-sm">
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
            </div>
            <div className="mt-4">
                <BookmarkList bookmarks={state.data.bookmarks} />
            </div>
        </div>
    );
}
