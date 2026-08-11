import type { EntriesFile, Entry, FeedId } from "../../src/types/entry.ts";

export type { EntriesFile, Entry, FeedId };

export interface RawFeedItem {
    url: string;
    title: string;
    description: string;
    imageUrl: string;
    bookmarkCount: number;
    bookmarkCommentPageUrl: string;
    date: string;
    category: string;
    tags: string[];
}
