import { createUrlRecordStore, DEFAULT_MAX_AGE_MS } from "./urlRecordStore";

export { DEFAULT_MAX_AGE_MS };

const store = createUrlRecordStore({
    storageKey: "hateview:v1:seen",
    timestampField: "firstSeenAt",
});

/**
 * Given the URLs from a freshly fetched entries.json, returns the subset that
 * have never been marked seen. Unlike a plain fetch-time diff, this does not
 * itself record anything as seen — an entry only leaves this set once
 * markUrlSeen() is called for it (e.g. after being scrolled into view), so an
 * entry that was fetched but never actually shown stays "new" across fetches.
 */
export function getNewUrls(urls: string[]): Set<string> {
    const seen = store.listUrls();
    const newUrls = new Set<string>();
    for (const url of urls) {
        if (!seen.has(url)) {
            newUrls.add(url);
        }
    }
    return newUrls;
}

/** Records a single URL as seen, so it stops being reported by getNewUrls(). */
export function markUrlSeen(url: string): void {
    store.add(url);
}

export function pruneOldSeenRecords(
    maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): void {
    store.prune(maxAgeMs);
}
