import { useCallback, useEffect, useState } from "react";
import type { Entry, FeedId } from "../../types/entry";
import { apiGet } from "../api/apiClient";
import {
    getNewUrls,
    markUrlSeen,
    pruneOldSeenRecords,
} from "../storage/seenEntries";

interface FetchState {
    entries: Entry[];
    newUrls: Set<string>;
    loading: boolean;
    error: string | null;
}

interface EntriesState extends FetchState {
    /** Records a single entry URL as seen (e.g. once it's actually been
     *  shown to the user for a moment, not merely fetched). This only
     *  affects `newUrls` the *next* time this feed is fetched (typically a
     *  full page reload) — the currently displayed `newUrls`, and thus the
     *  "new" badge, never changes as a result of calling this within the
     *  same session. */
    markSeen: (url: string) => void;
}

const cache = new Map<FeedId, { entries: Entry[]; newUrls: Set<string> }>();

/** Looks up an already-fetched entry (any feed loaded this session) by URL,
 *  so pages like the entry detail view can reuse list-only fields (category,
 *  description, imageUrl) that Hatena's per-entry bookmark API doesn't return. */
export function findCachedEntry(url: string): Entry | undefined {
    for (const { entries } of cache.values()) {
        const found = entries.find((entry) => entry.url === url);
        if (found) {
            return found;
        }
    }
    return undefined;
}

/** Each feed (all/general/it) is an independent server resource, so switching
 *  tabs re-fetches unless that feed was already loaded this session. */
export function useEntries(feed: FeedId): EntriesState {
    const [state, setState] = useState<FetchState>(() => {
        const cached = cache.get(feed);
        return cached
            ? { ...cached, loading: false, error: null }
            : { entries: [], newUrls: new Set(), loading: true, error: null };
    });

    useEffect(() => {
        const cached = cache.get(feed);
        if (cached) {
            setState({ ...cached, loading: false, error: null });
            return;
        }
        let cancelled = false;
        setState({
            entries: [],
            newUrls: new Set(),
            loading: true,
            error: null,
        });
        pruneOldSeenRecords();
        apiGet<{ entries: Entry[] }>(`api/entries/${feed}`)
            .then((data) => {
                if (cancelled) {
                    return;
                }
                const newUrls = getNewUrls(
                    data.entries.map((entry) => entry.url),
                );
                cache.set(feed, { entries: data.entries, newUrls });
                setState({
                    entries: data.entries,
                    newUrls,
                    loading: false,
                    error: null,
                });
            })
            .catch((err: unknown) => {
                if (cancelled) {
                    return;
                }
                setState({
                    entries: [],
                    newUrls: new Set(),
                    loading: false,
                    error: err instanceof Error ? err.message : String(err),
                });
            });
        return () => {
            cancelled = true;
        };
    }, [feed]);

    const markSeen = useCallback((url: string) => {
        markUrlSeen(url);
    }, []);

    return { ...state, markSeen };
}
