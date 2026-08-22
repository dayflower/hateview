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

/** An installed PWA is launched at its `start_url` (`/`), which carries no
 *  hash, so the first `navigate()` pushes `#/…` on top of an entry that renders
 *  the very same list. Backing out of the app then takes one press more than it
 *  should. Rewriting (not pushing) the launch entry to the canonical `#/` keeps
 *  the app at a single history entry per screen. */
export function canonicalizeLaunchEntry(): void {
    const hash = window.location.hash;
    if (hash && hash !== "#") {
        return;
    }
    const url = new URL(window.location.href);
    url.hash = "/";
    window.history.replaceState(window.history.state, "", url);
}

canonicalizeLaunchEntry();

/** Whether the app itself pushed a history entry, i.e. whether stepping back
 *  stays inside the app instead of leaving it (or closing the PWA). */
let pushedHistoryEntry = false;

export function useHashPath(): string {
    const [path, setPath] = useState(currentPath);

    useEffect(() => {
        const onNavigation = () => setPath(currentPath());
        window.addEventListener("hashchange", onNavigation);
        // Back/forward fires popstate as well, and a browser that skips
        // `hashchange` when returning to an entry with no fragment at all would
        // otherwise leave the previous screen on display. Re-reading the path is
        // a no-op whenever `hashchange` already handled it.
        window.addEventListener("popstate", onNavigation);
        return () => {
            window.removeEventListener("hashchange", onNavigation);
            window.removeEventListener("popstate", onNavigation);
        };
    }, []);

    return path;
}

export function navigate(path: string): void {
    // Re-selecting the screen that is already shown (tapping its header tab
    // again) must not stack a second entry for it.
    if (path === currentPath()) {
        return;
    }
    pushedHistoryEntry = true;
    window.location.hash = path;
}

/** Steps back to the previous in-app screen. When the app was opened straight
 *  onto the current screen — a shared link, or a PWA launched at an entry url —
 *  there is no in-app entry to return to and `history.back()` would leave the
 *  app, so the list replaces the current entry instead. */
export function goBack(): void {
    if (pushedHistoryEntry) {
        window.history.back();
        return;
    }
    redirect("/");
}

/** Like `navigate`, but replaces the current history entry instead of pushing a new one —
 *  for correcting an invalid URL rather than a user-initiated move. */
export function redirect(path: string): void {
    const url = new URL(window.location.href);
    url.hash = path;
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
}
