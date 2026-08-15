import { Bookmark, Home, RefreshCw, Settings } from "lucide-react";
import type { Route } from "../../router/routes";
import { navigate } from "../../router/useHashRoute";
import { IconButton } from "../common/IconButton";

interface HeaderProps {
    route: Route;
}

const LINKS: {
    route: Route["name"];
    path: string;
    label: string;
    icon: typeof Home;
}[] = [
    { route: "list", path: "/", label: "ホットエントリー", icon: Home },
    { route: "later", path: "/later", label: "あとで読む", icon: Bookmark },
    { route: "settings", path: "/settings", label: "設定", icon: Settings },
];

/** Installed desktop PWA windows commonly have no browser-chrome reload
 *  control, so the app provides its own. `registration.update()` forces a
 *  service-worker freshness check before reloading, so this also picks up a
 *  newly deployed version instead of re-serving the stale precached shell. */
async function handleReload() {
    if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
    }
    window.location.reload();
}

export function Header({ route }: HeaderProps) {
    return (
        <header className="sticky top-0 z-20 border-gray-200 border-b bg-white dark:border-gray-800 dark:bg-gray-950">
            <nav className="mx-auto flex h-12 max-w-4xl items-center gap-1 px-2">
                {LINKS.map(({ route: linkRoute, path, label, icon: Icon }) => (
                    <button
                        key={path}
                        type="button"
                        onClick={() => navigate(path)}
                        aria-current={
                            route.name === linkRoute ? "page" : undefined
                        }
                        className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm ${
                            route.name === linkRoute
                                ? "border-blue-600 text-blue-700 dark:text-blue-400"
                                : "border-transparent text-gray-500 dark:text-gray-400"
                        }`}
                    >
                        <Icon className="size-4" />
                        {label}
                    </button>
                ))}
                <IconButton
                    aria-label="再読み込み"
                    className="ml-auto size-8"
                    onClick={handleReload}
                >
                    <RefreshCw className="size-4" />
                </IconButton>
            </nav>
        </header>
    );
}
