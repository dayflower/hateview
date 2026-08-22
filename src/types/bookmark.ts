/** Which of Hatena's per-entry APIs to fetch the bookmark listing from. Both
 *  return the same shape; see `fetchBookmarkEntry.ts` for how they differ. */
export type BookmarkSource = "json" | "jsonlite";

export interface HatenaBookmark {
    user: string;
    tags: string[];
    timestamp: string;
    comment: string;
}

export interface HatenaJsonliteResponse {
    title: string;
    count: number;
    url: string;
    entry_url: string;
    eid: string;
    bookmarks: HatenaBookmark[];
}
