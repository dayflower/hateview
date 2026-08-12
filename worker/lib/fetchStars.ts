import type {
    BookmarkStarQuery,
    HatenaStar,
    HatenaStarEntriesResponse,
} from "../../src/types/star.ts";

const STAR_API_URL = "https://s.hatena.ne.jp/entries.json";

export function buildStarUri(
    eid: string,
    user: string,
    timestamp: string,
): string {
    const date = timestamp.slice(0, 10).replace(/\//g, "");
    return `https://b.hatena.ne.jp/${encodeURIComponent(user)}/${date}#bookmark-${eid}`;
}

export function countStars(stars: (HatenaStar | number)[]): number {
    if (stars.length === 3 && typeof stars[1] === "number") {
        return stars[1] + 2;
    }
    return stars.length;
}

export async function fetchStarCounts(
    eid: string,
    bookmarks: BookmarkStarQuery[],
): Promise<Record<string, number>> {
    if (bookmarks.length === 0) {
        return {};
    }

    const uriToUser = new Map<string, string>();
    const body = new URLSearchParams();
    for (const bookmark of bookmarks) {
        const uri = buildStarUri(eid, bookmark.user, bookmark.timestamp);
        uriToUser.set(uri, bookmark.user);
        body.append("uri", uri);
    }

    const res = await fetch(STAR_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch star counts: ${res.status}`);
    }

    const json = (await res.json()) as HatenaStarEntriesResponse;
    const result: Record<string, number> = {};
    for (const entry of json.entries) {
        const user = uriToUser.get(entry.uri);
        if (!user) {
            continue;
        }
        result[user] = countStars(entry.stars);
    }
    return result;
}
