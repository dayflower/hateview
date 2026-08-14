import { useEffect, useState } from "react";

// The browser's own scroll restoration fights with our in-app scroll
// restoration (EntryListPage) on hash-based back/forward navigation, since
// both try to set the scroll position after a popstate. Disable it so only
// our logic decides scroll position.
if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
}

function currentPath(): string {
    const hash = window.location.hash;
    if (!hash || hash === "#") {
        return "/";
    }
    return hash.slice(1);
}

export function useHashPath(): string {
    const [path, setPath] = useState(currentPath);

    useEffect(() => {
        const onHashChange = () => setPath(currentPath());
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    return path;
}

export function navigate(path: string): void {
    window.location.hash = path;
}

/** Like `navigate`, but replaces the current history entry instead of pushing a new one —
 *  for correcting an invalid URL rather than a user-initiated move. */
export function redirect(path: string): void {
    const url = new URL(window.location.href);
    url.hash = path;
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
}
