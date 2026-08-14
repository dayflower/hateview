export type FeedId =
    | "all"
    | "general"
    | "social"
    | "economics"
    | "life"
    | "knowledge"
    | "it"
    | "entertainment"
    | "game"
    | "fun";

export interface Entry {
    url: string;
    title: string;
    description: string;
    imageUrl: string;
    bookmarkCount: number;
    date: string;
    tags: string[];
    category: string;
}

export interface EntriesFile {
    generatedAt: string;
    entries: Entry[];
}
