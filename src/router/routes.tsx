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
        try {
            return { name: "entry", url: decodeURIComponent(encoded) };
        } catch {
            return null;
        }
    }
    return null;
}

export function entryPath(url: string): string {
    return `${ENTRY_PREFIX}${encodeURIComponent(url)}`;
}
