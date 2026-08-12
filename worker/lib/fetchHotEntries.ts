import { USER_AGENT } from "./userAgent.ts";

export async function fetchFeed(url: string): Promise<string> {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    return res.text();
}
