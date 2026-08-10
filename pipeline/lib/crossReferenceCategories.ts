import type { CategoryId, Entry, RawFeedItem } from "./types";

export interface CategoryFeedItems {
    id: CategoryId;
    items: RawFeedItem[];
}

/**
 * Merges the base ("all") feed with category-specific feeds, tagging each entry with the
 * categories it was found in. Entries present only in a category feed (not in the base feed)
 * are appended afterward so nothing is silently dropped.
 */
export function crossReferenceCategories(
    baseItems: RawFeedItem[],
    categoryFeeds: CategoryFeedItems[],
): Entry[] {
    const byUrl = new Map<string, RawFeedItem>();
    const order: string[] = [];

    for (const item of baseItems) {
        byUrl.set(item.url, item);
        order.push(item.url);
    }
    for (const feed of categoryFeeds) {
        for (const item of feed.items) {
            if (!byUrl.has(item.url)) {
                byUrl.set(item.url, item);
                order.push(item.url);
            }
        }
    }

    const categoriesByUrl = new Map<string, Set<CategoryId>>();
    for (const feed of categoryFeeds) {
        for (const item of feed.items) {
            const set = categoriesByUrl.get(item.url) ?? new Set<CategoryId>();
            set.add(feed.id);
            categoriesByUrl.set(item.url, set);
        }
    }

    return order.map((url, index) => {
        const item = byUrl.get(url);
        if (!item) {
            throw new Error(`unreachable: missing item for ${url}`);
        }
        return {
            ...item,
            categories: [...(categoriesByUrl.get(url) ?? [])],
            rank: index + 1,
        };
    });
}
