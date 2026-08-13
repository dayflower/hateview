import { readJson, writeJson } from "./localStorageJson";

export const THEME_STORAGE_KEY = "hateview:v1:theme";

export type ThemeSetting = "light" | "dark" | "system";

const VALID_SETTINGS: ThemeSetting[] = ["light", "dark", "system"];

export function readThemeSetting(): ThemeSetting {
    const value = readJson<ThemeSetting>(THEME_STORAGE_KEY, "system");
    return VALID_SETTINGS.includes(value) ? value : "system";
}

export function writeThemeSetting(setting: ThemeSetting): void {
    writeJson(THEME_STORAGE_KEY, setting);
}

export function resolveTheme(setting: ThemeSetting): "light" | "dark" {
    if (setting === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }
    return setting;
}

export function applyTheme(setting: ThemeSetting): void {
    const resolved = resolveTheme(setting);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
}
