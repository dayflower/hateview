import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    applyTheme,
    readThemeSetting,
    type ThemeSetting,
    writeThemeSetting,
} from "../storage/theme";

interface ThemeContextValue {
    theme: ThemeSetting;
    setTheme: (theme: ThemeSetting) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeSetting>(() =>
        readThemeSetting(),
    );

    useEffect(() => {
        applyTheme(theme);

        if (theme !== "system") {
            return;
        }
        // Follow OS-level changes live while the setting is "system".
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const listener = () => applyTheme(theme);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [theme]);

    const setTheme = useCallback((next: ThemeSetting) => {
        writeThemeSetting(next);
        setThemeState(next);
    }, []);

    const value = useMemo<ThemeContextValue>(
        () => ({ theme, setTheme }),
        [theme, setTheme],
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return ctx;
}
