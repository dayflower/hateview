import type { FeedId } from "../../types/entry";
import { ALL_CATEGORY_IDS } from "../categories";
import { readJson, writeJson } from "./localStorageJson";

const STORAGE_KEY = "hateview:v1:hiddenCategories";

function isFeedId(value: unknown): value is FeedId {
    return (
        typeof value === "string" &&
        (ALL_CATEGORY_IDS as string[]).includes(value)
    );
}

/** Drops anything that isn't a currently-known category id, so a stale or
 *  corrupted stored value degrades to "not hidden" instead of throwing or
 *  hiding an id the rest of the app no longer recognizes. */
function load(): FeedId[] {
    return readJson<unknown[]>(STORAGE_KEY, []).filter(isFeedId);
}

function save(hidden: FeedId[]): void {
    writeJson(STORAGE_KEY, hidden);
}

export function listHiddenCategories(): FeedId[] {
    return load();
}

export function listVisibleCategories(): FeedId[] {
    const hidden = new Set(load());
    return ALL_CATEGORY_IDS.filter((id) => !hidden.has(id));
}

export function isCategoryVisible(id: FeedId): boolean {
    return !load().includes(id);
}

/** Setting `visible` to false is a no-op if `id` is the last visible
 *  category — the entry list always needs at least one feed to show. */
export function setCategoryVisible(id: FeedId, visible: boolean): void {
    const hidden = new Set(load());
    if (visible) {
        hidden.delete(id);
    } else {
        if (hidden.size >= ALL_CATEGORY_IDS.length - 1) {
            return;
        }
        hidden.add(id);
    }
    save(ALL_CATEGORY_IDS.filter((categoryId) => hidden.has(categoryId)));
}
