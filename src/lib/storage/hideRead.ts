import { readSessionJson, writeSessionJson } from "./sessionStorageJson";

export const HIDE_READ_STORAGE_KEY = "hateview:v1:hideRead";

export function readHideRead(): boolean {
    return readSessionJson<boolean>(HIDE_READ_STORAGE_KEY, false);
}

export function writeHideRead(hideRead: boolean): void {
    writeSessionJson(HIDE_READ_STORAGE_KEY, hideRead);
}
