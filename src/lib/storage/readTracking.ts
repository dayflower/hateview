import { createUrlRecordStore, DEFAULT_MAX_AGE_MS } from "./urlRecordStore";

export { DEFAULT_MAX_AGE_MS };

const store = createUrlRecordStore({
    storageKey: "hateview:v1:read",
    timestampField: "firstSeenAt",
});

export function isRead(url: string): boolean {
    return store.has(url);
}

export function listReadUrls(): Set<string> {
    return store.listUrls();
}

/** Records `url` as read. Idempotent: the first-marked timestamp is never overwritten by later opens. */
export function markRead(url: string): void {
    store.add(url);
}

export function markUnread(url: string): void {
    store.remove(url);
}

export function pruneOldReadRecords(
    maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): void {
    store.prune(maxAgeMs);
}
