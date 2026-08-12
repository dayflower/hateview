import type { HatenaJsonliteResponse } from "../../types/bookmark";

/** Resolves to `null` for a url nobody has bookmarked, matching what Hatena
 *  reports through the worker. */
export async function fetchEntryBookmarks(
    url: string,
): Promise<HatenaJsonliteResponse | null> {
    const res = await fetch(
        `${import.meta.env.BASE_URL}api/bookmarks?url=${encodeURIComponent(url)}`,
    );
    if (!res.ok) {
        throw new Error(`bookmarks fetch failed: ${res.status}`);
    }
    return res.json();
}

export function bookmarkEntryPageUrl(url: string): string {
    const withoutScheme = url.replace(/^https?:\/\//, "");
    return `https://b.hatena.ne.jp/entry/s/${withoutScheme}`;
}
