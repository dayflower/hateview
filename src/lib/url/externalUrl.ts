/**
 * Returns the url only when it is a plain web link, so that a scheme like
 * `javascript:` can never reach an anchor's href. Entry urls come from Hatena's
 * feed or from the location hash, neither of which the app controls.
 *
 * An anchor rendered with `undefined` simply has no href, which degrades to
 * unclickable text rather than a broken or dangerous link.
 *
 * The returned string is the parser's normalized href, rebuilt behind a
 * constant scheme prefix. Returning the input as-is would be equally safe at
 * runtime, but a literal prefix makes it evident (to readers and to static
 * analysis such as CodeQL's `js/xss`) that the scheme cannot be attacker
 * controlled.
 */
export function safeExternalUrl(url: string): string | undefined {
    const parsed = parseUrl(url);
    // `href` of a special scheme like http(s) always serializes as
    // `<scheme>://...`, so slicing off that prefix leaves the rest intact.
    if (parsed?.protocol === "https:") {
        return `https://${parsed.href.slice("https://".length)}`;
    }
    if (parsed?.protocol === "http:") {
        return `http://${parsed.href.slice("http://".length)}`;
    }
    return undefined;
}

export function isHttpUrl(url: string): boolean {
    return safeExternalUrl(url) !== undefined;
}

function parseUrl(url: string): URL | undefined {
    try {
        return new URL(url);
    } catch {
        return undefined;
    }
}
