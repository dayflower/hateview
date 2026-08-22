import type { BookmarkSource } from "../../types/bookmark";
import type { StarCountsResponse } from "../../types/star";
import { apiGet } from "./apiClient";

/** The worker derives which bookmarks to look up from the entry url itself, so
 *  the caller only identifies the entry. `source` must match the value passed
 *  to `fetchEntryBookmarks` for the same entry so both requests share the
 *  worker's cached bookmark listing. */
export async function fetchStarCounts(
    url: string,
    source: BookmarkSource,
): Promise<Record<string, number>> {
    const { stars } = await apiGet<StarCountsResponse>("api/stars", {
        url,
        source,
    });
    return stars;
}
