import type {
    BookmarkSource,
    HatenaJsonliteResponse,
} from "../../src/types/bookmark.ts";
import { USER_AGENT } from "./userAgent.ts";

const JSONLITE_URL = "https://b.hatena.ne.jp/entry/jsonlite/";
const JSON_URL = "https://b.hatena.ne.jp/entry/json/";

/** Hatena answers with a bare `null` (and a 200) for a url nobody has
 *  bookmarked, which the caller passes on to the client unchanged.
 *
 *  `jsonlite` and `json` return the same shape (`json` additionally carries a
 *  `related` field this app ignores). Hatena's CDN caches each path
 *  independently, so the two can be at different points of staleness for the
 *  same url at any given moment — neither is guaranteed to be the fresher
 *  one, which is why the choice is left to the user rather than hardcoded. */
export async function fetchBookmarkEntry(
    url: string,
    source: BookmarkSource,
): Promise<HatenaJsonliteResponse | null> {
    const base = source === "jsonlite" ? JSONLITE_URL : JSON_URL;
    const endpoint = `${base}?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint, {
        headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch bookmarks for ${url}: ${res.status}`);
    }
    return (await res.json()) as HatenaJsonliteResponse | null;
}
