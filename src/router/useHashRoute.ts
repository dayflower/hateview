import { useEffect, useState } from "react";

function currentPath(): string {
    const hash = window.location.hash;
    if (!hash || hash === "#") {
        return "/";
    }
    return hash.slice(1);
}

export function useHashPath(): string {
    const [path, setPath] = useState(currentPath);

    useEffect(() => {
        const onHashChange = () => setPath(currentPath());
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    return path;
}

export function navigate(path: string): void {
    window.location.hash = path;
}
