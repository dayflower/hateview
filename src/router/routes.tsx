import { isHttpUrl } from "../lib/url/externalUrl";

export type Route =
    | { name: "list" }
    | { name: "entry"; url: string }
    | { name: "later" }
    | { name: "settings" };

const ENTRY_PREFIX = "/entry/";

/** Returns `null` for a path that matches none of the app's routes. */
export function matchRoute(path: string): Route | null {
    if (path === "/" || path === "") {
        return { name: "list" };
    }
    if (path === "/later") {
        return { name: "later" };
    }
    if (path === "/settings") {
        return { name: "settings" };
    }
    if (path.startsWith(ENTRY_PREFIX)) {
        const encoded = path.slice(ENTRY_PREFIX.length);
        let url: string;
        try {
            url = decodeURIComponent(encoded);
        } catch {
            return null;
        }
        // The hash is attacker-supplied, and this url ends up in link hrefs and
        // in the read-later list, so anything that isn't a web url is treated
        // as an unknown route (the app then redirects to the list).
        return isHttpUrl(url) ? { name: "entry", url } : null;
    }
    return null;
}

export function entryPath(url: string): string {
    return `${ENTRY_PREFIX}${encodeURIComponent(url)}`;
}
