import { readJson, writeJson } from "./localStorageJson";

const STORAGE_KEY = "hateview:v1:read";
export const DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface ReadRecord {
    firstSeenAt: string;
}

type ReadStore = Record<string, ReadRecord>;

function load(): ReadStore {
    return readJson<ReadStore>(STORAGE_KEY, {});
}

function save(store: ReadStore): void {
    writeJson(STORAGE_KEY, store);
}

export function isRead(url: string): boolean {
    return url in load();
}

/** Records `url` as read. Idempotent: the first-marked timestamp is never overwritten by later opens. */
export function markRead(url: string): void {
    const store = load();
    if (url in store) {
        return;
    }
    store[url] = { firstSeenAt: new Date().toISOString() };
    save(store);
}

export function markUnread(url: string): void {
    const store = load();
    if (!(url in store)) {
        return;
    }
    delete store[url];
    save(store);
}

export function pruneOldReadRecords(
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
