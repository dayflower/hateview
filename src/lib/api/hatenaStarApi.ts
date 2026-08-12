import type { BookmarkStarQuery, StarCountsResponse } from "../../types/star";

export async function fetchStarCounts(
    eid: string,
    bookmarks: BookmarkStarQuery[],
): Promise<Record<string, number>> {
    const res = await fetch(`/api/stars/${encodeURIComponent(eid)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarks }),
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch star counts: ${res.status}`);
    }
    const json = (await res.json()) as StarCountsResponse;
    return json.stars;
}
