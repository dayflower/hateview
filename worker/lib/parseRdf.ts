import { XMLParser } from "fast-xml-parser";
import type { RawFeedItem } from "./types.ts";

interface RdfLi {
    "@_rdf:resource"?: string;
}

interface RawItem {
    "@_rdf:about": string;
    title?: string;
    description?: string;
    "dc:date"?: string;
    "dc:subject"?: string[];
    "hatena:imageurl"?: string;
    "hatena:bookmarkCommentListPageUrl"?: string;
    "hatena:bookmarkcount"?: number;
}

interface RdfDoc {
    "rdf:RDF": {
        item?: RawItem[];
        channel: {
            items?: {
                "rdf:Seq"?: {
                    "rdf:li"?: RdfLi[];
                };
            };
        };
    };
}

const ARRAY_TAGS = new Set(["item", "dc:subject", "rdf:li"]);

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    htmlEntities: true,
    isArray: (name) => ARRAY_TAGS.has(name),
});

/** Parses a Hatena hotentry RSS 1.0 (RDF) feed, preserving the channel's own rdf:Seq rank order. */
export function parseHotEntryRss(xml: string): RawFeedItem[] {
    const doc = parser.parse(xml) as RdfDoc;
    const rawItems = doc["rdf:RDF"].item ?? [];

    const items: RawFeedItem[] = rawItems.map((item) => {
        const [category = "", ...tags] = item["dc:subject"] ?? [];
        return {
            url: item["@_rdf:about"],
            title: item.title ?? "",
            description: item.description ?? "",
            imageUrl: item["hatena:imageurl"] ?? "",
            bookmarkCount: item["hatena:bookmarkcount"] ?? 0,
            bookmarkCommentPageUrl:
                item["hatena:bookmarkCommentListPageUrl"] ?? "",
            date: item["dc:date"] ?? "",
            category,
            tags,
        };
    });

    const seq = doc["rdf:RDF"].channel.items?.["rdf:Seq"]?.["rdf:li"] ?? [];
    const seqUrls = seq
        .map((li) => li["@_rdf:resource"])
        .filter((url): url is string => Boolean(url));
    if (seqUrls.length === 0) {
        return items;
    }

    const rank = new Map(seqUrls.map((url, index) => [url, index]));
    return [...items].sort(
        (a, b) =>
            (rank.get(a.url) ?? Number.MAX_SAFE_INTEGER) -
            (rank.get(b.url) ?? Number.MAX_SAFE_INTEGER),
    );
}
