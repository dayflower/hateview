/** Fetches JSON from a same-origin API path, honoring the app's base path and
 *  throwing when the response isn't ok, so call sites don't repeat that check. */
export async function apiGet<T>(
    path: string,
    params?: Record<string, string>,
): Promise<T> {
    const query = params
        ? `?${Object.entries(params)
              .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
              .join("&")}`
        : "";
    const res = await fetch(`${import.meta.env.BASE_URL}${path}${query}`);
    if (!res.ok) {
        throw new Error(`${path} fetch failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
}
