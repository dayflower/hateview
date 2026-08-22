import { readJson, writeJson } from "./localStorageJson";

export const DETAIL_TARGET_STORAGE_KEY = "hateview:v1:detailTarget";

/** Where opening an entry from a list takes the user: the app's own detail
 *  page, or straight to Hatena's own bookmark entry page. */
export type DetailTarget = "app" | "official";

const VALID_TARGETS: DetailTarget[] = ["app", "official"];

export function readDetailTarget(): DetailTarget {
    const value = readJson<DetailTarget>(DETAIL_TARGET_STORAGE_KEY, "app");
    return VALID_TARGETS.includes(value) ? value : "app";
}

export function writeDetailTarget(target: DetailTarget): void {
    writeJson(DETAIL_TARGET_STORAGE_KEY, target);
}
