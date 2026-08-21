import { Bookmark, Home, RefreshCw, Settings } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
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

export function Header({ route }: HeaderProps) {
    const buttonRefs = useRef(new Map<Route["name"], HTMLButtonElement>());
    const [indicatorRect, setIndicatorRect] = useState<{
        left: number;
        width: number;
    }>();
    const [reloading, setReloading] = useState(false);

    /** Installed desktop PWA windows commonly have no browser-chrome reload
     *  control, so the app provides its own. `registration.update()` forces a
     *  service-worker freshness check before reloading, so this also picks up
     *  a newly deployed version instead of re-serving the stale precached
     *  shell. That check is a network round-trip, and the old document stays
     *  on screen until the reloaded one paints, so the button spins for the
     *  whole wait to show the click was registered. */
    const handleReload = async () => {
        setReloading(true);
        if ("serviceWorker" in navigator) {
            try {
                const registration =
                    await navigator.serviceWorker.getRegistration();
                await registration?.update();
            } catch {
                // A failed freshness check shouldn't block the reload itself.
            }
        }
        window.location.reload();
    };

    useLayoutEffect(() => {
        const button = buttonRefs.current.get(route.name);
        if (button) {
            setIndicatorRect({
                left: button.offsetLeft,
                width: button.offsetWidth,
            });
        }
    }, [route.name]);

    return (
        <header className="sticky top-0 z-20 border-gray-200 border-b bg-white dark:border-gray-800 dark:bg-gray-950">
            <nav className="relative mx-auto flex h-12 max-w-4xl items-center gap-1 px-2">
                {indicatorRect && (
                    <div
                        aria-hidden="true"
                        className="absolute bottom-0 h-0.5 bg-blue-600 transition-[left,width] duration-200 ease-out dark:bg-blue-400"
                        style={{
                            left: indicatorRect.left,
                            width: indicatorRect.width,
                        }}
                    />
                )}
                {LINKS.map(({ route: linkRoute, path, label, icon: Icon }) => (
                    <button
                        key={path}
                        ref={(el) => {
                            if (el) {
                                buttonRefs.current.set(linkRoute, el);
                            } else {
                                buttonRefs.current.delete(linkRoute);
                            }
                        }}
                        type="button"
                        onClick={() => navigate(path)}
                        aria-current={
                            route.name === linkRoute ? "page" : undefined
                        }
                        className={`flex items-center gap-1.5 border-b-2 border-transparent px-3 py-3 text-sm transition-colors duration-200 ${
                            route.name === linkRoute
                                ? "text-blue-700 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400"
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
                    disabled={reloading}
                >
                    <RefreshCw
                        className={`size-4 ${reloading ? "animate-spin" : ""}`}
                    />
                </IconButton>
            </nav>
        </header>
    );
}
