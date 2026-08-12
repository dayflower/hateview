import { useEffect } from "react";

/** Calls `onEscape` for as long as `enabled` is true and the component is mounted. */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
    useEffect(() => {
        if (!enabled) {
            return;
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onEscape();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onEscape, enabled]);
}
