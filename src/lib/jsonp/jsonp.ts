let counter = 0;

interface FetchJsonpOptions {
    callbackParam?: string;
    timeoutMs?: number;
}

export function fetchJsonp<T>(
    url: string,
    options: FetchJsonpOptions = {},
): Promise<T> {
    const { callbackParam = "callback", timeoutMs = 8000 } = options;

    return new Promise<T>((resolve, reject) => {
        const callbackName = `__hateview_jsonp_${counter++}`;
        let settled = false;

        const cleanup = () => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeoutId);
            script.remove();
            delete (window as unknown as Record<string, unknown>)[callbackName];
        };

        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error(`JSONP request timed out: ${url}`));
        }, timeoutMs);

        (window as unknown as Record<string, unknown>)[callbackName] = (
            data: T,
        ) => {
            cleanup();
            resolve(data);
        };

        const script = document.createElement("script");
        const separator = url.includes("?") ? "&" : "?";
        script.src = `${url}${separator}${callbackParam}=${callbackName}`;
        script.onerror = () => {
            cleanup();
            reject(new Error(`JSONP request failed: ${url}`));
        };
        document.head.appendChild(script);
    });
}
