import { readJson, writeJson } from "./localStorageJson";

const STORAGE_KEY = "hateview:v1:hiddenUsers";

export interface HiddenUser {
    user: string;
    createdAt: string;
}

/** Hatena IDs: 3-32 characters, starting with a letter, then letters, digits,
 *  `-` or `_`. */
const HATENA_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{2,31}$/;

export function isValidHatenaId(user: string): boolean {
    return HATENA_ID_PATTERN.test(user);
}

function load(): HiddenUser[] {
    return readJson<HiddenUser[]>(STORAGE_KEY, []);
}

function save(users: HiddenUser[]): void {
    writeJson(STORAGE_KEY, users);
}

export function listHiddenUsers(): HiddenUser[] {
    return load();
}

/** Adds `user` (surrounding whitespace removed); a user already on the list
 *  is left as is. Matching is exact, i.e. case-sensitive. */
export function addHiddenUser(user: string): void {
    const name = user.trim();
    if (name === "") {
        return;
    }
    const users = load();
    if (users.some((hidden) => hidden.user === name)) {
        return;
    }
    users.push({ user: name, createdAt: new Date().toISOString() });
    save(users);
}

export function removeHiddenUser(user: string): void {
    save(load().filter((hidden) => hidden.user !== user));
}
