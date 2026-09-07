export function readSessionJson<T>(key: string, fallback: T): T {
    try {
        const raw = sessionStorage.getItem(key);
        if (raw === null) {
            return fallback;
        }
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function writeSessionJson<T>(key: string, value: T): void {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        // sessionStorage may be unavailable (private browsing) or full; losing
        // client-only state gracefully is preferable to crashing the app.
    }
}
