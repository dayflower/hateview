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
