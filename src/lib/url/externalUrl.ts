/**
 * Returns the url only when it is a plain web link, so that a scheme like
 * `javascript:` can never reach an anchor's href. Entry urls come from Hatena's
 * feed or from the location hash, neither of which the app controls.
 *
 * An anchor rendered with `undefined` simply has no href, which degrades to
 * unclickable text rather than a broken or dangerous link.
 */
export function safeExternalUrl(url: string): string | undefined {
    return isHttpUrl(url) ? url : undefined;
}

export function isHttpUrl(url: string): boolean {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return false;
    }
    return parsed.protocol === "http:" || parsed.protocol === "https:";
}
