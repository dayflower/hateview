/**
 * Leaves the app for an external url in the same tab. Kept as its own module
 * so tests can replace it — jsdom implements neither `location.assign` nor
 * assigning to `location.href`.
 */
export function navigateExternal(url: string): void {
    window.location.assign(url);
}
