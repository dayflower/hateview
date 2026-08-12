export interface HatenaStar {
    name: string;
    quote: string;
}

export interface HatenaStarEntry {
    uri: string;
    stars: (HatenaStar | number)[];
}

export interface HatenaStarEntriesResponse {
    entries: HatenaStarEntry[];
}

export interface BookmarkStarQuery {
    user: string;
    timestamp: string;
}

export interface StarCountsResponse {
    stars: Record<string, number>;
}
