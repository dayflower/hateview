import type { StarCountsResponse } from "../../types/star";
import { apiGet } from "./apiClient";

/** The worker derives which bookmarks to look up from the entry url itself, so
 *  the caller only identifies the entry. */
export async function fetchStarCounts(
    url: string,
): Promise<Record<string, number>> {
    const { stars } = await apiGet<StarCountsResponse>("api/stars", { url });
    return stars;
}
