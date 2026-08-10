import type { CategoryId } from "../../types/entry";
import { readJson, writeJson } from "./localStorageJson";

const STORAGE_KEY = "hateview:v1:later";

export interface ReadLaterSnapshot {
    url: string;
    title: string;
    description?: string;
    imageUrl?: string;
    bookmarkCount?: number;
    categories?: CategoryId[];
    tags?: string[];
}

export interface ReadLaterEntry extends ReadLaterSnapshot {
    markedAt: string;
}

type ReadLaterStore = Record<string, ReadLaterEntry>;

function load(): ReadLaterStore {
    return readJson<ReadLaterStore>(STORAGE_KEY, {});
}

function save(store: ReadLaterStore): void {
    writeJson(STORAGE_KEY, store);
}

export function isMarked(url: string): boolean {
    return url in load();
}

/** Adds or removes `snapshot.url` from the read-later list. Returns the new marked state. */
export function toggle(snapshot: ReadLaterSnapshot): boolean {
    const store = load();
    if (snapshot.url in store) {
        delete store[snapshot.url];
        save(store);
        return false;
    }
    store[snapshot.url] = { ...snapshot, markedAt: new Date().toISOString() };
    save(store);
    return true;
}

export function remove(url: string): void {
    const store = load();
    delete store[url];
    save(store);
}

export function list(): ReadLaterEntry[] {
    return Object.values(load()).sort((a, b) =>
        b.markedAt.localeCompare(a.markedAt),
    );
}
