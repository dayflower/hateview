import { useEffect } from "react";

type NavAction = "next" | "prev" | "select";

// A keymap object, not a switch statement, so vim-style bindings (j/k, /) can be
// added later as additive entries rather than a rewrite.
const KEYMAP: Record<string, NavAction> = {
    ArrowDown: "next",
    ArrowUp: "prev",
    Enter: "select",
};

function isTextEntryFocused(): boolean {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement)) {
        return false;
    }
    return (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
    );
}

interface UseKeyboardNavOptions {
    itemCount: number;
    focusedIndex: number;
    onMove: (nextIndex: number) => void;
    onSelect: (index: number) => void;
}

export function useKeyboardNav({
    itemCount,
    focusedIndex,
    onMove,
    onSelect,
}: UseKeyboardNavOptions): void {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (itemCount === 0 || isTextEntryFocused()) {
                return;
            }
            const action = KEYMAP[event.key];
            if (!action) {
                return;
            }
            event.preventDefault();
            if (action === "next") {
                onMove(
                    focusedIndex < 0
                        ? 0
                        : Math.min(focusedIndex + 1, itemCount - 1),
                );
            } else if (action === "prev") {
                onMove(focusedIndex < 0 ? 0 : Math.max(focusedIndex - 1, 0));
            } else if (focusedIndex >= 0) {
                onSelect(focusedIndex);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [itemCount, focusedIndex, onMove, onSelect]);
}
