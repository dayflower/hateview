/**
 * A leading `[...]` slot. Only ASCII brackets: manga sites put the episode
 * there (`[第62話]`, `[第11歩目]`, `[番外編]`), while news headlines use the
 * full-width `【...】` for something else entirely.
 */
const HEAD_BRACKET = /^\[([^\]]*)\]/u;

/**
 * Episode slots that carry no number. One-shots (`読切`, `読み切り`) are left
 * out on purpose: there is no series to generalize over.
 */
const EPISODE_LABEL = /^(?:番外編|特別編|最終回|最終話|前編|中編|後編)$/u;

/**
 * An episode number. Deliberately limited to the `話` counter — trying to
 * enumerate every counter manga sites use (`歩目`, `幕`, `杯`, ...) starts
 * matching things like `第1次世界大戦` instead. Odd counters are still caught
 * by `HEAD_BRACKET` when they sit in a leading bracket.
 */
const EPISODE = /第?[0-9０-９]+話/gu;

/**
 * Where the episode's own subtitle ends and the parts that stay the same every
 * week (series name, authors, the site) begin.
 */
const SEGMENT_END = /[\]】｜|/）)]| - | ‐ /u;

const DIGIT = /[0-9０-９]/u;

/**
 * Rewrites the episode marker of a serialized-manga title — and the subtitle
 * that follows it — into a `*`, giving a glob that matches every instalment of
 * that series. Returns `null` when the title carries no episode marker.
 *
 * `[第62話]大人大戦 - かっぴー/都筑真佐秋 | 少年ジャンプ＋`
 *   -> `[*]大人大戦 - かっぴー/都筑真佐秋 | 少年ジャンプ＋`
 * `第203話 革命は下から / レッドブルー - 波切昂 | サンデーうぇぶり`
 *   -> `* / レッドブルー - 波切昂 | サンデーうぇぶり`
 *
 * Text *before* the marker is kept, since that is where the series name lives
 * when there is no leading bracket (`秘密法人デスメイカー・第39話 | ...`).
 */
export function toSerialTitleGlob(title: string): string | null {
    let matched = false;
    let head = "";
    let body = title;

    const bracket = HEAD_BRACKET.exec(title);
    if (
        bracket &&
        (DIGIT.test(bracket[1]) || EPISODE_LABEL.test(bracket[1].trim()))
    ) {
        head = "[*]";
        body = title.slice(bracket[0].length);
        matched = true;
    }

    let result = "";
    let cursor = 0;
    EPISODE.lastIndex = 0;
    let episode = EPISODE.exec(body);
    while (episode !== null) {
        const afterEpisode = episode.index + episode[0].length;
        const rest = body.slice(afterEpisode);
        const end = rest.search(SEGMENT_END);
        // Swallow the subtitle too — it changes every week just like the
        // number does. Trailing spaces go back to the remainder so that
        // `第203話 革命は下から / …` keeps the space before its `/`.
        const subtitle = (end === -1 ? rest : rest.slice(0, end)).replace(
            /\s+$/u,
            "",
        );

        result += `${body.slice(cursor, episode.index)}*`;
        cursor = afterEpisode + subtitle.length;
        matched = true;

        EPISODE.lastIndex = cursor;
        episode = EPISODE.exec(body);
    }
    result += body.slice(cursor);

    return matched ? `${head}${result}`.replace(/\*{2,}/gu, "*") : null;
}
