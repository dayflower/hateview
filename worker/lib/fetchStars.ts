import type {
    BookmarkStarQuery,
    HatenaStar,
    HatenaStarEntriesResponse,
    HatenaStarEntry,
} from "../../src/types/star.ts";
import { USER_AGENT } from "./userAgent.ts";

const STAR_API_URL = "https://s.hatena.ne.jp/entries.json";

/** Upper bound on how many bookmarks one entry is looked up for. */
export const MAX_STAR_TARGETS = 500;
/** How many uris are sent to Hatena's star API per upstream request. */
export const STAR_CHUNK_SIZE = 100;

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

/**
 * Reduces the requested bookmarks to the set actually looked up: one entry per
 * user, oldest first, capped at MAX_STAR_TARGETS. Early bookmarks collect the
 * bulk of an entry's stars, so dropping the newest ones costs the least.
 *
 * The result depends only on the set of bookmarks, not on their order, which
 * keeps the response stable across callers that pass the same entry.
 */
export function selectStarTargets(
    bookmarks: BookmarkStarQuery[],
): BookmarkStarQuery[] {
    const oldestPerUser = new Map<string, BookmarkStarQuery>();
    for (const bookmark of bookmarks) {
        const existing = oldestPerUser.get(bookmark.user);
        if (!existing || bookmark.timestamp < existing.timestamp) {
            oldestPerUser.set(bookmark.user, bookmark);
        }
    }
    return [...oldestPerUser.values()]
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .slice(0, MAX_STAR_TARGETS);
}

async function fetchStarEntries(uris: string[]): Promise<HatenaStarEntry[]> {
    const body = new URLSearchParams();
    for (const uri of uris) {
        body.append("uri", uri);
    }

    const res = await fetch(STAR_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
        },
        body: body.toString(),
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch star counts: ${res.status}`);
    }

    const json = (await res.json()) as HatenaStarEntriesResponse;
    return json.entries;
}

export async function fetchStarCounts(
    eid: string,
    bookmarks: BookmarkStarQuery[],
): Promise<Record<string, number>> {
    const targets = selectStarTargets(bookmarks);
    if (targets.length === 0) {
        return {};
    }

    const uriToUser = new Map<string, string>();
    for (const bookmark of targets) {
        uriToUser.set(
            buildStarUri(eid, bookmark.user, bookmark.timestamp),
            bookmark.user,
        );
    }

    const uris = [...uriToUser.keys()];
    const chunks: string[][] = [];
    for (let i = 0; i < uris.length; i += STAR_CHUNK_SIZE) {
        chunks.push(uris.slice(i, i + STAR_CHUNK_SIZE));
    }

    // A failed chunk fails the whole lookup on purpose: the caller does not
    // cache an error, so the next request retries, whereas a partial result
    // would be cached and serve missing star counts until it expires.
    const entryLists = await Promise.all(chunks.map(fetchStarEntries));

    const result: Record<string, number> = {};
    for (const entry of entryLists.flat()) {
        const user = uriToUser.get(entry.uri);
        if (!user) {
            continue;
        }
        result[user] = countStars(entry.stars);
    }
    return result;
}
