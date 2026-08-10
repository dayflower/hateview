import type { HatenaJsonliteResponse } from "../../types/bookmark";
import { fetchJsonp } from "./jsonp";

export function fetchEntryJsonlite(
    url: string,
): Promise<HatenaJsonliteResponse> {
    const endpoint = `https://b.hatena.ne.jp/entry/jsonlite/?url=${encodeURIComponent(url)}`;
    return fetchJsonp<HatenaJsonliteResponse>(endpoint);
}

export function bookmarkEntryPageUrl(url: string): string {
    const withoutScheme = url.replace(/^https?:\/\//, "");
    return `https://b.hatena.ne.jp/entry/s/${withoutScheme}`;
}
