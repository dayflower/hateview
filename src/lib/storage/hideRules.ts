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

function globToRegExp(glob: string): RegExp {
    const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    const pattern = escaped.replace(/\*/g, ".*").replace(/\?/g, ".");
    return new RegExp(`^${pattern}$`, "i");
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
    if (rule.titleGlob && !globToRegExp(rule.titleGlob).test(entry.title)) {
        return false;
    }
    return true;
}

/** An entry is hidden if any rule matches (OR across rules). */
export function isHidden(entry: HideableEntry, rules: HideRule[]): boolean {
    return rules.some((rule) => matchesRule(entry, rule));
}
