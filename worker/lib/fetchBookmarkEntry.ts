import type { HatenaJsonliteResponse } from "../../src/types/bookmark.ts";
import { USER_AGENT } from "./userAgent.ts";

const JSONLITE_URL = "https://b.hatena.ne.jp/entry/jsonlite/";

/** Hatena answers with a bare `null` (and a 200) for a url nobody has
 *  bookmarked, which the caller passes on to the client unchanged. */
export async function fetchBookmarkEntry(
    url: string,
): Promise<HatenaJsonliteResponse | null> {
    const endpoint = `${JSONLITE_URL}?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint, {
        headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch bookmarks for ${url}: ${res.status}`);
    }
    return (await res.json()) as HatenaJsonliteResponse | null;
}
