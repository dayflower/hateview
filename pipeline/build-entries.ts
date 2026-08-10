import { writeFileSync } from "node:fs";
import { crossReferenceCategories } from "./lib/crossReferenceCategories.ts";
import { fetchFeed } from "./lib/fetchHotEntries.ts";
import { parseHotEntryRss } from "./lib/parseRdf.ts";
import type { CategoryFeed, EntriesFile } from "./lib/types.ts";

const ALL_FEED_URL = "https://b.hatena.ne.jp/hotentry/all.rss";

const CATEGORY_FEEDS: CategoryFeed[] = [
    { id: "it", url: "https://b.hatena.ne.jp/hotentry/it.rss" },
    { id: "general", url: "https://b.hatena.ne.jp/hotentry/general.rss" },
];

export async function buildEntries(): Promise<EntriesFile> {
    const baseItems = parseHotEntryRss(await fetchFeed(ALL_FEED_URL));

    const categoryResults = await Promise.all(
        CATEGORY_FEEDS.map(async (feed) => ({
            id: feed.id,
            items: parseHotEntryRss(await fetchFeed(feed.url)),
        })),
    );

    const entries = crossReferenceCategories(baseItems, categoryResults);
    return { generatedAt: new Date().toISOString(), entries };
}

if (import.meta.main) {
    const result = await buildEntries();
    if (result.entries.length === 0) {
        console.error(
            "No entries fetched from Hatena — aborting without touching entries.json",
        );
        process.exit(1);
    }
    const outPath = new URL("../public/entries.json", import.meta.url);
    writeFileSync(outPath, `${JSON.stringify(result, null, 4)}\n`);
    console.log(
        `Wrote ${result.entries.length} entries to public/entries.json`,
    );
}
