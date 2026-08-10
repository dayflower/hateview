import type { CategoryId, EntriesFile, Entry } from "../../src/types/entry.ts";

export type { CategoryId, EntriesFile, Entry };

export interface RawFeedItem {
    url: string;
    title: string;
    description: string;
    imageUrl: string;
    bookmarkCount: number;
    bookmarkCommentPageUrl: string;
    date: string;
    tags: string[];
}

export interface CategoryFeed {
    id: CategoryId;
    url: string;
}
