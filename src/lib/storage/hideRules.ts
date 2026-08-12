import { readJson, writeJson } from "./localStorageJson";

const STORAGE_KEY = "hateview:v1:hideRules";

export interface HideRule {
    id: string;
    domain?: string;
    titleGlob?: string;
    createdAt: string;
}

export interface HideRuleInput {
    domain?: string;
    titleGlob?: string;
}

export interface HideableEntry {
    url: string;
    title: string;
}

function load(): HideRule[] {
    return readJson<HideRule[]>(STORAGE_KEY, []);
}

function save(rules: HideRule[]): void {
    writeJson(STORAGE_KEY, rules);
}

export function listRules(): HideRule[] {
    return load();
}

export function addRule(input: HideRuleInput): HideRule {
    const rule: HideRule = {
        id: crypto.randomUUID(),
        domain: input.domain || undefined,
        titleGlob: input.titleGlob || undefined,
        createdAt: new Date().toISOString(),
    };
    const rules = load();
    rules.push(rule);
    save(rules);
    return rule;
}

export function removeRule(id: string): void {
    save(load().filter((rule) => rule.id !== id));
}

/**
 * Matches `glob` (`*` for any run of characters, `?` for exactly one) against
 * the whole of `text`, case-insensitively.
 *
 * Deliberately not a translation to a regexp: `*` would become `.*`, and a
 * pattern such as `*a*a*a*a*b` would then backtrack for a very long time on a
 * title that doesn't match. This walks the two strings with a single restart
 * point instead, which is bounded by `glob.length * text.length`, and rules are
 * re-checked for every entry on every render.
 */
function matchesGlob(glob: string, text: string): boolean {
    const pattern = glob.toLowerCase();
    const subject = text.toLowerCase();

    let patternIndex = 0;
    let subjectIndex = 0;
    let starIndex = -1;
    let retryIndex = 0;

    while (subjectIndex < subject.length) {
        const patternChar = pattern[patternIndex];
        if (
            patternIndex < pattern.length &&
            (patternChar === "?" || patternChar === subject[subjectIndex])
        ) {
            patternIndex += 1;
            subjectIndex += 1;
        } else if (patternIndex < pattern.length && patternChar === "*") {
            starIndex = patternIndex;
            retryIndex = subjectIndex;
            patternIndex += 1;
        } else if (starIndex >= 0) {
            // Backtrack: let the last `*` swallow one more character.
            retryIndex += 1;
            patternIndex = starIndex + 1;
            subjectIndex = retryIndex;
        } else {
            return false;
        }
    }

    while (pattern[patternIndex] === "*") {
        patternIndex += 1;
    }
    return patternIndex === pattern.length;
}

/** A rule with both `domain` and `titleGlob` requires both to match (AND). */
export function matchesRule(entry: HideableEntry, rule: HideRule): boolean {
    if (!rule.domain && !rule.titleGlob) {
        return false;
    }
    if (
        rule.domain &&
        new URL(entry.url).hostname.toLowerCase() !== rule.domain.toLowerCase()
    ) {
        return false;
    }
    if (rule.titleGlob && !matchesGlob(rule.titleGlob, entry.title)) {
        return false;
    }
    return true;
}

/** An entry is hidden if any rule matches (OR across rules). */
export function isHidden(entry: HideableEntry, rules: HideRule[]): boolean {
    return rules.some((rule) => matchesRule(entry, rule));
}
