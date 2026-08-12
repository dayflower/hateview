import { readJson, writeJson } from "./localStorageJson";

const STORAGE_KEY = "hateview:v1:hideNoComment";

export function readHideNoComment(): boolean {
    return readJson<boolean>(STORAGE_KEY, false);
}

export function writeHideNoComment(value: boolean): void {
    writeJson(STORAGE_KEY, value);
}
