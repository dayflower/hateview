const USER_AGENT = "hateview-bot/1.0 (+https://github.com/dayflower/hateview)";

export async function fetchFeed(url: string): Promise<string> {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    return res.text();
}
