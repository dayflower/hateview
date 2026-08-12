import { type DependencyList, useEffect, useState } from "react";

interface AsyncDataState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

/**
 * Runs `fetcher` whenever `deps` changes, exposing `{data, loading, error}`.
 * A result from a superseded run (e.g. `deps` changing again before the
 * previous fetch resolves) is discarded instead of overwriting newer state.
 */
export function useAsyncData<T>(
    fetcher: () => Promise<T>,
    deps: DependencyList,
): AsyncDataState<T> {
    const [state, setState] = useState<AsyncDataState<T>>({
        data: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;
        setState({ data: null, loading: true, error: null });

        fetcher()
            .then((data) => {
                if (!cancelled) {
                    setState({ data, loading: false, error: null });
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
        // biome-ignore lint/correctness/useExhaustiveDependencies: deps is the caller-supplied dependency list for fetcher, not a fixed set this hook can name
    }, deps);

    return state;
}
