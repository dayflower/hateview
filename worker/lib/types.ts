import type { EntriesFile, Entry, FeedId } from "../../src/types/entry.ts";
import type {
    BookmarkStarQuery,
    StarCountsResponse,
} from "../../src/types/star.ts";

export type {
    BookmarkStarQuery,
    EntriesFile,
    Entry,
    FeedId,
    StarCountsResponse,
};

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
