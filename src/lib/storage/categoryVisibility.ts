import type { FeedId } from "../../types/entry";
import { ALL_CATEGORY_IDS } from "../categories";
import { readJson, writeJson } from "./localStorageJson";

const STORAGE_KEY = "hateview:v1:hiddenCategories";
const ORDER_STORAGE_KEY = "hateview:v1:categoryOrder";

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
    const stored = readJson<unknown>(STORAGE_KEY, []);
    return Array.isArray(stored) ? stored.filter(isFeedId) : [];
}

function save(hidden: FeedId[]): void {
    writeJson(STORAGE_KEY, hidden);
}

/** Turns any candidate ordering into a permutation of ALL_CATEGORY_IDS:
 *  unknown ids and duplicates are dropped, and known ids missing from the
 *  candidate (e.g. a category added after the order was saved) are appended
 *  in their default relative order. */
function normalizeOrder(candidate: unknown): FeedId[] {
    const seen = new Set<FeedId>();
    const order: FeedId[] = [];
    if (Array.isArray(candidate)) {
        for (const value of candidate) {
            if (isFeedId(value) && !seen.has(value)) {
                seen.add(value);
                order.push(value);
            }
        }
    }
    for (const id of ALL_CATEGORY_IDS) {
        if (!seen.has(id)) {
            order.push(id);
        }
    }
    return order;
}

/** Every category, hidden ones included, in the user's chosen order. */
export function listOrderedCategories(): FeedId[] {
    return normalizeOrder(readJson<unknown>(ORDER_STORAGE_KEY, null));
}

export function setCategoryOrder(order: FeedId[]): void {
    writeJson(ORDER_STORAGE_KEY, normalizeOrder(order));
}

export function resetCategoryOrder(): void {
    try {
        localStorage.removeItem(ORDER_STORAGE_KEY);
    } catch {
        // See writeJson: unavailable storage just means nothing to reset.
    }
}

export function listHiddenCategories(): FeedId[] {
    return load();
}

/** Visible categories in the user's chosen order. */
export function listVisibleCategories(): FeedId[] {
    const hidden = new Set(load());
    return listOrderedCategories().filter((id) => !hidden.has(id));
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
