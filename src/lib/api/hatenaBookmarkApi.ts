import type { HatenaJsonliteResponse } from "../../types/bookmark";
import { apiGet } from "./apiClient";

/** Resolves to `null` for a url nobody has bookmarked, matching what Hatena
 *  reports through the worker. */
export function fetchEntryBookmarks(
    url: string,
): Promise<HatenaJsonliteResponse | null> {
    return apiGet<HatenaJsonliteResponse | null>("api/bookmarks", { url });
}

export function bookmarkEntryPageUrl(url: string): string {
    const withoutScheme = url.replace(/^https?:\/\//, "");
    return `https://b.hatena.ne.jp/entry/s/${withoutScheme}`;
}
