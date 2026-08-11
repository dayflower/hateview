import { useEffect, useState } from "react";
import type { Entry, FeedId } from "../../types/entry";
import {
    markFetchAndGetNewUrls,
    pruneOldSeenRecords,
} from "../storage/seenEntries";

interface EntriesState {
    entries: Entry[];
    newUrls: Set<string>;
    loading: boolean;
    error: string | null;
}

const cache = new Map<FeedId, { entries: Entry[]; newUrls: Set<string> }>();

/** Each feed (all/general/it) is an independent server resource, so switching
 *  tabs re-fetches unless that feed was already loaded this session. */
export function useEntries(feed: FeedId): EntriesState {
    const [state, setState] = useState<EntriesState>(() => {
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
        fetch(`${import.meta.env.BASE_URL}api/entries/${feed}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`entries fetch failed: ${res.status}`);
                }
                return res.json();
            })
            .then((data: { entries: Entry[] }) => {
                if (cancelled) {
                    return;
                }
                const newUrls = markFetchAndGetNewUrls(
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

    return state;
}
