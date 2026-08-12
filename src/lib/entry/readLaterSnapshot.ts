import type { Entry } from "../../types/entry";
import type { ReadLaterSnapshot } from "../storage/readLater";

/** The subset of an Entry that's worth keeping once it's saved to the
 *  read-later list, since Hatena's per-entry bookmark API can't supply it
 *  back later (see EntryDetailPage's `findCachedEntry` fallback). */
export function toReadLaterSnapshot(entry: Entry): ReadLaterSnapshot {
    return {
        url: entry.url,
        title: entry.title,
        description: entry.description,
        imageUrl: entry.imageUrl,
        bookmarkCount: entry.bookmarkCount,
        category: entry.category,
        tags: entry.tags,
    };
}
