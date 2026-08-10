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
 * weren't present in a previous fetch, then records every URL as seen so a
 * later fetch treats them as known. On the very first call (empty store),
 * every URL is reported as new.
 */
export function markFetchAndGetNewUrls(urls: string[]): Set<string> {
    const store = load();
    const newUrls = new Set<string>();
    const now = new Date().toISOString();
    for (const url of urls) {
        if (!(url in store)) {
            newUrls.add(url);
            store[url] = { firstSeenAt: now };
        }
    }
    save(store);
    return newUrls;
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
