import { createUrlRecordStore, DEFAULT_MAX_AGE_MS } from "./urlRecordStore";

export { DEFAULT_MAX_AGE_MS };

const store = createUrlRecordStore({
    storageKey: "hateview:v1:removed",
    timestampField: "removedAt",
});

export function isRemoved(url: string): boolean {
    return store.has(url);
}

export function listRemovedUrls(): Set<string> {
    return store.listUrls();
}

export function removeEntry(url: string): void {
    store.add(url);
}

export function pruneOldRemovedRecords(
    maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): void {
    store.prune(maxAgeMs);
}
