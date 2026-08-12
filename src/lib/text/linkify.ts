const URL_PATTERN = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/g;
const TRAILING_PUNCTUATION = /[)\].,!?;:'"]+$/;

export interface TextSegment {
    text: string;
    url?: string;
}

export function splitTextWithLinks(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let lastIndex = 0;

    for (const match of text.matchAll(URL_PATTERN)) {
        const matchIndex = match.index;
        let url = match[0];
        const trailing = url.match(TRAILING_PUNCTUATION);
        if (trailing) {
            url = url.slice(0, url.length - trailing[0].length);
        }
        if (url.length === 0) {
            continue;
        }

        if (matchIndex > lastIndex) {
            segments.push({ text: text.slice(lastIndex, matchIndex) });
        }
        segments.push({ text: url, url });
        lastIndex = matchIndex + url.length;
    }

    if (lastIndex < text.length) {
        segments.push({ text: text.slice(lastIndex) });
    }

    return segments;
}
