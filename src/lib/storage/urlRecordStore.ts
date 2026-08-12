import { readJson, writeJson } from "./localStorageJson";

export const DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface UrlRecordStore {
    has(url: string): boolean;
    /** All stored urls, for providers that keep an in-memory mirror of this store. */
    listUrls(): Set<string>;
    /** Records `url`. Idempotent: an already-stored url's timestamp is not overwritten. */
    add(url: string): void;
    remove(url: string): void;
    prune(maxAgeMs?: number): void;
}

/**
 * A localStorage-backed set of urls, each tagged with the timestamp it was
 * added at, so entries can be pruned once they're older than `maxAgeMs`.
 * `timestampField` names that timestamp in the stored JSON, which lets each
 * caller (read/removed/seen tracking) keep its own on-disk field name.
 */
export function createUrlRecordStore(options: {
    storageKey: string;
    timestampField: string;
    defaultMaxAgeMs?: number;
}): UrlRecordStore {
    const {
        storageKey,
        timestampField,
        defaultMaxAgeMs = DEFAULT_MAX_AGE_MS,
    } = options;
    type Store = Record<string, Record<string, string>>;

    function load(): Store {
        return readJson<Store>(storageKey, {});
    }

    function save(store: Store): void {
        writeJson(storageKey, store);
    }

    return {
        has(url) {
            return url in load();
        },
        listUrls() {
            return new Set(Object.keys(load()));
        },
        add(url) {
            const store = load();
            if (url in store) {
                return;
            }
            store[url] = { [timestampField]: new Date().toISOString() };
            save(store);
        },
        remove(url) {
            const store = load();
            if (!(url in store)) {
                return;
            }
            delete store[url];
            save(store);
        },
        prune(maxAgeMs = defaultMaxAgeMs) {
            const store = load();
            const now = Date.now();
            let changed = false;
            for (const [url, record] of Object.entries(store)) {
                if (
                    now - new Date(record[timestampField]).getTime() >
                    maxAgeMs
                ) {
                    delete store[url];
                    changed = true;
                }
            }
            if (changed) {
                save(store);
            }
        },
    };
}
