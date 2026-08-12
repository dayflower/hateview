import { readJson, writeJson } from "./localStorageJson";

const STORAGE_KEY = "hateview:v1:seen";
export const DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface SeenRecord {
    firstSeenAt: string;
}

type SeenStore = Record<string, SeenRecord>;

function load(): SeenStore {
    return readJson<SeenStore>(STORAGE_KEY, {});
}

function save(store: SeenStore): void {
    writeJson(STORAGE_KEY, store);
}

/**
 * Given the URLs from a freshly fetched entries.json, returns the subset that
 * have never been marked seen. Unlike a plain fetch-time diff, this does not
 * itself record anything as seen — an entry only leaves this set once
 * markUrlSeen() is called for it (e.g. after being scrolled into view), so an
 * entry that was fetched but never actually shown stays "new" across fetches.
 */
export function getNewUrls(urls: string[]): Set<string> {
    const store = load();
    const newUrls = new Set<string>();
    for (const url of urls) {
        if (!(url in store)) {
            newUrls.add(url);
        }
    }
    return newUrls;
}

/** Records a single URL as seen, so it stops being reported by getNewUrls(). */
export function markUrlSeen(url: string): void {
    const store = load();
    if (url in store) {
        return;
    }
    store[url] = { firstSeenAt: new Date().toISOString() };
    save(store);
}

export function pruneOldSeenRecords(
    maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): void {
    const store = load();
    const now = Date.now();
    let changed = false;
    for (const [url, record] of Object.entries(store)) {
        if (now - new Date(record.firstSeenAt).getTime() > maxAgeMs) {
            delete store[url];
            changed = true;
        }
    }
    if (changed) {
        save(store);
    }
}
