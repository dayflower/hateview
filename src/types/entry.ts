export type CategoryId = "it" | "general";

export interface Entry {
    url: string;
    title: string;
    description: string;
    imageUrl: string;
    bookmarkCount: number;
    bookmarkCommentPageUrl: string;
    date: string;
    tags: string[];
    categories: CategoryId[];
    rank: number;
}

export interface EntriesFile {
    generatedAt: string;
    entries: Entry[];
}
