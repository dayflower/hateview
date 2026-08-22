import type { BookmarkSource } from "../../types/bookmark";
import { readJson, writeJson } from "./localStorageJson";

export const BOOKMARK_SOURCE_STORAGE_KEY = "hateview:v1:bookmarkSource";

const VALID_SOURCES: BookmarkSource[] = ["json", "jsonlite"];

export function readBookmarkSource(): BookmarkSource {
    const value = readJson<BookmarkSource>(BOOKMARK_SOURCE_STORAGE_KEY, "json");
    return VALID_SOURCES.includes(value) ? value : "json";
}

export function writeBookmarkSource(source: BookmarkSource): void {
    writeJson(BOOKMARK_SOURCE_STORAGE_KEY, source);
}
