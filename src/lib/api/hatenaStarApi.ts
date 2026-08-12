import type { StarCountsResponse } from "../../types/star";

/** The worker derives which bookmarks to look up from the entry url itself, so
 *  the caller only identifies the entry. */
export async function fetchStarCounts(
    url: string,
): Promise<Record<string, number>> {
    const res = await fetch(
        `${import.meta.env.BASE_URL}api/stars?url=${encodeURIComponent(url)}`,
    );
    if (!res.ok) {
        throw new Error(`Failed to fetch star counts: ${res.status}`);
    }
    const json = (await res.json()) as StarCountsResponse;
    return json.stars;
}
