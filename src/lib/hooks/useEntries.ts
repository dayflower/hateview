import { useEffect, useState } from "react";
import type { Entry } from "../../types/entry";
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

let cache: { entries: Entry[]; newUrls: Set<string> } | null = null;

export function useEntries(): EntriesState {
    const [state, setState] = useState<EntriesState>(() =>
        cache
            ? { ...cache, loading: false, error: null }
            : { entries: [], newUrls: new Set(), loading: true, error: null },
    );

    useEffect(() => {
        if (cache) {
            return;
        }
        let cancelled = false;
        pruneOldSeenRecords();
        fetch(`${import.meta.env.BASE_URL}entries.json`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`entries.json fetch failed: ${res.status}`);
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
                cache = { entries: data.entries, newUrls };
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
    }, []);

    return state;
}
