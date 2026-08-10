import { useEffect, useState } from "react";
import type { Entry } from "../../types/entry";

interface EntriesState {
    entries: Entry[];
    loading: boolean;
    error: string | null;
}

let cache: Entry[] | null = null;

export function useEntries(): EntriesState {
    const [state, setState] = useState<EntriesState>(() =>
        cache
            ? { entries: cache, loading: false, error: null }
            : { entries: [], loading: true, error: null },
    );

    useEffect(() => {
        if (cache) {
            return;
        }
        let cancelled = false;
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
                cache = data.entries;
                setState({
                    entries: data.entries,
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
