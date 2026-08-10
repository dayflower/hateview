import { readJson, writeJson } from "./localStorageJson";

const STORAGE_KEY = "hateview:v1:removed";
export const DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface RemovedRecord {
    removedAt: string;
}

type RemovedStore = Record<string, RemovedRecord>;

function load(): RemovedStore {
    return readJson<RemovedStore>(STORAGE_KEY, {});
}

function save(store: RemovedStore): void {
    writeJson(STORAGE_KEY, store);
}

export function isRemoved(url: string): boolean {
    return url in load();
}

export function removeEntry(url: string): void {
    const store = load();
    store[url] = { removedAt: new Date().toISOString() };
    save(store);
}

export function pruneOldRemovedRecords(
    maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): void {
    const store = load();
    const now = Date.now();
    let changed = false;
    for (const [url, record] of Object.entries(store)) {
        if (now - new Date(record.removedAt).getTime() > maxAgeMs) {
            delete store[url];
            changed = true;
        }
    }
    if (changed) {
        save(store);
    }
}
