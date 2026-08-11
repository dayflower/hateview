export type FeedId = "all" | "general" | "it";

export interface Entry {
    url: string;
    title: string;
    description: string;
    imageUrl: string;
    bookmarkCount: number;
    bookmarkCommentPageUrl: string;
    date: string;
    tags: string[];
    category: string;
    rank: number;
}

export interface EntriesFile {
    generatedAt: string;
    entries: Entry[];
}
